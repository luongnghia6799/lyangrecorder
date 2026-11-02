import {
	House,
	MicrophoneIcon,
	MicrophoneSlashIcon,
	MinusIcon,
	PauseIcon,
	PlayIcon,
	XIcon,
} from "@/components/ui/icons";
import { useScopedT } from "@/contexts/I18nContext";
import { Button, Separator, Tooltip } from "@heroui/react";
import styles from "./LaunchWindow.module.css";

interface RecordingControlsProps {
	onHome: () => void;
	paused: boolean;
	microphoneEnabled: boolean;
	elapsed: number;
	onPauseResume: () => void;
	onStopRecording: () => void;
	onHideHud: () => void;
	onCancelRecording: () => void;
	formatTime: (seconds: number) => string;
}
export function RecordingControls({
	onHome,
	paused,
	microphoneEnabled,
	elapsed,
	onPauseResume,
	onStopRecording,
	onHideHud,
	onCancelRecording,
	formatTime,
}: RecordingControlsProps) {
	const t = useScopedT("launch");
	const actionClass = `size-8.5 min-w-8.5 rounded-full text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF6F0] ${styles.electronNoDrag}`;
	return (
		<div role="group" aria-label="Recording controls" className="flex items-center gap-1.5">
			<Button
				isIconOnly
				variant="ghost"
				className={actionClass}
				aria-label={t("recording.home")}
				onPress={onHome}
			>
				<House weight="fill" className="size-4 text-[#0D5C3A]" />
			</Button>
			<div
				className="flex items-center gap-2 px-2"
				role="status"
				aria-label={paused ? t("recording.paused") : t("recording.rec")}
			>
				<span
					className={`size-2 rounded-full ${paused ? "bg-amber-500" : `bg-[#E11D48] ${styles.recDotBlink}`}`}
				/>
				<span className="min-w-14 text-xs font-mono font-bold tabular-nums text-[#1C1917]">
					{formatTime(elapsed)}
				</span>
				{paused && (
					<span className="text-[11px] font-medium text-amber-600">{t("recording.paused")}</span>
				)}
			</div>
			<Tooltip>
				<Button
					isIconOnly
					variant="ghost"
					isDisabled
					className={actionClass}
					aria-label={microphoneEnabled ? "Microphone on" : "Microphone off"}
				>
					{microphoneEnabled ? (
						<MicrophoneIcon weight="fill" className="size-4 text-[#0D5C3A]" />
					) : (
						<MicrophoneSlashIcon className="size-4" />
					)}
				</Button>
				<Tooltip.Content>{t("recording.micToggleDisabledTip")}</Tooltip.Content>
			</Tooltip>
			<Separator orientation="vertical" className="mx-1 h-5 self-center bg-[#E8DED3]" />
			<Tooltip>
				<Button
					isIconOnly
					variant="ghost"
					className={actionClass}
					onPress={onPauseResume}
					aria-label={paused ? t("recording.resume") : t("recording.pause")}
				>
					{paused ? (
						<PlayIcon weight="fill" className="size-4 text-[#0D5C3A]" />
					) : (
						<PauseIcon weight="fill" className="size-4 text-[#0D5C3A]" />
					)}
				</Button>
				<Tooltip.Content>
					{paused ? t("recording.resume") : t("recording.pause")}
				</Tooltip.Content>
			</Tooltip>
			<Tooltip>
				<Button
					isIconOnly
					className={`size-8.5 min-w-8.5 rounded-full bg-[#E11D48] hover:bg-[#D01640] text-white flex items-center justify-center shadow-sm shadow-red-500/25 ${styles.electronNoDrag}`}
					onPress={onStopRecording}
					aria-label={t("recording.stop")}
				>
					<span className="size-3 rounded-[2px] bg-white" />
				</Button>
				<Tooltip.Content>{t("recording.stop")}</Tooltip.Content>
			</Tooltip>
			<Tooltip>
				<Button
					isIconOnly
					variant="ghost"
					className={actionClass}
					onPress={onHideHud}
					aria-label={t("recording.hideHud")}
				>
					<MinusIcon className="size-4" />
				</Button>
				<Tooltip.Content>{t("recording.hideHud")}</Tooltip.Content>
			</Tooltip>
			<Tooltip>
				<Button
					isIconOnly
					variant="ghost"
					className={`size-8.5 min-w-8.5 rounded-full text-[#78716C] hover:text-[#E11D48] hover:bg-[#FFF1F2] ${styles.electronNoDrag}`}
					onPress={onCancelRecording}
					aria-label={t("recording.cancel")}
				>
					<XIcon className="size-4" />
				</Button>
				<Tooltip.Content>{t("recording.cancel")}</Tooltip.Content>
			</Tooltip>
		</div>
	);
}
