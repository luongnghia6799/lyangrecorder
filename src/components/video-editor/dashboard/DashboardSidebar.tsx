import { RecordNewButton } from "./RecordNewButton";
import { SidebarCards } from "./SidebarCards";
import { FolderRow } from "./FolderRow";
import { File, GearSix, House, Plus } from "@/components/ui/icons";

import { Button } from "@/components/ui/button";

import type { DashboardProps } from "./types";

import type { DashboardModel } from "./useDashboardModel";
import { FOLDER_COLORS } from "./useProjectFolders";

export function DashboardSidebar({
	busy,
	run,
	folders,
	save,
	section,
	setSection,
	metadata,
	update,
	navClass,
}: Pick<
	DashboardProps & DashboardModel,
	| "busy"
	| "run"
	| "folders"
	| "save"
	| "section"
	| "setSection"
	| "metadata"
	| "update"
	| "navClass"
>) {
	return (
		<>
			<aside
				aria-label="Library navigation"
				className="flex w-52 shrink-0 flex-col bg-transparent px-4 pb-5 pt-8 lg:w-60"
			>
				<div className="mb-5 flex h-10 items-center justify-between px-2">
					<div className="flex items-center gap-2.5">
						<img
							src="/mascot.png"
							alt="LyangRecorder"
							className="size-8 rounded-xl object-cover shadow-xs border border-[#E8DED3]"
						/>
						<div className="flex flex-col">
							<span className="text-[14px] font-bold tracking-tight text-[#1C1917]">LyangRecorder</span>
						</div>
					</div>
					<span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-[#E8F5E9] text-[#0D5C3A] border border-[#C8E6C9]">
						PRO
					</span>
				</div>
				<RecordNewButton busy={busy} run={run} className="mb-5 w-full" />
				<nav className="space-y-1">
					<Button
						variant="ghost"
						className={navClass(section === "projects")}
						aria-current={section === "projects" ? "page" : undefined}
						onClick={() => setSection("projects")}
					>
						<House weight="fill" className="size-[18px] text-[#0D5C3A]" />
						Trang chủ
					</Button>
					<Button
						variant="ghost"
						className={navClass(section === "raw")}
						aria-current={section === "raw" ? "page" : undefined}
						onClick={() => setSection("raw")}
					>
						<File
							weight={section === "raw" ? "fill" : "regular"}
							className="size-[18px]"
						/>
						Video gốc
					</Button>
				</nav>
				<div className="mb-2 mt-8 flex items-center justify-between pl-3">
					<h2 className="text-[12px] font-semibold uppercase tracking-wider text-[#78716C]">
						Thư mục
					</h2>
					<Button
						variant="ghost"
						size="icon"
						className="size-7 min-w-7 hover:bg-black/5 rounded-lg text-[#78716C] hover:text-[#1C1917]"
						aria-label="Thư mục mới"
						onClick={() => {
							let name = "Thư mục mới",
								index = 1;
							while (folders.some((folder) => folder.name === name))
								name = `Thư mục mới ${index++}`;
							save([
								...folders,
								{
									id: crypto.randomUUID(),
									name,
									color: FOLDER_COLORS[0],
									paths: [],
								},
							]);
						}}
					>
						<Plus className="size-3.5" />
					</Button>
				</div>
				<div className="min-h-0 flex-1 overflow-y-auto space-y-1 custom-scrollbar">
					{folders.map((folder) => (
						<FolderRow
							key={folder.id}
							folder={folder}
							active={section === folder.id}
							onSelect={() => setSection(folder.id)}
							onChange={(next) =>
								save(folders.map((item) => (item.id === next.id ? next : item)))
							}
							onRemove={() => {
								save(folders.filter((item) => item.id !== folder.id));
								if (section === folder.id) setSection("projects");
							}}
							colors={metadata.colors}
							onColors={(colors) => update({ ...metadata, colors })}
						/>
					))}
				</div>
				<div className="space-y-1.5 pt-4 mt-auto border-t border-[#E8DED3]">
					<SidebarCards />
					<Button
						variant="ghost"
						className={navClass(section === "settings")}
						aria-current={section === "settings" ? "page" : undefined}
						onClick={() => setSection("settings")}
					>
						<GearSix
							weight={section === "settings" ? "fill" : "regular"}
							className="size-[18px]"
						/>
						Cài đặt
					</Button>
				</div>
			</aside>
		</>
	);
}
