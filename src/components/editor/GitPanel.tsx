import React, { useState, useEffect } from "react";
import { GitOperations } from "@/lib/git-operations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Check, GitBranch } from "lucide-react";

interface GitPanelProps {
  git: GitOperations | null;
}

export function GitPanel({ git }: GitPanelProps) {
  const [status, setStatus] = useState<any>(null);
  const [currentBranch, setCurrentBranch] = useState<string>("");
  const [commitMessage, setCommitMessage] = useState<string>("");

  useEffect(() => {
    if (git) {
      loadStatus();
      loadBranch();
    }
  }, [git]);

  async function loadStatus() {
    if (!git) return;
    try {
      const s = await git.status();
      setStatus(s);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadBranch() {
    if (!git) return;
    try {
      const branch = await git.currentBranch();
      setCurrentBranch(branch);
    } catch (e) {
      console.error(e);
    }
  }

  async function stageFile(filepath: string) {
    if (!git) return;
    await git.add(filepath);
    loadStatus();
  }

  async function unstageFile(filepath: string) {
    if (!git) return;
    await git.reset(filepath);
    loadStatus();
  }

  async function commit() {
    if (!git || !commitMessage) return;
    await git.commit(commitMessage);
    setCommitMessage("");
    loadStatus();
  }

  if (!git) {
    return (
      <div className="flex-1 min-h-0">
        <div className="px-3 py-2 text-xs uppercase tracking-wide text-slate-300">
          Git
        </div>
        <div className="px-3 pb-2 text-slate-400">No repository loaded</div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-slate-300 flex items-center gap-2">
        <GitBranch size={14} />
        Git
      </div>
      <div className="px-3 pb-2">
        <div className="text-sm text-slate-300 mb-2">
          Branch: {currentBranch}
        </div>
        {status && (
          <>
            {status.staged.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-green-400 mb-1">
                  Staged Changes
                </div>
                {status.staged.map((file: string) => (
                  <div
                    key={file}
                    className="flex items-center justify-between text-sm text-slate-300 mb-1"
                  >
                    <span>{file}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => unstageFile(file)}
                    >
                      <Minus size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {status.modified.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-yellow-400 mb-1">Modified</div>
                {status.modified.map((file: string) => (
                  <div
                    key={file}
                    className="flex items-center justify-between text-sm text-slate-300 mb-1"
                  >
                    <span>{file}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => stageFile(file)}
                    >
                      <Plus size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {status.untracked.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-blue-400 mb-1">Untracked</div>
                {status.untracked.map((file: string) => (
                  <div
                    key={file}
                    className="flex items-center justify-between text-sm text-slate-300 mb-1"
                  >
                    <span>{file}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => stageFile(file)}
                    >
                      <Plus size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Commit message"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="flex-1"
              />
              <Button onClick={commit} disabled={!commitMessage}>
                <Check size={14} />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
