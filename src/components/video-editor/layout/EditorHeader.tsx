import { Dropdown, Separator } from "@heroui/react";
import {
	Check,
	House,
	FilmStrip,
	MonitorIcon,
	Smartphone,
	SquareFrame,
	TextFormat,
	Tv,
	ArrowClockwise as Redo2,
	ArrowCounterClockwise as Undo2,
} from "@/components/ui/icons";
import { useAppFont } from "@/contexts/FontContext";
import type { CSSProperties, FormEvent, RefObject } from "react";
import { Button } from "@/components/ui/button";
import type { useI18n } from "@/contexts/I18nContext";
import type { AspectRatio } from "@/utils/aspectRatioUtils";
import type { useExportDimensions } from "../export/useExportDimensions";
import type { useExportSession } from "../export/useExportSession";
import type { useExportSettings } from "../export/useExportSettings";
import type { useExportStatusViewModel } from "../export/useExportStatusViewModel";
import type { useVideoEditorPresets } from "../presets/useVideoEditorPresets";
import type { useProjectState } from "../state/useProjectState";
import { EditorExportMenu } from "./EditorExportMenu";
import { EditorPresetMenu } from "./EditorPresetMenu";

// Keep the preset implementation available for future use.
const SHOW_PRESETS_BUTTON = false;

type Props = {
	aspectRatio?: AspectRatio;
	setAspectRatio?: (aspectRatio: AspectRatio) => void;
	clipsOpen: boolean;
	onToggleClips: () => void;
	t: ReturnType<typeof useI18n>["t"];
	headerLeftControlsPaddingClass: string;
	project: ReturnType<typeof useProjectState>;
	projectBrowserTriggerRef: RefObject<HTMLButtonElement | null>;
	projectNameInputRef: RefObject<HTMLInputElement | null>;
	projectDisplayName: string;
	hasUnsavedChanges: boolean;
	canUndo: boolean;
	canRedo: boolean;
	handleOpenProjectBrowser: () => void;
	handleUndo: () => void;
	handleRedo: () => void;
	handleProjectNameSubmit: (event?: FormEvent<HTMLFormElement>) => void;
	closeProjectNameEditor: () => void;
	presets: ReturnType<typeof useVideoEditorPresets>;
	exportSettings: ReturnType<typeof useExportSettings>;
	exportSession: ReturnType<typeof useExportSession>;
	exportDimensions: ReturnType<typeof useExportDimensions>;
	exportStatus: ReturnType<typeof useExportStatusViewModel>;
	hasCaptionsForSidecar: boolean;
	nvidiaCudaExportAvailable: boolean;
	experimentalNvidiaCudaExport: boolean;
	setExperimentalNvidiaCudaExport: (enabled: boolean) => void;
	handleOpenExportDropdown: () => void;
	handleExportDropdownClose: () => void;
	handleCancelExport: () => void;
	handleRetrySaveExport: () => void;
	handleStartExportFromDropdown: () => void;
	revealExportedFile: () => void;
	exportMessage: string | null;
};

