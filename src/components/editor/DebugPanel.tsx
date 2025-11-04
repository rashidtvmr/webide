import React from "react";
import { Play } from "lucide-react";

interface DebugPanelProps {
  onRunApp: () => void;
}

export function DebugPanel({ onRunApp }: DebugPanelProps) {
  return (
    <div className="flex-1 min-h-0">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-slate-300">
        Debug
      </div>
      <div className="px-3 pb-2">
        <button
          onClick={onRunApp}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 rounded"
        >
          <Play size={16} />
          Run App
        </button>
      </div>
    </div>
  );
}
