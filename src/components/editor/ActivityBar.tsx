import {
  FolderTree,
  Search as SearchIcon,
  Bug,
  User as UserIcon,
} from "lucide-react";

export type ActivityKey = "explorer" | "search" | "debug";

export function ActivityBar({
  active,
  setActive,
  onToggleUser,
}: {
  active: ActivityKey;
  setActive: (k: ActivityKey) => void;
  onToggleUser: () => void;
}) {
  return (
    <div className="w-12 bg-[#252526] flex flex-col items-center py-2 gap-3 border-r border-black/20 relative">
      <button
        aria-label="Explorer"
        onClick={() => setActive("explorer")}
        className={`p-2 rounded ${active === "explorer" ? "bg-[#3c3c3c]" : "hover:bg-[#2a2a2a]"}`}
      >
        <FolderTree size={18} />
      </button>
      <button
        aria-label="Search"
        onClick={() => setActive("search")}
        className={`p-2 rounded ${active === "search" ? "bg-[#3c3c3c]" : "hover:bg-[#2a2a2a]"}`}
      >
        <SearchIcon size={18} />
      </button>
      <button
        aria-label="Debug"
        onClick={() => setActive("debug")}
        className={`p-2 rounded ${active === "debug" ? "bg-[#3c3c3c]" : "hover:bg-[#2a2a2a]"}`}
      >
        <Bug size={18} />
      </button>
      <div className="mt-auto" />
      <button
        aria-label="User"
        onClick={onToggleUser}
        className="p-2 rounded hover:bg-[#2a2a2a]"
      >
        <UserIcon size={18} />
      </button>
    </div>
  );
}
