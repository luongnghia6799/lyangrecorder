import { Export } from "@phosphor-icons/react";
import { useLayoutEffect, useRef, useState } from "react";
import { Card } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";
import { ProgressBar } from "@heroui/react";

import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { useI18n } from "@/contexts/I18nContext";
import { ExportSettingsMenu } from "../ExportSettingsMenu";
import type { useExportDimensions } from "../export/useExportDimensions";
import type { useExportSession } from "../export/useExportSession";
import type { useExportSettings } from "../export/useExportSettings";
import type { useExportStatusViewModel } from "../export/useExportStatusViewModel";

type Props = {
	projectPath?: string | null;
	t: ReturnType<typeof useI18n>["t"];
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
	projectTitle: string;
};

export function EditorExportMenu(props: Props) {
	const reducedMotion = useReducedMotion();
	const contentRef = useRef<HTMLDivElement>(null);
	const [contentHeight, setContentHeight] = useState<number>();

	useLayoutEffect(() => {
		if (!props.exportSession.showExportDropdown) return;
		const content = contentRef.current;
		if (!content) return;
		const measure = () => setContentHeight(content.offsetHeight);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(content);
		return () => observer.disconnect();
	}, [props.exportSession.showExportDropdown]);

	const {
		t,
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
		exportQuality,
		setExportQuality,
		exportEncodingMode,
		setExportEncodingMode,
		exportPipelineModel,
		mp4FrameRate,
		setMp4FrameRate,
		exportFormat,
		setExportFormat,
		gifFrameRate,
		setGifFrameRate,
		gifLoop,
		setGifLoop,
		gifSizePreset,
		setGifSizePreset,
		includeCaptionSidecar,
		setIncludeCaptionSidecar,
	} = exportSettings;
	const {
		isExporting,
		exportProgress,
		exportError,
		showExportDropdown,
		setShowExportDropdown,
		exportedFilePath,
		hasPendingExportSave,
	} = exportSession;
	const { gifOutputDimensions, mp4OutputDimensions } = exportDimensions;
	const {
		exportPercentLabel,
		exportRenderSpeedLabel,
		isLightningExportInProgress,
		isRenderingAudio,
		isExportPreparing,
		isExportSaving,
		isExportFinalSaveIndeterminate,
		exportFinalizingProgress,
	} = exportStatus;

	const settingsForm = (
		<ExportSettingsMenu
			nvidiaCudaExportAvailable={nvidiaCudaExportAvailable}
			experimentalNvidiaCudaExport={experimentalNvidiaCudaExport}
			onExperimentalNvidiaCudaExportChange={setExperimentalNvidiaCudaExport}
			exportPipelineModel={exportPipelineModel}
			exportQuality={exportQuality}
			onExportQualityChange={setExportQuality}
			exportEncodingMode={exportEncodingMode}
			onExportEncodingModeChange={setExportEncodingMode}
			mp4FrameRate={mp4FrameRate}
			onMp4FrameRateChange={setMp4FrameRate}
			exportFormat={exportFormat}
			onExportFormatChange={setExportFormat}
			gifFrameRate={gifFrameRate}
			onGifFrameRateChange={setGifFrameRate}
			gifLoop={gifLoop}
			onGifLoopChange={setGifLoop}
			gifSizePreset={gifSizePreset}
			onGifSizePresetChange={setGifSizePreset}
			showCaptionSidecarOption={hasCaptionsForSidecar && exportFormat === "mp4"}
			includeCaptionSidecar={includeCaptionSidecar}
			onIncludeCaptionSidecarChange={setIncludeCaptionSidecar}
			mp4OutputDimensions={mp4OutputDimensions}
			gifOutputDimensions={gifOutputDimensions}
			onExport={handleStartExportFromDropdown}
			hideHeading
			className="rounded-none bg-transparent px-5 pb-5 pt-3 shadow-none"
		/>
	);

	return (
		<>
			<Popover
				open={showExportDropdown}
				onOpenChange={(open) => {
					if (open) {
						handleOpenExportDropdown();
					} else setShowExportDropdown(false);
				}}
				modal={true}
			>
				<PopoverTrigger asChild>
					<Button
						type="button"
						className="inline-flex h-8 min-w-[90px] items-center justify-center gap-1.5 px-3.5 rounded-full font-semibold text-xs tracking-tight text-white bg-[#0D5C3A] hover:bg-[#0A482D] shadow-xs active:scale-[0.98] transition-all"
					>
						<Export weight="bold" className="size-3.5" />
						<span className="text-xs font-semibold tracking-wide">{t("common.actions.export", "Xuất video")}</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent
					aria-label={t("settings.export.title", "Xuất video")}
					align="end"
					sideOffset={10}
					className="w-[360px] max-h-none overflow-hidden p-0 rounded-2xl border border-[#E8DED3] bg-white shadow-xl"
				>
					<motion.div
						initial={false}
						animate={{ height: contentHeight ?? "auto" }}
						transition={{ duration: reducedMotion ? 0 : 0.22, ease: "easeInOut" }}
						className="overflow-hidden"
					>
						<div ref={contentRef}>
							<div>
								{isExporting ? (
									<Card className="rounded-none bg-transparent p-5 text-foreground shadow-none">
										<div className="mb-3 flex items-center justify-between gap-3">
											<div>
												<p className="text-sm font-semibold text-[#1C1917]">
													{t("editor.exportStatus.exporting", "Exporting")}
												</p>
												<p className="text-xs text-[#78716C]">
													{t("editor.exportStatus.renderingFile", "Rendering your file.")}
												</p>
												{isLightningExportInProgress && exportMessage ? (
													<p className="mt-1 text-[11px] leading-relaxed text-[#78716C]">
														{exportMessage}
													</p>
												) : null}
											</div>
											<Button
												type="button"
												variant="outline"
												onClick={handleCancelExport}
												className="h-8 px-3 text-xs rounded-full border border-[#E8DED3]"
											>
												{t("common.actions.cancel")}
											</Button>
										</div>
										<ProgressBar
											aria-label={t("editor.exportStatus.exporting", "Exporting")}
											isIndeterminate={
												isExportPreparing ||
												isExportSaving ||
												isExportFinalSaveIndeterminate
											}
											value={Math.min(
												isRenderingAudio
													? (exportProgress?.audioProgress ?? 0) * 100
													: (exportFinalizingProgress ??
															exportProgress?.percentage ??
															8),
												100,
											)}
										>
											<ProgressBar.Track className="bg-[#FAF6F0] rounded-full">
												<ProgressBar.Fill className="bg-[#0D5C3A] rounded-full" />
											</ProgressBar.Track>
										</ProgressBar>
										<p className="mt-2 text-xs font-mono font-medium text-[#78716C]">
											{exportPercentLabel}
										</p>
										{isRenderingAudio ? (
											<p className="mt-1 text-[11px] text-[#78716C]">
												{t(
													"editor.export.processingAudioEdits",
													"Processing audio with speed/overlay edits",
												)}
											</p>
										) : exportRenderSpeedLabel ? (
											<p className="mt-1 text-[11px] text-[#78716C]">
												{exportRenderSpeedLabel}
											</p>
										) : null}
									</Card>
								) : exportError ? (
									<Card className="rounded-none bg-transparent p-5 text-foreground shadow-none">
										<p className="text-sm font-semibold text-destructive">
											{t("editor.exportStatus.failed", "Export failed")}
										</p>
										<p className="mt-1 select-text whitespace-pre-wrap break-words text-xs leading-relaxed text-[#78716C]">
											{exportError}
										</p>
										<div className="mt-4 flex gap-2">
											<Button
												type="button"
												variant="outline"
												className="h-8 text-xs rounded-full border border-[#E8DED3]"
												onClick={async () => {
													try {
														await navigator.clipboard.writeText(exportError);
														toast.success(
															t(
																"editor.exportStatus.errorCopied",
																"Error copied",
															),
														);
													} catch {
														toast.error(
															t(
																"editor.exportStatus.errorCopyFailed",
																"Couldn't copy.",
															),
														);
													}
												}}
											>
												{t("editor.exportStatus.copyError", "Copy error")}
											</Button>
											{hasPendingExportSave ? (
												<Button
													type="button"
													onClick={handleRetrySaveExport}
													className="h-8 flex-1 text-xs rounded-full bg-[#0D5C3A] text-white"
												>
													{t("editor.actions.saveAgain", "Save Again")}
												</Button>
											) : null}
											<Button
												type="button"
												variant="outline"
												onClick={handleExportDropdownClose}
												className="h-8 flex-1 text-xs rounded-full border border-[#E8DED3]"
											>
												{t("common.actions.close", "Close")}
											</Button>
										</div>
									</Card>
								) : exportedFilePath ? (
									<Card className="rounded-none bg-transparent p-5 text-foreground shadow-none">
										<p className="text-sm font-semibold text-[#0D5C3A]">
											{t("editor.exportStatus.complete", "Export complete")}
										</p>
										<p className="mt-1 text-xs text-[#78716C]">
											{t(
												"editor.exportStatus.savedSuccessfully",
												"Your file was saved successfully.",
											)}
										</p>
										<p className="mt-3 truncate text-xs font-mono text-[#78716C]">
											{exportedFilePath.split(/[\\/]/).pop()}
										</p>
										<div className="mt-4 flex gap-2">
											<Button
												type="button"
												onClick={revealExportedFile}
												className="h-8 flex-1 text-xs rounded-full bg-[#0D5C3A] text-white"
											>
												{t("editor.actions.showInFolder", "Show In Folder")}
											</Button>
											<Button
												type="button"
												variant="outline"
												onClick={handleExportDropdownClose}
												className="h-8 flex-1 text-xs rounded-full border border-[#E8DED3]"
											>
												{t("common.actions.close", "Close")}
											</Button>
										</div>
									</Card>
								) : (
									<>{settingsForm}</>
								)}
							</div>
						</div>
					</motion.div>
				</PopoverContent>
			</Popover>
		</>
	);
}
