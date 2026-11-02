import { LibrarySkeleton } from "./LibrarySkeleton";
import { SharedRecordings } from "../cloud/SharedRecordings";
import { CLOUD_SHARE_ENDPOINT } from "../cloud/endpoint";
import { RecordNewButton } from "./RecordNewButton";
import { RawPreview } from "./RawRecordings";
import { Cloud, ImageSquare } from "@/components/ui/icons";

import { Button } from "@/components/ui/button";

import { DashboardSettings } from "./DashboardSettings";

import { ProjectCard } from "./ProjectCard";
import type { DashboardProps } from "./types";

import type { DashboardModel } from "./useDashboardModel";

export function DashboardGrid({
	onImportFile,
	loading,
	isRaw,
	rawPreview,
	setRawPreview,
	rawLoading,
	rawError,
	refreshRaw,
	error,
	section,
	accountLabel,
	authToken,
	onSignIn,
	onShareProject,
	visible,
	busy,
	selecting,
	toggleSelected,
	onRenameProject,
	folders,
	save,
	assignFolder,
	selected,
	openEntry,
	query,
	hasActiveFilters,
	setQuery,
	run,
	deleteEntries,
}: Pick<
	DashboardProps & DashboardModel,
	| "loading"
	| "onImportFile"
	| "isRaw"
	| "rawPreview"
	| "setRawPreview"
	| "rawLoading"
	| "rawError"
	| "refreshRaw"
	| "error"
	| "section"
	| "accountLabel"
	| "authToken"
	| "onSignIn"
	| "onShareProject"
	| "visible"
	| "busy"
	| "selecting"
	| "toggleSelected"
	| "onRenameProject"
	| "folders"
	| "save"
	| "assignFolder"
	| "selected"
	| "openEntry"
	| "query"
	| "hasActiveFilters"
	| "setQuery"
	| "deleteEntries"
	| "run"
>) {
	return (
		<>
			<main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-7 pt-2 pb-10 lg:px-10">
				{error && (
					<p role="alert" className="mb-4 text-sm text-danger">
						{error}
					</p>
				)}
				{section === "settings" ? (
					<DashboardSettings onImportFile={onImportFile} />
				) : section === "shared" ? (
					authToken && CLOUD_SHARE_ENDPOINT ? (
						<div>
							<SharedRecordings
								key={authToken}
								token={authToken}
								endpoint={CLOUD_SHARE_ENDPOINT}
								accountLabel={accountLabel}
								standalone
							/>
						</div>
					) : (
						<div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
							<Cloud weight="fill" className="size-8 opacity-40" />
							<p>
								{authToken
									? "Chia sẻ qua đám mây chưa khả dụng trong bản này."
									: "Đăng nhập để quản lý video đã chia sẻ."}
							</p>
							{!authToken && (
								<Button variant="secondary" onClick={onSignIn}>
									Đăng nhập
								</Button>
							)}
						</div>
					)
				) : (isRaw ? rawLoading : loading) ? (
					<LibrarySkeleton />
				) : visible.length ? (
					<ul
						aria-label={isRaw ? "Tệp video gốc" : "Dự án của bạn"}
						className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-x-7 gap-y-10 lg:gap-x-9"
					>
						{visible.map((entry) => (
							<ProjectCard
								key={entry.path}
								onDelete={() => void deleteEntries([entry.path])}
								{...{
									accountLabel,
									entry,
									busy,
									selecting,
									selected,
									toggleSelected,
									openEntry,
									run,
									onShareProject,
									onRenameProject,
									folders,
									save,
									assignFolder,
								}}
							/>
						))}
					</ul>
				) : (
					<div className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center p-8 rounded-2xl border border-dashed border-border/60 bg-default/5 my-4">
						<div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 text-indigo-400 shadow-inner">
							<ImageSquare weight="fill" className="size-7 opacity-80" />
						</div>
						<div className="max-w-xs space-y-1">
							<h3 className="text-base font-semibold tracking-tight text-foreground">
								{isRaw
									? (hasActiveFilters ? "Không tìm thấy video nào" : "Chưa có bản ghi gốc nào")
									: (hasActiveFilters ? "Không tìm thấy dự án nào" : "Chưa có dự án video nào")}
							</h3>
							<p className="text-xs text-muted-foreground leading-relaxed">
								{isRaw
									? "Các video quay màn hình gốc sẽ tự động xuất hiện tại đây."
									: "Bắt đầu tạo video demo mượt mà với tính năng phóng to tự động và hiệu ứng con trỏ chuyên nghiệp."}
							</p>
						</div>
						{!isRaw && !hasActiveFilters && (
							<div className="flex items-center gap-3 pt-2">
								<RecordNewButton busy={busy} run={run} first />
								<Button
									variant="secondary"
									disabled={busy}
									onClick={() => void run(onImportFile)}
									className="h-11 rounded-xl px-4 text-xs font-medium border border-border/50 bg-default/20 hover:bg-default/40"
								>
									Nhập video
								</Button>
							</div>
						)}
						{isRaw && rawError && (
							<Button onClick={() => void refreshRaw()} className="mt-2">
								Thử lại
							</Button>
						)}
						{query && (
							<Button variant="ghost" size="sm" onClick={() => setQuery("")} className="mt-1">
								Xóa tìm kiếm
							</Button>
						)}
					</div>
				)}
				<RawPreview entry={rawPreview} onClose={() => setRawPreview(null)} />
			</main>
		</>
	);
}
