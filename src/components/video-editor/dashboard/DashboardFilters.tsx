import type { DashboardProps } from "./types";
import { Dropdown } from "@heroui/react";
import { CaretDown, Trash } from "@/components/ui/icons";

import { Button } from "@/components/ui/button";

import type { DashboardModel } from "./useDashboardModel";

export function DashboardFilters({
	isRaw,
	period,
	setPeriod,
	selecting,
	setSelecting,
	selected,
	setSelected,
	sort,
	setSort,
	visible,
	busy,
	deleteEntries,
	hideSelection = false,
}: Pick<
	DashboardModel & DashboardProps,
	| "isRaw"
	| "period"
	| "setPeriod"
	| "selecting"
	| "setSelecting"
	| "selected"
	| "setSelected"
	| "sort"
	| "setSort"
	| "visible"
	| "busy"
	| "deleteEntries"
> & { hideSelection?: boolean }) {
	return (
		<>
			<div className="flex items-center gap-3 px-7 pb-4 lg:px-10">
				<div className="flex items-center gap-1 p-1 rounded-full bg-[#FAF6F0] border border-[#E8DED3]" aria-label="Bộ lọc thời gian">
					{[
						["all", "Tất cả"],
						["week", "7 ngày qua"],
						["month", "30 ngày qua"],
					].map(([id, label]) => (
						<Button
							key={id}
							variant="ghost"
							size="sm"
							aria-pressed={period === id}
							onClick={() => setPeriod(id)}
							className={`h-7 rounded-full px-3.5 text-xs font-medium transition-all ${
								period === id
									? "bg-[#0D5C3A] text-white shadow-sm font-semibold hover:bg-[#0A482D]"
									: "text-[#78716C] hover:text-[#1C1917]"
							}`}
						>
							{label}
						</Button>
					))}
					{!hideSelection && (
						<Button
							variant="ghost"
							size="icon"
							className={`size-7 min-w-7 rounded-lg transition-colors ${
								selecting ? "bg-danger/20 text-danger border border-danger/30" : "text-muted-foreground hover:text-danger hover:bg-danger/10"
							}`}
							aria-label={
								isRaw ? "Chọn video để xóa" : "Chọn dự án để xóa"
							}
							aria-pressed={selecting}
							onClick={() => {
								setSelecting(!selecting);
								setSelected([]);
							}}
						>
							<Trash weight={selecting ? "fill" : "regular"} className="size-3.5" />
						</Button>
					)}
				</div>
				<div className="ml-auto">
					<Dropdown>
						<Button
							variant="ghost"
							size="sm"
							aria-label={isRaw ? "Sắp xếp video" : "Sắp xếp dự án"}
							className="h-7 gap-2 text-xs text-muted-foreground"
						>
							{sort === "recent"
								? isRaw
									? "Mới tạo gần nhất"
									: "Chỉnh sửa gần nhất"
								: sort === "created"
									? "Mới tạo gần nhất"
									: "Tên A-Z"}
							<CaretDown className="size-3" />
						</Button>
						<Dropdown.Popover>
							<Dropdown.Menu aria-label={isRaw ? "Sắp xếp video" : "Sắp xếp dự án"}>
								{!isRaw && (
									<Dropdown.Item id="recent" onAction={() => setSort("recent")}>
										Chỉnh sửa gần nhất
									</Dropdown.Item>
								)}
								<Dropdown.Item id="created" onAction={() => setSort("created")}>
									Mới tạo gần nhất
								</Dropdown.Item>
								<Dropdown.Item id="name" onAction={() => setSort("name")}>
									Tên A-Z
								</Dropdown.Item>
							</Dropdown.Menu>
						</Dropdown.Popover>
					</Dropdown>
				</div>
			</div>
			{selecting && (
				<div className="flex items-center gap-3 px-7 pb-5 text-xs lg:px-10">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setSelected(visible.map((e) => e.path))}
					>
						Chọn tất cả
					</Button>
					<span>Đã chọn {selected.length}</span>
					<Button
						variant="destructive"
						size="sm"
						disabled={!selected.length || busy}
						onClick={() => void deleteEntries(selected)}
					>
						Xóa
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setSelecting(false);
							setSelected([]);
						}}
					>
						Hủy
					</Button>
				</div>
			)}
		</>
	);
}
