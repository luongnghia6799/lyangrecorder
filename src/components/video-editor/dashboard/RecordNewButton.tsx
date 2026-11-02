import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RecordNewButton({
	busy,
	run,
	className,
	first = false,
}: {
	busy: boolean;
	run: (action: () => Promise<void>) => Promise<void>;
	className?: string;
	first?: boolean;
}) {
	return (
		<Button
			variant="default"
			disabled={busy}
			onClick={() => void run(() => window.electronAPI.showRecordingHud())}
			className={cn(
				"relative group overflow-hidden h-10 shrink-0 gap-2 rounded-full font-semibold text-xs tracking-tight transition-all duration-200",
				"bg-[#E11D48] hover:bg-[#D01640] text-white shadow-md shadow-red-500/15 hover:shadow-red-500/25 active:scale-[0.98]",
				className,
			)}
		>
			<span className="relative flex size-2.5 items-center justify-center">
				<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75 duration-1000" />
				<span className="relative inline-flex size-2 rounded-full bg-white shadow" />
			</span>
			<span className="relative z-10 font-semibold tracking-wide">
				{first ? "Quay video đầu tiên" : "Bắt đầu quay"}
			</span>
			<span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
		</Button>
	);
}
