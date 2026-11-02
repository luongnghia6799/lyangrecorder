import { Pause, Play, SpeakerHigh as Volume2, SpeakerX as VolumeX } from "@/components/ui/icons";
import { useScopedT } from "@/contexts/I18nContext";
import { Surface } from "@heroui/react";
import { Slider } from "@/components/ui/slider";
import { Button } from "../ui/button";

interface PlaybackControlsProps {
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	onTogglePlayPause: () => void;
	onSeek: (time: number) => void;
	volume: number;
	onVolumeChange: (volume: number) => void;
}

export default function PlaybackControls({
	isPlaying,
	currentTime,
	duration,
	onTogglePlayPause,
	onSeek,
	volume,
	onVolumeChange,
}: PlaybackControlsProps) {
	const t = useScopedT("editor");
	function formatTime(seconds: number) {
		if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}

	return (
		<Surface className="flex items-center gap-3.5 px-4 py-2 rounded-full border border-border/50 bg-background/90 backdrop-blur-2xl shadow-2xl transition-all max-w-2xl mx-auto">
			<Button
				onClick={onTogglePlayPause}
				size="icon"
				variant="ghost"
				className="size-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shadow-md shadow-primary/25 hover:scale-105 active:scale-95 transition-all shrink-0 p-0"
				aria-label={isPlaying ? t("playback.pause") : t("playback.play")}
			>
				{isPlaying ? <Pause weight="fill" className="size-3.5" /> : <Play weight="fill" className="size-3.5 ml-0.5" />}
			</Button>
			<span className="text-[11px] font-semibold tabular-nums text-foreground/80 shrink-0">{formatTime(currentTime)}</span>
			<Slider
				aria-label={t("playback.seek", "Playback position")}
				min={0}
				max={duration || 100}
				step={0.01}
				value={[currentTime]}
				onValueChange={([time]) => onSeek(time)}
				className="flex-1 cursor-pointer"
			/>
			<span className="text-[11px] font-medium tabular-nums text-muted-foreground shrink-0">{formatTime(duration)}</span>
			<div className="flex items-center gap-2 pl-1 border-l border-border/40 shrink-0">
				{volume <= 0.001 ? <VolumeX className="size-4 text-muted-foreground" /> : <Volume2 className="size-4 text-muted-foreground hover:text-foreground transition-colors" />}
				<Slider
					aria-label={t("playback.volume", "Volume")}
					min={0}
					max={1}
					step={0.01}
					value={[volume]}
					onValueChange={([volume]) => onVolumeChange(volume)}
					className="w-16 cursor-pointer"
				/>
			</div>
		</Surface>
	);
}
