import React from "react";
import { LogOut, X } from "lucide-react";

interface TabBarProps {
  openFiles: { path: string }[];
  activeTab: number;
  onSelectTab: (index: number) => void;
  onCloseTab: (index: number) => void;
  user: any;
  showUserMenu: boolean;
  setShowUserMenu: (show: boolean) => void;
  onLogout: () => void;
}

export function TabBar({
  openFiles,
  activeTab,
  onSelectTab,
  onCloseTab,
  user,
  showUserMenu,
  setShowUserMenu,
  onLogout,
}: TabBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
      <div className="flex items-center gap-1 overflow-x-auto">
        {openFiles.map((file, index) => (
          <div
            key={file.path}
            className={`flex items-center gap-2 px-3 py-1 text-sm cursor-pointer border-r border-slate-600 ${
              index === activeTab
                ? "bg-slate-700 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
            onClick={() => onSelectTab(index)}
          >
            <span className="truncate max-w-32">
              {file.path.split("/").pop()}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(index);
              }}
              className="hover:bg-slate-600 rounded p-0.5"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-slate-800 hover:bg-slate-700 rounded"
        >
          {user?.name || user?.login}
        </button>
        {showUserMenu && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-600 rounded shadow-lg z-10">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-700"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
