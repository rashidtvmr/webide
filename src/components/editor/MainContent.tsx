import React from "react";
import Editor from "@monaco-editor/react";

interface MainContentProps {
  selectedFile: string;
  editorValue: string;
  onChangeEditor: (value?: string) => void;
  languageFromPath: (path: string) => string;
  loadingText: string;
}

export function MainContent({
  selectedFile,
  editorValue,
  onChangeEditor,
  languageFromPath,
  loadingText,
}: MainContentProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {loadingText && (
        <div className="flex items-center justify-center h-full text-slate-400">
          {loadingText}
        </div>
      )}
      {!loadingText && selectedFile && (
        <Editor
          height="100%"
          language={languageFromPath(selectedFile)}
          value={editorValue}
          onChange={onChangeEditor}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      )}
      {!loadingText && !selectedFile && (
        <div className="flex items-center justify-center h-full text-slate-400">
          Select a file to edit
        </div>
      )}
    </div>
  );
}