export function EditorHeader(props: Props) {
	const {
		t,
		headerLeftControlsPaddingClass,
		project,
		projectBrowserTriggerRef,
		projectNameInputRef,
		projectDisplayName,
		canUndo,
		canRedo,
		handleOpenProjectBrowser,
		handleUndo,
		handleRedo,
		handleProjectNameSubmit,
		closeProjectNameEditor,
		presets,
		exportSettings,
		exportSession,
		exportDimensions,
		exportStatus,
		hasCaptionsForSidecar,
		nvidiaCudaExportAvailable,
		experimentalNvidiaCudaExport,
		setExperimentalNvidiaCudaExport,
		handleOpenExportDropdown,
		handleExportDropdownClose,
		handleCancelExport,
		handleRetrySaveExport,
		handleStartExportFromDropdown,
		revealExportedFile,
		exportMessage,
	} = props;
	const {
		isEditingProjectName,
		setIsEditingProjectName,
		projectNameDraft,
		setProjectNameDraft,
		isSavingProjectName,
	} = project;
	const { font, setFont } = useAppFont();

	return (
		<header
			className="editor-header [--text-sm:0.8125rem] relative z-50 flex h-14 shrink-0 items-center justify-between border-b border-[#E8DED3] bg-[#F6EFE9] px-4"
			style={{ WebkitAppRegion: "drag" } as CSSProperties}
		>
			<div
				className={`editor-header-start flex min-w-0 items-center gap-2 ${headerLeftControlsPaddingClass}`}
				style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
			>
				<img
					src="/mascot.png"
					alt="LyangRecorder"
					className="size-7 rounded-lg object-cover shadow-2xs border border-[#E8DED3]"
				/>
				<div className="flex items-center gap-1.5">
					<span className="text-[13px] font-bold text-[#1C1917] tracking-tight">LyangRecorder</span>
					<span className="px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full bg-[#E8F5E9] text-[#0D5C3A] border border-[#C8E6C9]">
						PRO
					</span>
				</div>
				<span className="text-[11px] text-[#78716C] ml-1 font-mono font-medium">
					{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
				</span>

				<Separator orientation="vertical" className="mx-2 h-4 shrink-0 self-center opacity-30" />

				<Button
					ref={projectBrowserTriggerRef}
					type="button"
					variant="ghost"
					size="sm"
					onClick={handleOpenProjectBrowser}
					className="h-8 shrink-0 gap-1.5 px-3 rounded-full border border-[#E8DED3] bg-white hover:bg-[#FAF6F0] text-xs font-semibold text-[#1C1917] shadow-xs"
					title={t("launch.recording.home", "Trang chủ")}
					aria-label={t("launch.recording.home", "Trang chủ")}
				>
					<House weight="fill" className="size-3.5 text-[#0D5C3A]" />
					<span>{t("launch.recording.home", "Trang chủ")}</span>
				</Button>

				<div
					className="editor-header-title flex min-w-0 items-center gap-1.5"
					style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
				>
					{isEditingProjectName ? (
						<form
							onSubmit={(event) => void handleProjectNameSubmit(event)}
							className="flex w-full min-w-0 items-center gap-1.5 px-1"
						>
							<input
								ref={projectNameInputRef}
								type="text"
								value={projectNameDraft}
								onChange={(event) => setProjectNameDraft(event.target.value)}
								onBlur={() => {
									if (
										!isSavingProjectName &&
										projectNameDraft.trim() !== projectDisplayName
									)
										void handleProjectNameSubmit();
									else if (!isSavingProjectName) closeProjectNameEditor();
								}}
								onKeyDown={(event) => {
									if (event.key === "Escape") {
										event.preventDefault();
										closeProjectNameEditor();
									}
								}}
								disabled={isSavingProjectName}
								className="inline-project-name h-7.5 min-w-0 max-w-full text-xs font-semibold tracking-tight text-[#1C1917] disabled:cursor-wait px-2 rounded-lg bg-white border border-[#0D5C3A]"
								style={{ width: `${Math.max(12, projectNameDraft.length + 1)}ch` }}
								aria-label={t("editor.project.renameInput", "Project name")}
							/>
						</form>
					) : (
						<Button
							variant="ghost"
							type="button"
							onClick={() => setIsEditingProjectName(true)}
							className="inline-flex h-8 min-w-0 max-w-full items-center gap-1.5 rounded-full px-2.5 hover:bg-white/60 transition-colors"
							title={t("editor.project.renameTitle", "Rename project")}
							aria-label={t("editor.project.renameTitle", "Rename project")}
						>
							<span className="truncate text-xs font-semibold tracking-tight text-[#1C1917]">
								{projectDisplayName}
							</span>
							<span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-[#E8F5E9] text-[#0D5C3A] border border-[#C8E6C9]">
								<span className="size-1 rounded-full bg-[#0D5C3A]" />
								Đã lưu
							</span>
						</Button>
					)}
				</div>
				<Separator orientation="vertical" className="mx-2 h-4 shrink-0 self-center opacity-30" />
				<Button
					variant="secondary"
					size="sm"
					className="h-8 shrink-0 gap-1.5 rounded-full border border-[#E8DED3] bg-white hover:bg-[#FAF6F0] text-xs font-semibold text-[#1C1917] shadow-xs"
					aria-expanded={props.clipsOpen}
					onClick={props.onToggleClips}
				>
					<FilmStrip weight={props.clipsOpen ? "fill" : "regular"} className="size-3.5 text-[#0D5C3A]" />
					Đoạn cắt
				</Button>
			</div>

			{/* Center: Aspect Ratio selector from design */}
			<div
				className="editor-header-center hidden md:flex items-center p-1 rounded-full bg-white border border-[#E8DED3] shadow-xs"
				style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
			>
				{(["16:9", "9:16", "1:1", "4:3"] as const).map((ratio) => {
					const active = (props.aspectRatio ?? "16:9") === ratio;
					return (
						<button
							key={ratio}
							type="button"
							onClick={() => props.setAspectRatio?.(ratio)}
							className={`px-3 py-1 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
								active
									? "bg-[#0D5C3A] text-white shadow-xs font-bold"
									: "text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF6F0]"
							}`}
						>
							{ratio === "16:9" && <MonitorIcon size={14} className="size-3.5 shrink-0" />}
							{ratio === "9:16" && <Smartphone size={14} className="size-3.5 shrink-0" />}
							{ratio === "1:1" && <SquareFrame size={14} className="size-3.5 shrink-0" />}
							{ratio === "4:3" && <Tv size={14} className="size-3.5 shrink-0" />}
							<span>{ratio}</span>
						</button>
					);
				})}
			</div>

			<div
				className="editor-header-end flex min-w-0 items-center justify-self-end gap-2"
				style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
			>
				{/* Font Selector */}
				<Dropdown>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 gap-1.5 rounded-full border border-[#E8DED3] bg-white px-2.5 text-xs font-semibold text-[#1C1917] shadow-xs hover:bg-[#FAF6F0]"
						title="Chọn phông chữ"
						aria-label="Chọn phông chữ"
					>
						<TextFormat size={15} className="size-3.5 text-[#0D5C3A]" />
						<span className="hidden xl:inline">{font === "space-grotesk" ? "Space Grotesk" : "DM Sans"}</span>
					</Button>
					<Dropdown.Popover placement="bottom end">
						<Dropdown.Menu aria-label="Chọn phông chữ">
							<Dropdown.Item id="default" onAction={() => setFont("default")}>
								<div className="flex items-center justify-between w-full gap-4 text-xs">
									<span className="font-sans">Mặc định (DM Sans)</span>
									{font !== "space-grotesk" && <Check className="size-3.5 text-[#0D5C3A]" />}
								</div>
							</Dropdown.Item>
							<Dropdown.Item id="space-grotesk" onAction={() => setFont("space-grotesk")}>
								<div className="flex items-center justify-between w-full gap-4 text-xs">
									<span style={{ fontFamily: "Space Grotesk, sans-serif" }}>Space Grotesk</span>
									{font === "space-grotesk" && <Check className="size-3.5 text-[#0D5C3A]" />}
								</div>
							</Dropdown.Item>
						</Dropdown.Menu>
					</Dropdown.Popover>
				</Dropdown>

				{/* Red Record Button from image */}
				<button
					type="button"
					onClick={() => void window.electronAPI.showRecordingHud()}
					title="Ghi hình nhanh (F9)"
					className="size-8 rounded-full bg-[#E11D48] hover:bg-[#D01640] text-white flex items-center justify-center shadow-xs transition-transform active:scale-95"
				>
					<span className="size-3 rounded-full bg-white" />
				</button>

				<div className="flex items-center gap-0.5 p-0.5 rounded-full border border-[#E8DED3] bg-white">
					<Button
						type="button"
						variant="ghost"
						onClick={handleUndo}
						disabled={!canUndo}
						className="size-7 min-w-7 rounded-full items-center justify-center p-0 disabled:opacity-30 hover:bg-[#FAF6F0]"
						title={t("common.actions.undo", "Hoàn tác")}
						aria-label={t("common.actions.undo", "Hoàn tác")}
					>
						<Undo2 className="size-3 text-[#1C1917]" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						onClick={handleRedo}
						disabled={!canRedo}
						className="size-7 min-w-7 rounded-full items-center justify-center p-0 disabled:opacity-30 hover:bg-[#FAF6F0]"
						title={t("common.actions.redo", "Làm lại")}
						aria-label={t("common.actions.redo", "Làm lại")}
					>
						<Redo2 className="size-3 text-[#1C1917]" />
					</Button>
				</div>
				{SHOW_PRESETS_BUTTON && <EditorPresetMenu t={t} presets={presets} />}
				<EditorExportMenu
					t={t}
					exportSettings={exportSettings}
					exportSession={exportSession}
					exportDimensions={exportDimensions}
					exportStatus={exportStatus}
					hasCaptionsForSidecar={hasCaptionsForSidecar}
					nvidiaCudaExportAvailable={nvidiaCudaExportAvailable}
					experimentalNvidiaCudaExport={experimentalNvidiaCudaExport}
					setExperimentalNvidiaCudaExport={setExperimentalNvidiaCudaExport}
					handleOpenExportDropdown={handleOpenExportDropdown}
					handleExportDropdownClose={handleExportDropdownClose}
					handleCancelExport={handleCancelExport}
					handleRetrySaveExport={handleRetrySaveExport}
					handleStartExportFromDropdown={handleStartExportFromDropdown}
					revealExportedFile={revealExportedFile}
					exportMessage={exportMessage}
					projectPath={project.currentProjectPath}
					projectTitle={projectDisplayName}
				/>
			</div>
		</header>
	);
}
