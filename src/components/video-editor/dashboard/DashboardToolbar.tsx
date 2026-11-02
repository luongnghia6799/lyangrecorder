import { MagnifyingGlass, UploadSimple, ArrowClockwise } from "@/components/ui/icons";
import { type CSSProperties } from "react";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import type { DashboardProps } from "./types";

import type { DashboardModel } from "./useDashboardModel";

export function DashboardToolbar({
	onImportFile,
	isRaw,
	query,
	setQuery,
	run,
	busy,
	actionLabel = "Nhập tệp",
	action = "import",
}: Pick<
	DashboardProps & DashboardModel,
	"onImportFile" | "query" | "setQuery" | "run" | "busy" | "isRaw"
> & { actionLabel?: string; action?: "import" | "refresh" }) {
	return (
		<>
			<header
				className="flex h-20 shrink-0 items-center gap-4 px-7 pt-3 lg:px-10"
				style={{ WebkitAppRegion: "drag" } as CSSProperties}
			>
				<div
					className="relative min-w-0 flex-1 max-w-xl"
					style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
				>
					<MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground/70" />
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						aria-label={isRaw ? "Tìm kiếm video gốc" : "Tìm kiếm dự án"}
						placeholder={isRaw ? "Tìm kiếm bản ghi..." : "Tìm kiếm dự án..."}
						className="h-10 w-full rounded-xl border border-border/50 bg-default/20 hover:bg-default/30 focus:bg-default/40 pl-10 pr-12 text-sm shadow-none transition-colors"
					/>
					<div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60 border border-border/40 bg-background/50">
						<span>⌘</span>
						<span>K</span>
					</div>
				</div>
				<div className="ml-auto flex items-center gap-2" style={{ WebkitAppRegion: "no-drag" } as CSSProperties}>
					<Button
						variant="secondary"
						disabled={busy}
						onClick={() => void run(onImportFile)}
						className="h-10 shrink-0 gap-2 rounded-xl border border-border/50 bg-default/20 hover:bg-default/40 text-[13px] font-medium px-4 shadow-sm transition-all"
					>
						{action === "refresh" ? (
							<ArrowClockwise className="size-4 text-indigo-400" />
						) : (
							<UploadSimple className="size-4 text-indigo-400" />
						)}
						{actionLabel}
					</Button>
				</div>
			</header>
		</>
	);
}
