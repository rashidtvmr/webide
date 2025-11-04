import React from "react";
import { Tree } from "react-arborist";
import { FilePlus, FolderPlus } from "lucide-react";
import type { FsTreeNode } from "@/lib/git-operations";

interface ExplorerPanelProps {
  treeData: FsTreeNode[];
  onSelect: (nodes: any[]) => void;
  onAddFile: () => void;
  onAddFolder: () => void;
}

export function ExplorerPanel({
  treeData,
  onSelect,
  onAddFile,
  onAddFolder,
}: ExplorerPanelProps) {
  return (
    <div className="flex-1 min-h-0">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-slate-300 flex items-center justify-between">
        <span>Explorer</span>
        <div className="flex items-center gap-1">
          <button
            title="New File"
            onClick={onAddFile}
            className="p-1 rounded hover:bg-white/5"
          >
            <FilePlus size={16} />
          </button>
          <button
            title="New Folder"
            onClick={onAddFolder}
            className="p-1 rounded hover:bg-white/5"
          >
            <FolderPlus size={16} />
          </button>
        </div>
      </div>
      <div className="px-2 pb-2 h-[calc(100vh-48px)] overflow-auto">
        <Tree
          data={treeData}
          openByDefault
          selection="single"
          height={560}
          rowHeight={28}
          onSelect={onSelect}
        >
          {({ node, style }) => (
            <div
              style={style}
              className="flex items-center gap-2 px-2 text-sm cursor-pointer hover:bg-white/5"
            >
              <span>{(node.data as FsTreeNode).name}</span>
            </div>
          )}
        </Tree>
      </div>
    </div>
  );
}
