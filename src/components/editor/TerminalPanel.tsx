import React from "react";

interface TerminalPanelProps {
  // Add props if needed
}

export function TerminalPanel({}: TerminalPanelProps) {
  return (
    <div className="flex-1 min-h-0">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-slate-300">
        Terminal
      </div>
      <div className="px-3 pb-2">
        <div className="bg-black text-green-400 p-2 rounded font-mono text-sm">
          <div>$ Welcome to the terminal</div>
          <div>$ Commands are not yet implemented</div>
        </div>
        <input
          type="text"
          placeholder="Enter command..."
          className="w-full mt-2 px-2 py-1 text-sm bg-slate-800 border border-slate-600 rounded"
        />
      </div>
    </div>
  );
}
