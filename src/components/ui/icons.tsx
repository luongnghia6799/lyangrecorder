import type { IconProps as SolarIconProps } from "@solar-icons/react/lib/types";
import type { ComponentType, SVGProps } from "react";
type IconProps = SVGProps<SVGSVGElement> & {
	size?: string | number;
	weight?: "regular" | "bold" | "fill" | "duotone" | "thin" | "light";
	mirrored?: boolean;
};
// Outline and filled states always come from the same Solar icon.
const solar =
	(Linear: ComponentType<SolarIconProps>, Bold: ComponentType<SolarIconProps>, slash = false) =>
	({ weight, mirrored, size, ...props }: IconProps) => {
		const Icon = weight === "fill" || weight === "bold" ? Bold : Linear;
		const style = { ...props.style, ...(mirrored ? { transform: "scaleX(-1)" } : {}) };
		if (slash)
			return (
				<svg
					{...props}
					width={size}
					height={size}
					viewBox="0 0 24 24"
					fill="none"
					style={style}
					data-icon-style={weight === "fill" || weight === "bold" ? "bold" : "linear"}
				>
					<Icon size={24} />
					<path
						d="M4 4L20 20"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
					/>
				</svg>
			);
		return (
			<Icon
				{...props}
				size={size}
				data-icon-style={weight === "fill" || weight === "bold" ? "bold" : "linear"}
				style={style}
			/>
		);
	};
