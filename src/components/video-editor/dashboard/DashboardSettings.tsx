import { SettingsSections, SettingsCategory } from "../SettingsSections";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { SettingsRow } from "../SettingsRow";
import { Switch } from "@/components/ui/switch";
import { supportsHudCaptureProtection } from "@/lib/hudCaptureProtection";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useAppFont } from "@/contexts/FontContext";
export const DashboardSettingsContext = createContext<ReactNode>(null);
export function DashboardSettings({ onImportFile }: { onImportFile: () => Promise<void> }) {
	const settingsContent = useContext(DashboardSettingsContext);
	const { font, setFont } = useAppFont();
	const [directory, setDirectory] = useState("");
	const [recordings, setRecordings] = useState("");
	const [hideHud, setHideHud] = useState(true);
	const [captureSupported, setCaptureSupported] = useState(false);
	const [busy, setBusy] = useState(false);
	const run = async (action: () => Promise<void>) => {
		setBusy(true);
		try {
			await action();
		} catch (error) {
			toast.error(String(error));
		} finally {
			setBusy(false);
		}
	};
	useEffect(() => {
		let active = true;
		void Promise.all([
			window.electronAPI.getRecordingsDirectory(),
			window.electronAPI.getHudOverlayCaptureProtection(),
			window.electronAPI.getPlatform(),
		])
			.then(([directory, protection, platform]) => {
				if (!active) return;
				if (directory.success) setRecordings(directory.path);
				if (protection.success) setHideHud(protection.enabled);
				setCaptureSupported(supportsHudCaptureProtection(platform));
			})
			.catch((error) => toast.error(String(error)));
		return () => {
			active = false;
		};
	}, []);
	return (
		<section aria-label="Cài đặt bảng điều khiển" className="dashboard-settings max-w-2xl py-10">
			<h1 className="mb-8 text-lg font-semibold">Cài đặt</h1>
			<SettingsSections
				categories={[
					"general",
					"account",
					"permissions",
					"motion",
					"recording",
					"files",
					"advanced",
				]}
			>
				<SettingsCategory
					category={["general", "account", "permissions", "motion", "advanced"]}
				>
					{settingsContent}
				</SettingsCategory>
				<SettingsCategory category="general">
					<SettingsRow
						title="Giao diện & Phông chữ"
						description="Chọn phông chữ hiển thị cho toàn bộ ứng dụng"
					>
						<div className="flex items-center gap-2">
							<Button
								variant={font === "default" ? "default" : "secondary"}
								size="sm"
								className="rounded-full text-xs"
								onClick={() => setFont("default")}
							>
								Mặc định (DM Sans)
							</Button>
							<Button
								variant={font === "space-grotesk" ? "default" : "secondary"}
								size="sm"
								className="rounded-full text-xs"
								onClick={() => setFont("space-grotesk")}
								style={{ fontFamily: "Space Grotesk, sans-serif" }}
							>
								Space Grotesk
							</Button>
						</div>
					</SettingsRow>
				</SettingsCategory>
				<SettingsCategory category="files">
					<SettingsRow title="Mở video hoặc dự án">
						<Button
							variant="secondary"
							size="sm"
							disabled={busy}
							onClick={() => void run(onImportFile)}
						>
							Mở tệp
						</Button>
					</SettingsRow>
				</SettingsCategory>
				<SettingsCategory category="recording">
					<SettingsRow
						title="Thư mục lưu video"
						description={
							<span className="block truncate" title={recordings}>
								{recordings}
							</span>
						}
					>
						<Button
							variant="secondary"
							size="sm"
							disabled={busy}
							onClick={() =>
								void run(async () => {
									const result =
										await window.electronAPI.chooseRecordingsDirectory();
									if (result.canceled) return;
									if (!result.success || !result.path)
										throw Error("Could not change recordings folder");
									setRecordings(result.path);
								})
							}
						>
							Đổi thư mục
						</Button>
					</SettingsRow>
					{captureSupported && (
						<SettingsRow
							title="Ẩn thanh điều khiển khỏi video"
							description="Chỉ khi đang quay. Thanh điều khiển sẽ tự động ẩn để không làm vướng video."
						>
							<Switch
								aria-label="Ẩn thanh điều khiển khỏi video"
								checked={hideHud}
								disabled={busy}
								onCheckedChange={(enabled) =>
									void run(async () => {
										const result =
											await window.electronAPI.setHudOverlayCaptureProtection(
												enabled,
											);
										if (!result.success)
											throw Error("Could not update capture protection");
										setHideHud(result.enabled);
									})
								}
							/>
						</SettingsRow>
					)}
				</SettingsCategory>
				<SettingsCategory category="advanced">
					{import.meta.env.DEV && (
						<SettingsRow title="Xem trước thông báo cập nhật">
							<Button
								variant="secondary"
								size="sm"
								disabled={busy}
								onClick={() =>
									void run(async () => {
										await window.electronAPI.previewUpdateToast();
									})
								}
							>
								Xem trước
							</Button>
						</SettingsRow>
					)}
				</SettingsCategory>
				<SettingsCategory category="files">
					<SettingsRow
						title="Thư mục lưu dự án"
						description={directory || "Dự án được lưu tự động."}
					>
						<Button
							variant="secondary"
							size="sm"
							onClick={async () => {
								try {
									const result = await window.electronAPI.getProjectsDirectory();
									if (!result.success || !result.path)
										throw Error("Could not open projects folder");
									setDirectory(result.path);
									await window.electronAPI.revealInFolder(result.path);
								} catch (e) {
									toast.error(String(e));
								}
							}}
						>
							Mở thư mục
						</Button>
					</SettingsRow>
					<p className="text-xs text-muted-foreground">
						Dự án có tên sẽ được tự động lưu. Xem trước sẽ làm mới khi bạn quay lại Trang chủ.
					</p>
				</SettingsCategory>
			</SettingsSections>
		</section>
	);
}
