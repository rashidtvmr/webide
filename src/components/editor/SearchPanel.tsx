import React from "react";

interface SearchPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function SearchPanel({ searchQuery, onSearchChange }: SearchPanelProps) {
  return (
    <div className="flex-1 min-h-0">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-slate-300">
        Search
      </div>
      <div className="px-3 pb-2">
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-2 py-1 text-sm bg-slate-800 border border-slate-600 rounded"
        />
      </div>
    </div>
  );
}