import { AddIcon as AddLinear } from "@solar-icons/react/line-duotone/add";
import { AddIcon as AddBold } from "@solar-icons/react/bold-duotone/add";
import { AlignHorizontalCenterIcon as AlignHorizontalCenterLinear } from "@solar-icons/react/line-duotone/align-horizontal-center";
import { AlignHorizontalCenterIcon as AlignHorizontalCenterBold } from "@solar-icons/react/bold-duotone/align-horizontal-center";
import { AlignLeftIcon as AlignLeftLinear } from "@solar-icons/react/line-duotone/align-left";
import { AlignLeftIcon as AlignLeftBold } from "@solar-icons/react/bold-duotone/align-left";
import { AlignRightIcon as AlignRightLinear } from "@solar-icons/react/line-duotone/align-right";
import { AlignRightIcon as AlignRightBold } from "@solar-icons/react/bold-duotone/align-right";
import { AltArrowDownIcon as AltArrowDownLinear } from "@solar-icons/react/line-duotone/alt-arrow-down";
import { AltArrowDownIcon as AltArrowDownBold } from "@solar-icons/react/bold-duotone/alt-arrow-down";
import { AltArrowUpIcon as AltArrowUpLinear } from "@solar-icons/react/line-duotone/alt-arrow-up";
import { AltArrowUpIcon as AltArrowUpBold } from "@solar-icons/react/bold-duotone/alt-arrow-up";
import { ArrowLeftIcon as ArrowLeftLinear } from "@solar-icons/react/line-duotone/arrow-left";
import { ArrowLeftIcon as ArrowLeftBold } from "@solar-icons/react/bold-duotone/arrow-left";
import { ArrowRightIcon as ArrowRightLinear } from "@solar-icons/react/line-duotone/arrow-right";
import { ArrowRightIcon as ArrowRightBold } from "@solar-icons/react/bold-duotone/arrow-right";
import { BookmarkIcon as BookmarkLinear } from "@solar-icons/react/line-duotone/bookmark";
import { BookmarkIcon as BookmarkBold } from "@solar-icons/react/bold-duotone/bookmark";
import { BranchingPathsUpIcon as BranchingPathsUpLinear } from "@solar-icons/react/line-duotone/branching-paths-up";
import { BranchingPathsUpIcon as BranchingPathsUpBold } from "@solar-icons/react/bold-duotone/branching-paths-up";
import { CameraIcon as CameraLinear } from "@solar-icons/react/line-duotone/camera";
import { CameraIcon as CameraBold } from "@solar-icons/react/bold-duotone/camera";
import { ChatRoundIcon as ChatRoundLinear } from "@solar-icons/react/line-duotone/chat-round";
import { ChatRoundIcon as ChatRoundBold } from "@solar-icons/react/bold-duotone/chat-round";
import { ChatRoundDotsIcon as ChatRoundDotsLinear } from "@solar-icons/react/line-duotone/chat-round-dots";
import { ChatRoundDotsIcon as ChatRoundDotsBold } from "@solar-icons/react/bold-duotone/chat-round-dots";
import { CheckIcon as CheckLinear } from "@solar-icons/react/line-duotone/check";
import { CheckIcon as CheckBold } from "@solar-icons/react/bold-duotone/check";
import { CheckCircleIcon as CheckCircleLinear } from "@solar-icons/react/line-duotone/check-circle";
import { CheckCircleIcon as CheckCircleBold } from "@solar-icons/react/bold-duotone/check-circle";
import { ClapperboardIcon as ClapperboardLinear } from "@solar-icons/react/line-duotone/clapperboard";
import { ClapperboardIcon as ClapperboardBold } from "@solar-icons/react/bold-duotone/clapperboard";
import { CloseIcon as CloseLinear } from "@solar-icons/react/line-duotone/close";
import { CloseIcon as CloseBold } from "@solar-icons/react/bold-duotone/close";
import { CloudIcon as CloudLinear } from "@solar-icons/react/line-duotone/cloud";
import { CloudIcon as CloudBold } from "@solar-icons/react/bold-duotone/cloud";
import { CloudUploadIcon as CloudUploadLinear } from "@solar-icons/react/line-duotone/cloud-upload";
import { CloudUploadIcon as CloudUploadBold } from "@solar-icons/react/bold-duotone/cloud-upload";
import { CopyIcon as CopyLinear } from "@solar-icons/react/line-duotone/copy";
import { CopyIcon as CopyBold } from "@solar-icons/react/bold-duotone/copy";
import { CropIcon as CropLinear } from "@solar-icons/react/line-duotone/crop";
import { CropIcon as CropBold } from "@solar-icons/react/bold-duotone/crop";
import { CursorIcon as CursorLinear } from "@solar-icons/react/line-duotone/cursor";
import { CursorIcon as CursorBold } from "@solar-icons/react/bold-duotone/cursor";
import { DangerCircleIcon as DangerCircleLinear } from "@solar-icons/react/line-duotone/danger-circle";
import { DangerCircleIcon as DangerCircleBold } from "@solar-icons/react/bold-duotone/danger-circle";
import { DownloadIcon as DownloadLinear } from "@solar-icons/react/line-duotone/download";
import { DownloadIcon as DownloadBold } from "@solar-icons/react/bold-duotone/download";
import { EyeIcon as EyeLinear } from "@solar-icons/react/line-duotone/eye";
import { EyeIcon as EyeBold } from "@solar-icons/react/bold-duotone/eye";
import { EyeClosedIcon as EyeClosedLinear } from "@solar-icons/react/line-duotone/eye-closed";
import { EyeClosedIcon as EyeClosedBold } from "@solar-icons/react/bold-duotone/eye-closed";
import { FileIcon as FileLinear } from "@solar-icons/react/line-duotone/file";
import { FileIcon as FileBold } from "@solar-icons/react/bold-duotone/file";
import { FolderIcon as FolderLinear } from "@solar-icons/react/line-duotone/folder";
import { FolderIcon as FolderBold } from "@solar-icons/react/bold-duotone/folder";
import { FolderOpenIcon as FolderOpenLinear } from "@solar-icons/react/line-duotone/folder-open";
import { FolderOpenIcon as FolderOpenBold } from "@solar-icons/react/bold-duotone/folder-open";
import { FullScreenIcon as FullScreenLinear } from "@solar-icons/react/line-duotone/full-screen";
import { FullScreenIcon as FullScreenBold } from "@solar-icons/react/bold-duotone/full-screen";
import { GalleryIcon as GalleryLinear } from "@solar-icons/react/line-duotone/gallery";
import { GalleryIcon as GalleryBold } from "@solar-icons/react/bold-duotone/gallery";
import { HomeIcon as HomeLinear } from "@solar-icons/react/line-duotone/home";
import { HomeIcon as HomeBold } from "@solar-icons/react/bold-duotone/home";
import { InfoCircleIcon as InfoCircleLinear } from "@solar-icons/react/line-duotone/info-circle";
import { InfoCircleIcon as InfoCircleBold } from "@solar-icons/react/bold-duotone/info-circle";
import { KeyboardIcon as KeyboardLinear } from "@solar-icons/react/line-duotone/keyboard";
import { KeyboardIcon as KeyboardBold } from "@solar-icons/react/bold-duotone/keyboard";
import { LogoutIcon as LogoutLinear } from "@solar-icons/react/line-duotone/logout";
import { LogoutIcon as LogoutBold } from "@solar-icons/react/bold-duotone/logout";
import { MagicWand3Icon as MagicWand3Linear } from "@solar-icons/react/line-duotone/magic-wand-3";
import { MagicWand3Icon as MagicWand3Bold } from "@solar-icons/react/bold-duotone/magic-wand-3";
import { MagnifierIcon as MagnifierLinear } from "@solar-icons/react/line-duotone/magnifier";
import { MagnifierIcon as MagnifierBold } from "@solar-icons/react/bold-duotone/magnifier";
import { MagnifierZoomInIcon as MagnifierZoomInLinear } from "@solar-icons/react/line-duotone/magnifier-zoom-in";
import { MagnifierZoomInIcon as MagnifierZoomInBold } from "@solar-icons/react/bold-duotone/magnifier-zoom-in";
import { MenuDotsIcon as MenuDotsLinear } from "@solar-icons/react/line-duotone/menu-dots";
import { MenuDotsIcon as MenuDotsBold } from "@solar-icons/react/bold-duotone/menu-dots";
import { MenuDotsVerticalIcon as MenuDotsVerticalLinear } from "@solar-icons/react/line-duotone/menu-dots-vertical";
import { MenuDotsVerticalIcon as MenuDotsVerticalBold } from "@solar-icons/react/bold-duotone/menu-dots-vertical";
import { MicrophoneIcon as MicrophoneLinear } from "@solar-icons/react/line-duotone/microphone";
import { MicrophoneIcon as MicrophoneBold } from "@solar-icons/react/bold-duotone/microphone";
import { MinusIcon as MinusLinear } from "@solar-icons/react/line-duotone/minus";
import { MinusIcon as MinusBold } from "@solar-icons/react/bold-duotone/minus";
import { MonitorIcon as MonitorLinear } from "@solar-icons/react/line-duotone/monitor";
import { MonitorIcon as MonitorBold } from "@solar-icons/react/bold-duotone/monitor";
import { MoonIcon as MoonLinear } from "@solar-icons/react/line-duotone/moon";
import { MoonIcon as MoonBold } from "@solar-icons/react/bold-duotone/moon";
import { MusicNotesIcon as MusicNotesLinear } from "@solar-icons/react/line-duotone/music-notes";
import { MusicNotesIcon as MusicNotesBold } from "@solar-icons/react/bold-duotone/music-notes";
import { NotificationUnreadIcon as NotificationUnreadLinear } from "@solar-icons/react/line-duotone/notification-unread";
import { NotificationUnreadIcon as NotificationUnreadBold } from "@solar-icons/react/bold-duotone/notification-unread";
import { PaletteIcon as PaletteLinear } from "@solar-icons/react/line-duotone/palette";
import { PaletteIcon as PaletteBold } from "@solar-icons/react/bold-duotone/palette";
import { PauseIcon as PauseLinear } from "@solar-icons/react/line-duotone/pause";
import { PauseIcon as PauseBold } from "@solar-icons/react/bold-duotone/pause";
import { PlayIcon as PlayLinear } from "@solar-icons/react/line-duotone/play";
import { PlayIcon as PlayBold } from "@solar-icons/react/bold-duotone/play";
import { QuestionCircleIcon as QuestionCircleLinear } from "@solar-icons/react/line-duotone/question-circle";
import { QuestionCircleIcon as QuestionCircleBold } from "@solar-icons/react/bold-duotone/question-circle";
import { RefreshIcon as RefreshLinear } from "@solar-icons/react/line-duotone/refresh";
import { RefreshIcon as RefreshBold } from "@solar-icons/react/bold-duotone/refresh";
import { RestartIcon as RestartLinear } from "@solar-icons/react/line-duotone/restart";
import { RestartIcon as RestartBold } from "@solar-icons/react/bold-duotone/restart";
import { ScissorsIcon as ScissorsLinear } from "@solar-icons/react/line-duotone/scissors";
import { ScissorsIcon as ScissorsBold } from "@solar-icons/react/bold-duotone/scissors";
import { SettingsIcon as SettingsLinear } from "@solar-icons/react/line-duotone/settings";
import { SettingsIcon as SettingsBold } from "@solar-icons/react/bold-duotone/settings";
import { ShareIcon as ShareLinear } from "@solar-icons/react/line-duotone/share";
import { ShareIcon as ShareBold } from "@solar-icons/react/bold-duotone/share";
import { SkipNextIcon as SkipNextLinear } from "@solar-icons/react/line-duotone/skip-next";
import { SkipNextIcon as SkipNextBold } from "@solar-icons/react/bold-duotone/skip-next";
import { SkipPreviousIcon as SkipPreviousLinear } from "@solar-icons/react/line-duotone/skip-previous";
import { SkipPreviousIcon as SkipPreviousBold } from "@solar-icons/react/bold-duotone/skip-previous";
import { SpeedometerMiddleIcon as SpeedometerMiddleLinear } from "@solar-icons/react/line-duotone/speedometer-middle";
import { SpeedometerMiddleIcon as SpeedometerMiddleBold } from "@solar-icons/react/bold-duotone/speedometer-middle";
import { SmartphoneIcon as SmartphoneLinear } from "@solar-icons/react/line-duotone/smartphone";
import { SmartphoneIcon as SmartphoneBold } from "@solar-icons/react/bold-duotone/smartphone";
import { TvIcon as TvLinear } from "@solar-icons/react/line-duotone/tv";
import { TvIcon as TvBold } from "@solar-icons/react/bold-duotone/tv";
import { FrameIcon as FrameLinear } from "@solar-icons/react/line-duotone/frame";
import { FrameIcon as FrameBold } from "@solar-icons/react/bold-duotone/frame";
import { TextFormatIcon as TextFormatLinear } from "@solar-icons/react/line-duotone/text-format";
import { TextFormatIcon as TextFormatBold } from "@solar-icons/react/bold-duotone/text-format";
import { SquareTopDownIcon as SquareTopDownLinear } from "@solar-icons/react/line-duotone/square-top-down";
import { SquareTopDownIcon as SquareTopDownBold } from "@solar-icons/react/bold-duotone/square-top-down";
import { StopwatchIcon as StopwatchLinear } from "@solar-icons/react/line-duotone/stopwatch";
import { StopwatchIcon as StopwatchBold } from "@solar-icons/react/bold-duotone/stopwatch";
import { SubtitlesIcon as SubtitlesLinear } from "@solar-icons/react/line-duotone/subtitles";
import { SubtitlesIcon as SubtitlesBold } from "@solar-icons/react/bold-duotone/subtitles";
import { SunIcon as SunLinear } from "@solar-icons/react/line-duotone/sun";
import { SunIcon as SunBold } from "@solar-icons/react/bold-duotone/sun";
import { TextBoldIcon as TextBoldLinear } from "@solar-icons/react/line-duotone/text-bold";
import { TextBoldIcon as TextBoldBold } from "@solar-icons/react/bold-duotone/text-bold";
import { TextFieldIcon as TextFieldLinear } from "@solar-icons/react/line-duotone/text-field";
import { TextFieldIcon as TextFieldBold } from "@solar-icons/react/bold-duotone/text-field";
import { TextItalicIcon as TextItalicLinear } from "@solar-icons/react/line-duotone/text-italic";
import { TextItalicIcon as TextItalicBold } from "@solar-icons/react/bold-duotone/text-italic";
import { TextUnderlineIcon as TextUnderlineLinear } from "@solar-icons/react/line-duotone/text-underline";
import { TextUnderlineIcon as TextUnderlineBold } from "@solar-icons/react/bold-duotone/text-underline";
import { TranslationIcon as TranslationLinear } from "@solar-icons/react/line-duotone/translation";
import { TranslationIcon as TranslationBold } from "@solar-icons/react/bold-duotone/translation";
import { TrashBinTrashIcon as TrashBinTrashLinear } from "@solar-icons/react/line-duotone/trash-bin-trash";
import { TrashBinTrashIcon as TrashBinTrashBold } from "@solar-icons/react/bold-duotone/trash-bin-trash";
import { UploadIcon as UploadLinear } from "@solar-icons/react/line-duotone/upload";
import { UploadIcon as UploadBold } from "@solar-icons/react/bold-duotone/upload";
import { UserIcon as UserLinear } from "@solar-icons/react/line-duotone/user";
import { UserIcon as UserBold } from "@solar-icons/react/bold-duotone/user";
import { UserCircleIcon as UserCircleLinear } from "@solar-icons/react/line-duotone/user-circle";
import { UserCircleIcon as UserCircleBold } from "@solar-icons/react/bold-duotone/user-circle";
import { VideoFrameIcon as VideoFrameLinear } from "@solar-icons/react/line-duotone/video-frame";
import { VideoFrameIcon as VideoFrameBold } from "@solar-icons/react/bold-duotone/video-frame";
import { VideocameraIcon as VideocameraLinear } from "@solar-icons/react/line-duotone/videocamera";
import { VideocameraIcon as VideocameraBold } from "@solar-icons/react/bold-duotone/videocamera";
import { VideocameraOffIcon as VideocameraOffLinear } from "@solar-icons/react/line-duotone/videocamera-off";
import { VideocameraOffIcon as VideocameraOffBold } from "@solar-icons/react/bold-duotone/videocamera-off";
import { VolumeCrossIcon as VolumeCrossLinear } from "@solar-icons/react/line-duotone/volume-cross";
import { VolumeCrossIcon as VolumeCrossBold } from "@solar-icons/react/bold-duotone/volume-cross";
import { VolumeLoudIcon as VolumeLoudLinear } from "@solar-icons/react/line-duotone/volume-loud";
import { VolumeLoudIcon as VolumeLoudBold } from "@solar-icons/react/bold-duotone/volume-loud";
import { VolumeSmallIcon as VolumeSmallLinear } from "@solar-icons/react/line-duotone/volume-small";
import { VolumeSmallIcon as VolumeSmallBold } from "@solar-icons/react/bold-duotone/volume-small";
import { WidgetAddIcon as WidgetAddLinear } from "@solar-icons/react/line-duotone/widget-add";
import { WidgetAddIcon as WidgetAddBold } from "@solar-icons/react/bold-duotone/widget-add";
import { WindowFrameIcon as WindowFrameLinear } from "@solar-icons/react/line-duotone/window-frame";
import { WindowFrameIcon as WindowFrameBold } from "@solar-icons/react/bold-duotone/window-frame";
export const AlignCenterHorizontal = solar(AlignHorizontalCenterLinear, AlignHorizontalCenterBold);
export const AlignLeft = solar(AlignLeftLinear, AlignLeftBold);
export const AlignRight = solar(AlignRightLinear, AlignRightBold);
export const AppWindowIcon = solar(WindowFrameLinear, WindowFrameBold);
export const ArrowClockwise = solar(RefreshLinear, RefreshBold);
export const ArrowClockwiseIcon = solar(RefreshLinear, RefreshBold);
export const ArrowCounterClockwise = solar(RestartLinear, RestartBold);
export const ArrowLeft = solar(ArrowLeftLinear, ArrowLeftBold);
export const ArrowRight = solar(ArrowRightLinear, ArrowRightBold);
export const ArrowSquareOut = solar(SquareTopDownLinear, SquareTopDownBold);
export const BookmarkSimple = solar(BookmarkLinear, BookmarkBold);
export const BoundingBox = solar(FullScreenLinear, FullScreenBold);
export const Camera = solar(CameraLinear, CameraBold);
export const CaretDown = solar(AltArrowDownLinear, AltArrowDownBold);
export const CaretUpIcon = solar(AltArrowUpLinear, AltArrowUpBold);
export const ChatCircle = solar(ChatRoundLinear, ChatRoundBold);
export const ChatDots = solar(ChatRoundDotsLinear, ChatRoundDotsBold);
export const Check = solar(CheckLinear, CheckBold);
export const CheckCircleIcon = solar(CheckCircleLinear, CheckCircleBold);
export const Cloud = solar(CloudLinear, CloudBold);
export const CloudArrowUp = solar(CloudUploadLinear, CloudUploadBold);
export const Copy = solar(CopyLinear, CopyBold);
export const Crop = solar(CropLinear, CropBold);
export const DesktopIcon = solar(MonitorLinear, MonitorBold);
export const DotsThree = solar(MenuDotsLinear, MenuDotsBold);
export const DotsThreeVerticalIcon = solar(MenuDotsVerticalLinear, MenuDotsVerticalBold);
export const DownloadSimple = solar(DownloadLinear, DownloadBold);
export const DownloadSimpleIcon = solar(DownloadLinear, DownloadBold);
export const Eye = solar(EyeLinear, EyeBold);
export const EyeIcon = solar(EyeLinear, EyeBold);
export const EyeSlash = solar(EyeClosedLinear, EyeClosedBold);
export const EyeSlashIcon = solar(EyeClosedLinear, EyeClosedBold);
export const FilmSlate = solar(ClapperboardLinear, ClapperboardBold);
export const FilmStrip = solar(VideoFrameLinear, VideoFrameBold);
export const FolderOpen = solar(FolderOpenLinear, FolderOpenBold);
export const FolderOpenIcon = solar(FolderOpenLinear, FolderOpenBold);
export const FolderSimple = solar(FolderLinear, FolderBold);
export const FrameCorners = solar(GalleryLinear, GalleryBold);
export const Gear = solar(SettingsLinear, SettingsBold);
export const GearSix = solar(SettingsLinear, SettingsBold);
export const House = solar(HomeLinear, HomeBold);
export const Image = solar(GalleryLinear, GalleryBold);
export const ImageSquare = solar(GalleryLinear, GalleryBold);
export const Info = solar(InfoCircleLinear, InfoCircleBold);
export const MagnifyingGlass = solar(MagnifierLinear, MagnifierBold);
export const MagnifyingGlassPlus = solar(MagnifierZoomInLinear, MagnifierZoomInBold);
export const MicrophoneIcon = solar(MicrophoneLinear, MicrophoneBold);
export const MicrophoneSlashIcon = solar(MicrophoneLinear, MicrophoneBold, true);
export const MinusIcon = solar(MinusLinear, MinusBold);
export const MonitorIcon = solar(MonitorLinear, MonitorBold);
export const MoonIcon = solar(MoonLinear, MoonBold);
export const MusicNotes = solar(MusicNotesLinear, MusicNotesBold);
export const Pause = solar(PauseLinear, PauseBold);
export const PauseIcon = solar(PauseLinear, PauseBold);
export const Play = solar(PlayLinear, PlayBold);
export const PlayIcon = solar(PlayLinear, PlayBold);
export const Plus = solar(AddLinear, AddBold);
export const Question = solar(QuestionCircleLinear, QuestionCircleBold);
export const Scissors = solar(ScissorsLinear, ScissorsBold);
export const ShareNetwork = solar(ShareLinear, ShareBold);
export const SignOut = solar(LogoutLinear, LogoutBold);
export const SkipBack = solar(SkipPreviousLinear, SkipPreviousBold);
export const SkipForward = solar(SkipNextLinear, SkipNextBold);
export const SpeakerHigh = solar(VolumeLoudLinear, VolumeLoudBold);
export const SpeakerHighIcon = solar(VolumeLoudLinear, VolumeLoudBold);
export const SpeakerLow = solar(VolumeSmallLinear, VolumeSmallBold);
export const SpeakerX = solar(VolumeCrossLinear, VolumeCrossBold);
export const SpeakerXIcon = solar(VolumeCrossLinear, VolumeCrossBold);
export const SunIcon = solar(SunLinear, SunBold);
export const TextB = solar(TextBoldLinear, TextBoldBold);
export const TextItalic = solar(TextItalicLinear, TextItalicBold);
export const TextT = solar(TextFieldLinear, TextFieldBold);
export const TextUnderline = solar(TextUnderlineLinear, TextUnderlineBold);
export const TimerIcon = solar(StopwatchLinear, StopwatchBold);
export const Trash = solar(TrashBinTrashLinear, TrashBinTrashBold);
export const UploadSimple = solar(UploadLinear, UploadBold);
export const User = solar(UserLinear, UserBold);
export const UserCircle = solar(UserCircleLinear, UserCircleBold);
export const VideoCamera = solar(VideocameraLinear, VideocameraBold);
export const VideoCameraIcon = solar(VideocameraLinear, VideocameraBold);
export const VideoCameraSlash = solar(VideocameraOffLinear, VideocameraOffBold);
export const VideoCameraSlashIcon = solar(VideocameraOffLinear, VideocameraOffBold);
export const WarningCircleIcon = solar(DangerCircleLinear, DangerCircleBold);
export const X = solar(CloseLinear, CloseBold);
export const XIcon = solar(CloseLinear, CloseBold);
export const File = solar(FileLinear, FileBold);
export const ArrowsMerge = solar(BranchingPathsUpLinear, BranchingPathsUpBold);
export const ClosedCaptioning = solar(SubtitlesLinear, SubtitlesBold);
export const Cursor = solar(CursorLinear, CursorBold);
export const Gauge = solar(SpeedometerMiddleLinear, SpeedometerMiddleBold);
export const Keyboard = solar(KeyboardLinear, KeyboardBold);
export const MagicWand = solar(MagicWand3Linear, MagicWand3Bold);
export const Megaphone = solar(NotificationUnreadLinear, NotificationUnreadBold);
export const Palette = solar(PaletteLinear, PaletteBold);
export const PuzzlePiece = solar(WidgetAddLinear, WidgetAddBold);
export const TranslateIcon = solar(TranslationLinear, TranslationBold);
export const Smartphone = solar(SmartphoneLinear, SmartphoneBold);
export const Tv = solar(TvLinear, TvBold);
export const SquareFrame = solar(FrameLinear, FrameBold);
export const TextFormat = solar(TextFormatLinear, TextFormatBold);
// Provider logos are brands, not selectable application icons.
export { GoogleLogo, XLogo } from "@phosphor-icons/react";
