import {
	Camera,
	ClosedCaptioning,
	Cursor,
	Gear,
	FrameCorners,
	MagnifyingGlassPlus,
	Palette,
} from "@/components/ui/icons";
import {
	ToggleButtonGroup,
	ToggleButton,
	Tooltip,
	Card,
	Switch,
	Label,
} from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";
import { useMemo, useState } from "react";
import type { useI18n } from "@/contexts/I18nContext";
import ExtensionManager from "../ExtensionManager";
import { SettingsPanel } from "../SettingsPanel";
import type { EditorEffectSection } from "../types";

type Props = {
	panelContent?: ReactNode;
	t: ReturnType<typeof useI18n>["t"];
	activeSection: EditorEffectSection;
	setActiveSection: (section: EditorEffectSection) => void;
	settingsPanelProps: ComponentProps<typeof SettingsPanel>;
};

export function EditorSidebar({
	t,
	activeSection,
	setActiveSection,
	settingsPanelProps,
	panelContent,
}: Props) {
	const [advancedSections, setAdvancedSections] = useState<Record<string, boolean>>({});
	const advanced = advancedSections[activeSection] ?? false;
	const hasAdvanced =
		!settingsPanelProps.selectedAnnotationId &&
		["scene", "frame", "crop", "cursor", "webcam", "captions", "settings", "zoom"].includes(
			activeSection,
		);

	const sections = useMemo(
		() => [
			{
				id: "scene" as const,
				label: t("settings.sections.scene", "Scene"),
				icon: FrameCorners,
			},
			{ id: "cursor" as const, label: t("settings.sections.cursor", "Cursor"), icon: Cursor },
			{ id: "webcam" as const, label: t("settings.sections.webcam", "Webcam"), icon: Camera },
			{
				id: "captions" as const,
				label: t("settings.sections.captions", "Captions"),
				icon: ClosedCaptioning,
			},
			{
				id: "settings" as const,
				label: t("settings.sections.settings", "Settings"),
				icon: Gear,
			},
		],
		[t],
	);

	const inspectorTabs = useMemo(
		() => [
			{ id: "zoom" as const, label: "Zoom", icon: MagnifyingGlassPlus },
			{ id: "frame" as const, label: "Khung", icon: FrameCorners },
			{ id: "scene" as const, label: "Nền", icon: Palette },
			{ id: "cursor" as const, label: "Chuột", icon: Cursor },
		],
		[],
	);

	return (
		<div className="flex min-h-0 shrink-0 pb-3 pl-3 pr-2">
			{/* Left vertical icon bar */}
			<nav
				aria-label={t("settings.sections.title", "Editor tools")}
				className="flex w-12 shrink-0 flex-col items-center gap-2 py-1 pr-2"
			>
				<ToggleButtonGroup
					orientation="vertical"
					isDetached
					className="w-full items-center gap-2"
					selectionMode="single"
					disallowEmptySelection
					selectedKeys={panelContent ? [] : [activeSection]}
					onSelectionChange={(keys) => {
						const key = Array.from(keys)[0];
						if (key) setActiveSection(key as EditorEffectSection);
					}}
				>
					{sections.map((section) => {
						const isSelected = !panelContent && activeSection === section.id;
						return (
							<Tooltip key={section.id}>
								<ToggleButton
									id={section.id}
									variant="ghost"
									isIconOnly
									aria-label={section.label}
									className={`size-9 rounded-xl transition-all duration-150 ${isSelected
										? "bg-[#0D5C3A] text-white shadow-xs hover:bg-[#0D5C3A]"
										: "text-[#78716C] hover:bg-[#E8DED3]/40 hover:text-[#1C1917]"
										}`}
								>
									<section.icon
										weight={isSelected ? "fill" : "regular"}
										className="size-4.5"
									/>
								</ToggleButton>
								<Tooltip.Content placement="right">{section.label}</Tooltip.Content>
							</Tooltip>
						);
					})}
				</ToggleButtonGroup>
			</nav>

			{/* Main Inspector Card */}
			<aside
				aria-label={panelContent ? "Clips" : undefined}
				className="editor-inspector [--text-sm:0.8125rem] [--text-base:0.8125rem] flex w-[330px] min-h-0 flex-col"
			>
				<Card className="min-h-0 flex-1 gap-0 overflow-hidden p-0 rounded-2xl border border-[#E8DED3] bg-white shadow-xs">
					{panelContent ?? (
						<>
							{/* Inspector Title */}
							<header className="flex shrink-0 flex-col gap-2.5 px-4 pt-3.5 pb-2.5 border-b border-[#E8DED3]">
								<div className="flex items-center justify-between gap-2 min-w-0">
									<div className="flex items-center gap-1.5 text-[#0D5C3A] font-bold text-xs tracking-wide uppercase select-none whitespace-nowrap min-w-0">
										<span>🎛️</span>
										<span className="truncate">Tùy chỉnh</span>
									</div>
									{hasAdvanced && (
										<Switch
											size="sm"
											className="shrink-0"
											isSelected={advanced}
											onChange={(value) =>
												setAdvancedSections((current) => ({
													...current,
													[activeSection]: value,
												}))
											}
											aria-label="Cài đặt nâng cao"
										>
											<Switch.Content className="flex items-center gap-1.5 whitespace-nowrap">
												<Label className="text-[11px] text-[#78716C] font-medium whitespace-nowrap shrink-0 select-none">Nâng cao</Label>
												<Switch.Control>
													<Switch.Thumb />
												</Switch.Control>
											</Switch.Content>
										</Switch>
									)}
								</div>

								{/* Category Pills matching screenshot */}
								<div
									className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5"
									style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
								>
									{inspectorTabs.map((tab) => {
										const isActive = activeSection === tab.id;
										return (
											<button
												key={tab.id}
												type="button"
												onClick={() => setActiveSection(tab.id as EditorEffectSection)}
												className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-150 ${isActive
													? "bg-[#0D5C3A] text-white shadow-xs"
													: "text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF6F0]"
													}`}
											>
												<tab.icon className="size-3" />
												<span>{tab.label}</span>
											</button>
										);
									})}
								</div>
							</header>

							{/* Panel Content */}
							<div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
								{activeSection === "zoom" && !settingsPanelProps.selectedZoomId ? (
									/* Zoom Empty State matching screenshot */
									<div className="p-4 flex flex-col items-center justify-center min-h-[300px]">
										<div className="w-full bg-[#FAF6F0] rounded-2xl border border-[#E8DED3] p-6 flex flex-col items-center justify-center text-center">
											<div className="size-12 rounded-full border border-[#E8DED3] bg-white flex items-center justify-center text-[#78716C] mb-3 shadow-xs">
												<MagnifyingGlassPlus className="size-6 text-[#78716C]" />
											</div>
											<h3 className="font-bold text-sm text-[#1C1917] mb-1">
												Chưa chọn khối Zoom nào
											</h3>
											<p className="text-xs text-[#78716C] leading-relaxed max-w-[210px]">
												Click vào một khối trên dòng thời gian hoặc bấm phím <kbd className="px-1 py-0.5 bg-white border border-[#E8DED3] rounded text-[10px] font-mono text-[#1C1917] shadow-2xs">Z</kbd> để thêm đoạn Zoom mới.
											</p>
										</div>
									</div>
								) : activeSection === "extensions" ? (
									<ExtensionManager />
								) : (
									<SettingsPanel {...settingsPanelProps} advanced={advanced} />
								)}
							</div>
						</>
					)}
				</Card>
			</aside>
		</div>
	);
}
