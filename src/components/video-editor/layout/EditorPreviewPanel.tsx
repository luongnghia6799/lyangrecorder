import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
	CaretDown,
	Check,
	Crop,
	MagicWand,
	Pause,
	Play,
	Plus,
	Scissors,
	SpeakerHigh,
	SpeakerLow,
	SpeakerX,
	VideoCamera,
	UploadSimple,
	BoundingBox,
	Cursor,
} from "@/components/ui/icons";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { useI18n } from "@/contexts/I18nContext";
import { ASPECT_RATIOS, type AspectRatio, getAspectRatioLabel } from "@/utils/aspectRatioUtils";
import type { useVideoEditorAudio } from "../audio/useVideoEditorAudio";
import type { CaptionEditTarget } from "../captionEditing";
import type { useAnnotationRegionCommands } from "../hooks/useAnnotationRegionCommands";
import type { useEditorPlaybackControls } from "../hooks/useEditorPlaybackControls";
import type { useTimelineProjection } from "../hooks/useTimelineProjection";
import type { useZoomRegionCommands } from "../hooks/useZoomRegionCommands";
import type { useAppearanceState } from "../state/useAppearanceState";
import type { useTimelineState } from "../state/useTimelineState";
import type { TimelineEditorHandle } from "../timeline/TimelineEditor";
import type { VideoPlaybackRef } from "../VideoPlayback";
import { EditorVideoPreview } from "./EditorVideoPreview";

type Props = {
	t: ReturnType<typeof useI18n>["t"];
	videoPath: string | null;
	previewVersion: number;
	aspectRatio: AspectRatio;
	setAspectRatio: Dispatch<SetStateAction<AspectRatio>>;
	previewAspectRatioValue: number;
	videoPlaybackRef: RefObject<VideoPlaybackRef | null>;
	timelineRef: RefObject<TimelineEditorHandle | null>;
	currentTime: number;
	isPlaying: boolean;
	previewVolume: number;
	setPreviewVolume: Dispatch<SetStateAction<number>>;
	suspendRendering: boolean;
	appearance: ReturnType<typeof useAppearanceState>;
	timeline: ReturnType<typeof useTimelineState>;
	audio: ReturnType<typeof useVideoEditorAudio>;
	projection: ReturnType<typeof useTimelineProjection>;
	playback: ReturnType<typeof useEditorPlaybackControls>;
	zoomCommands: ReturnType<typeof useZoomRegionCommands>;
	annotationCommands: ReturnType<typeof useAnnotationRegionCommands>;
	effectiveCursorTelemetry: ReturnType<typeof useTimelineState>["cursorTelemetry"];
	effectiveShowCursor: boolean;
	isCropped: boolean;
	handleOpenCropEditor: () => void;
	handleSaveAutoCaptionEdit: (target: CaptionEditTarget, text: string) => void;
	handleSelectAnnotation: (id: string | null) => void;
	setDuration: Dispatch<SetStateAction<number>>;
	isPreviewReady: boolean;
	setIsPreviewReady: Dispatch<SetStateAction<boolean>>;
	setCurrentTime: Dispatch<SetStateAction<number>>;
	setIsPlaying: Dispatch<SetStateAction<boolean>>;
	setError: (message: string | null) => void;
	onStartRecording?: () => void;
	onImportMedia?: () => void;
};

function formatTimePrecise(seconds: number) {
	if (!Number.isFinite(seconds) || seconds < 0) return "00:00.0";
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	const tenths = Math.floor((seconds % 1) * 10);
	return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${tenths}`;
}

export function EditorPreviewPanel(props: Props) {
	const {
		t,
		videoPath,
		previewVersion,
		aspectRatio,
		setAspectRatio,
		previewAspectRatioValue,
		videoPlaybackRef,
		timelineRef,
		currentTime,
		isPlaying,
		previewVolume,
		setPreviewVolume,
		suspendRendering,
		appearance,
		timeline,
		audio,
		projection,
		playback,
		zoomCommands,
		annotationCommands,
		effectiveCursorTelemetry,
		effectiveShowCursor,
		isCropped,
		handleOpenCropEditor,
		handleSaveAutoCaptionEdit,
		handleSelectAnnotation,
		setDuration,
		isPreviewReady,
		setIsPreviewReady,
		setCurrentTime,
		setIsPlaying,
		setError,
		onStartRecording,
		onImportMedia,
	} = props;

	const zoomCount = timeline.zoomRegions.length;

	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col mx-2 my-1 rounded-2xl border border-[#E8DED3] bg-white shadow-xs overflow-hidden">
			{/* Preview stage top bar matching LyangRecorder Canvas Studio */}
			<div className="flex h-11 shrink-0 items-center justify-between border-b border-[#E8DED3] px-4 select-none bg-white">
				<div className="flex items-center gap-2">
					<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#0D5C3A] border border-[#C8E6C9] text-xs font-bold tracking-wide">
						<span className="size-2 rounded-full bg-[#0D5C3A]" />
						<span>CANVAS STUDIO</span>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-7 gap-1 px-2.5 text-xs rounded-full border border-[#E8DED3] bg-white hover:bg-[#FAF6F0] text-[#1C1917] font-medium"
							>
								<span>{getAspectRatioLabel(aspectRatio)}</span>
								<CaretDown className="h-3 w-3 text-[#78716C]" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="center" className="rounded-xl border border-[#E8DED3] bg-white p-1 shadow-md">
							{ASPECT_RATIOS.map((ratio) => (
								<DropdownMenuItem
									key={ratio}
									onClick={() => setAspectRatio(ratio)}
									className="flex cursor-pointer items-center justify-between gap-3 text-xs rounded-lg px-2.5 py-1.5 text-[#1C1917] hover:bg-[#FAF6F0]"
								>
									<span>{getAspectRatioLabel(ratio)}</span>
									{aspectRatio === ratio ? (
										<Check className="h-3 w-3 text-[#0D5C3A]" />
									) : null}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					<Button
						variant="ghost"
						size="sm"
						onClick={handleOpenCropEditor}
						className="h-7 gap-1.5 px-2.5 text-xs rounded-full border border-[#E8DED3] bg-white hover:bg-[#FAF6F0] text-[#1C1917] font-medium"
					>
						<Crop className="h-3 w-3 text-[#78716C]" />
						<span>{t("settings.crop.title")}</span>
						{isCropped ? (
							<span className="h-1.5 w-1.5 rounded-full bg-[#0D5C3A]" />
						) : null}
					</Button>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={onImportMedia}
						className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#E8DED3] bg-white hover:bg-[#FAF6F0] text-xs font-semibold text-[#1C1917] transition-colors"
					>
						<span>Tải Raw</span>
					</button>

					<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#0D5C3A] border border-[#C8E6C9] text-xs font-semibold">
						<span className="text-xs">⚡</span>
						<span>GPU 60fps</span>
					</span>

					<button
						type="button"
						className="size-7 rounded-full border border-[#E8DED3] bg-white hover:bg-[#FAF6F0] flex items-center justify-center text-[#78716C] hover:text-[#1C1917] transition-colors"
						title="Toàn màn hình"
					>
						<BoundingBox className="size-3.5" />
					</button>
				</div>
			</div>

			{/* Center stage */}
			<div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#FAF7F2]/40">
				{!videoPath ? (
					/* Standby View matching reference screenshot */
					<div className="flex flex-1 flex-col items-center justify-center p-6 text-center select-none">
						<div className="size-16 rounded-full border-2 border-[#10B981] bg-[#ECFDF5] flex items-center justify-center text-[#0D5C3A] mb-4 shadow-sm">
							<VideoCamera className="size-7 text-[#0D5C3A]" weight="fill" />
						</div>

						<h2 className="text-lg font-bold text-[#1C1917] mb-2 tracking-tight">
							Bắt đầu bản ghi màn hình mới
						</h2>
						<p className="text-xs text-[#78716C] max-w-md leading-relaxed mb-6">
							Quay màn hình chất lượng cao hoặc kéo thả file video vào đây để tự động tạo hiệu ứng phóng to thông minh (Auto-Zoom).
						</p>

						<div className="flex items-center gap-3 mb-6">
							<button
								type="button"
								onClick={onStartRecording}
								className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E11D48] hover:bg-[#CE143B] text-white text-xs font-bold shadow-md shadow-red-500/20 active:scale-95 transition-all"
							>
								<span className="size-2 rounded-full bg-white animate-pulse" />
								<span>Quay màn hình (F9)</span>
							</button>

							<button
								type="button"
								onClick={onImportMedia}
								className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-[#E8DED3] bg-white hover:bg-[#FAF6F0] text-[#1C1917] text-xs font-bold shadow-xs active:scale-95 transition-all"
							>
								<UploadSimple className="size-3.5" />
								<span>Nhập video</span>
							</button>
						</div>

						<div className="flex flex-wrap items-center justify-center gap-2">
							<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-[11px] font-semibold">
								<MagicWand className="size-3" weight="fill" />
								<span>Auto-Zoom mượt mà</span>
							</span>
							<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#0D5C3A] border border-[#C8E6C9] text-[11px] font-semibold">
								<span>⌨️</span>
								<span>Ghi phím bấm & chuột</span>
							</span>
							<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] text-[11px] font-semibold">
								<Cursor className="size-3" weight="fill" />
								<span>Hiệu ứng Click Ripple</span>
							</span>
						</div>
					</div>
				) : (
					/* Active Video Stage */
					<div
						className="flex min-h-0 w-full flex-1 items-stretch px-4 py-3"
						style={{ flex: "1 1 auto", margin: 0 }}
					>
						<div
							className="editor-preview-stage flex min-h-0 min-w-0 flex-1 items-center justify-center"
							style={{ containerType: "size" }}
						>
							<div
								className="editor-preview-frame relative"
								style={{
									width: `min(100cqw, calc(100cqh * ${previewAspectRatioValue}))`,
									height: `min(100cqh, calc(100cqw / ${previewAspectRatioValue}))`,
									aspectRatio: previewAspectRatioValue,
									maxWidth: "100%",
									margin: "0 auto",
									boxSizing: "border-box",
								}}
							>
								{videoPath && !isPreviewReady && (
									<Skeleton
										aria-label="Loading preview"
										className="pointer-events-none absolute inset-0 z-20 h-full w-full rounded-xl"
									/>
								)}
								<EditorVideoPreview
									videoPath={videoPath}
									previewVersion={previewVersion}
									aspectRatio={aspectRatio}
									playbackRef={videoPlaybackRef}
									currentTime={currentTime}
									isPlaying={isPlaying}
									previewVolume={previewVolume}
									suspendRendering={suspendRendering}
									appearance={appearance}
									timeline={timeline}
									audio={audio}
									effectiveZoomRegions={projection.effectiveZoomRegions}
									effectiveCursorTelemetry={effectiveCursorTelemetry}
									effectiveShowCursor={effectiveShowCursor}
									setDuration={setDuration}
									setIsPreviewReady={setIsPreviewReady}
									setCurrentTime={setCurrentTime}
									setIsPlaying={setIsPlaying}
									setError={setError}
									handlers={{
										onSelectZoom: zoomCommands.handleSelectZoom,
										onZoomFocusChange: zoomCommands.handleZoomFocusChange,
										onEditAutoCaption: handleSaveAutoCaptionEdit,
										onSelectAnnotation: handleSelectAnnotation,
										onAnnotationPositionChange:
											annotationCommands.handleAnnotationPositionChange,
										onAnnotationSizeChange:
											annotationCommands.handleAnnotationSizeChange,
									}}
								/>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Transport Bar matching LyangRecorder screenshot */}
			<div className="relative flex h-12 shrink-0 items-center justify-between border-t border-[#E8DED3] bg-white px-4 select-none">
				{/* Left: Play button + Precise Time + Zoom count */}
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={playback.togglePlayPause}
						title={isPlaying ? "Tạm dừng" : "Phát"}
						className="size-8.5 rounded-full bg-[#0D5C3A] hover:bg-[#0A482E] text-white flex items-center justify-center shadow-xs active:scale-95 transition-all"
					>
						{isPlaying ? (
							<Pause className="size-4" weight="fill" />
						) : (
							<Play className="size-4 ml-0.5" weight="fill" />
						)}
					</button>

					<div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#1C1917] tracking-tight">
						<span>{formatTimePrecise(projection.timelinePlayheadTime)}</span>
						<span className="text-[#A8A29E]">/</span>
						<span className="text-[#78716C]">{formatTimePrecise(projection.timelineDuration || 10)}</span>
					</div>

					<div className="h-3.5 w-px bg-[#E8DED3]" />

					<div className="flex items-center gap-1.5 text-xs font-medium text-[#78716C]">
						<span>🔲</span>
						<span>{zoomCount} Khối Smart Zoom</span>
					</div>
				</div>

				{/* Right: Quick actions + Tools */}
				<div className="flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-7.5 gap-1.5 px-3 rounded-full border border-[#E8DED3] bg-white hover:bg-[#FAF6F0] text-xs font-semibold text-[#1C1917]"
							>
								<Plus className="h-3 w-3" />
								<span>{t("editor.toolbar.addLayer")}</span>
								<CaretDown className="h-3 w-3 text-[#78716C]" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="rounded-xl border border-[#E8DED3] bg-white p-1 shadow-md">
							<DropdownMenuItem
								onClick={() => {
									const nextTrack =
										timeline.annotationRegions.length > 0
											? Math.max(
													...timeline.annotationRegions.map(
														(region) => region.trackIndex ?? 0,
													),
												) + 1
											: 0;
									timelineRef.current?.addAnnotation(nextTrack);
								}}
								className="cursor-pointer text-xs rounded-lg px-2.5 py-1.5 text-[#1C1917] hover:bg-[#FAF6F0]"
							>
								{t("timeline.annotation.label")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									const nextTrack =
										timeline.audioRegions.length > 0
											? Math.max(
													...timeline.audioRegions.map(
														(region) => region.trackIndex ?? 0,
													),
												) + 1
											: 0;
									timelineRef.current?.addAudio(nextTrack);
								}}
								className="cursor-pointer text-xs rounded-lg px-2.5 py-1.5 text-[#1C1917] hover:bg-[#FAF6F0]"
							>
								{t("timeline.audio.label")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* + Thêm Zoom (Z) pill */}
					<button
						type="button"
						onClick={() => timelineRef.current?.addZoom()}
						className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#E8F5E9] hover:bg-[#D5EED8] text-[#0D5C3A] border border-[#C8E6C9] text-xs font-semibold transition-all duration-150 active:scale-95"
					>
						<Plus className="size-3" />
						<span>Thêm Zoom (Z)</span>
					</button>

					{/* ✨ Quét Click Auto-Zoom pill */}
					<button
						type="button"
						onClick={() => timelineRef.current?.suggestZooms()}
						className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#D97706] border border-[#FDE68A] text-xs font-semibold transition-all duration-150 active:scale-95"
					>
						<MagicWand className="size-3" weight="fill" />
						<span>Quét Click Auto-Zoom</span>
					</button>

					{/* Split clip button */}
					<button
						type="button"
						onClick={() => timelineRef.current?.splitClip()}
						title={t("editor.toolbar.splitClip")}
						className="size-7.5 rounded-full border border-[#E8DED3] bg-white hover:bg-[#FAF6F0] flex items-center justify-center text-[#78716C] hover:text-[#1C1917]"
					>
						<Scissors className="size-3.5" />
					</button>

					{/* Volume */}
					<Popover>
						<PopoverTrigger asChild>
							<button
								type="button"
								className="size-7.5 rounded-full border border-[#E8DED3] bg-white hover:bg-[#FAF6F0] flex items-center justify-center text-[#78716C] hover:text-[#1C1917]"
								aria-label={t("editor.playback.volume", "Preview volume")}
							>
								{previewVolume <= 0.001 ? (
									<SpeakerX className="size-3.5" />
								) : previewVolume < 0.5 ? (
									<SpeakerLow className="size-3.5" />
								) : (
									<SpeakerHigh className="size-3.5" />
								)}
							</button>
						</PopoverTrigger>
						<PopoverContent
							side="top"
							sideOffset={10}
							className="flex w-14 flex-col items-center gap-3 p-3 rounded-xl border border-[#E8DED3] bg-white shadow-lg"
						>
							<span className="text-[10px] tabular-nums font-medium text-[#78716C]">
								{Math.round(previewVolume * 100)}%
							</span>
							<Slider
								aria-label={t("editor.playback.volume", "Preview volume")}
								orientation="vertical"
								min={0}
								max={1}
								step={0.01}
								value={[previewVolume]}
								onValueChange={([value]) => setPreviewVolume(value)}
								className="h-28"
							/>
						</PopoverContent>
					</Popover>
				</div>
			</div>
		</div>
	);
}
