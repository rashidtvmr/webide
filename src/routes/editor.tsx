import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/stores/auth";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Tree } from "react-arborist";
import { Play, FilePlus, FolderPlus, LogOut } from "lucide-react";
import { ActivityBar } from "@/components/editor/ActivityBar";
import type { ActivityKey } from "@/components/editor/ActivityBar";
import { RepoList } from "@/components/editor/RepoList";
import type { RepoNode } from "@/components/editor/RepoList";
import { GitOperations } from "@/lib/git-operations";
import type { FsTreeNode } from "@/lib/git-operations";
import { TerminalPanel } from "@/components/editor/TerminalPanel";
import { GitPanel } from "@/components/editor/GitPanel";

export const Route = createFileRoute("/editor")({
  component: EditorPage,
});

function EditorPage() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [activePanel, setActivePanel] = useState<ActivityKey>("explorer");
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Repo/session state
  const [repoLabel, setRepoLabel] = useState<string | null>(null);
  const [git, setGit] = useState<GitOperations | null>(null);
  const [treeData, setTreeData] = useState<FsTreeNode[]>([]);

  // File state
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [editorValue, setEditorValue] = useState<string>("");
  const [selectedNode, setSelectedNode] = useState<FsTreeNode | null>(null);
  const [loadingText, setLoadingText] = useState<string>("");

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<
    { file: string; line: number; content: string }[]
  >([]);

  // Editor ref for cursor positioning
  const editorRef = useRef<any>(null);

  // Helpers
  async function refreshTree(curGit = git) {
    if (!curGit) return;
    const tree = await curGit.listTree();
    setTreeData(tree);
  }

  async function openFile(path: string) {
    if (!git) return;
    const content = await git.readFile(path);
    setSelectedFile(path);
    setEditorValue(content);
  }

  function languageFromPath(path: string) {
    return path.endsWith(".ts")
      ? "typescript"
      : path.endsWith(".tsx")
        ? "typescript"
        : path.endsWith(".js")
          ? "javascript"
          : path.endsWith(".md")
            ? "markdown"
            : path.endsWith(".html")
              ? "html"
              : path.endsWith(".css")
                ? "css"
                : "plaintext";
  }

  async function onChangeEditor(v?: string) {
    const next = v ?? "";
    setEditorValue(next);
    if (git && selectedFile) {
      await git.writeFile(selectedFile, next);
    }
  }

  // Explorer handlers
  function getTargetDir(): string {
    if (!selectedNode) return ""; // repo root
    if (selectedNode.isDir) return selectedNode.path;
    const parts = selectedNode.path.split("/");
    parts.pop();
    return parts.join("/");
  }

  async function addFile() {
    if (!git) return;
    const name = prompt("New file name (e.g., src/new-file.ts)")?.trim();
    if (!name) return;
    const base = getTargetDir();
    const path = base ? `${base}/${name}` : name;
    await git.createFile(path);
    await refreshTree();
  }

  async function addFolder() {
    if (!git) return;
    const name = prompt("New folder name (e.g., src/components)")?.trim();
    if (!name) return;
    const base = getTargetDir();
    const path = base ? `${base}/${name}` : name;
    await git.createFolder(path);
    await refreshTree();
  }

  async function handleSelect(nodes: any[]) {
    const node = nodes?.[0];
    if (!node) return;
    const data = node.data as FsTreeNode;
    setSelectedNode(data);
    if (!data.isDir) {
      await openFile(data.path);
    }
  }

  // Repo selection/creation
  async function onSelectGitHubRepo(repo: RepoNode) {
    const token = user?.token;
    const [owner, repoName] = repo.nameWithOwner.split("/");
    const ref = repo.defaultBranchRef?.name || "main";
    const workDir = `/workspaces/${repo.nameWithOwner}`;
    const g = new GitOperations(workDir);
    setRepoLabel(repo.nameWithOwner);
    setGit(g);
    setActivePanel("explorer");
    setShowUserMenu(false);
    try {
      setLoadingText("Downloading tarball...");
      await g.importFromTarball(owner, repoName, ref, token);
      setLoadingText("Building file tree...");
      await refreshTree(g);
    } catch (e) {
      console.error(e);
      alert("Failed to import repository tarball. Check permissions or token.");
    } finally {
      setLoadingText("");
    }
  }

  async function onCreateLocalRepo(name: string) {
    const workDir = `/local/${name}`;
    const g = new GitOperations(workDir);
    setRepoLabel(name);
    setGit(g);
    setActivePanel("explorer");
    setShowUserMenu(false);
    await g.initLocal();
    await refreshTree(g);
  }

  function handleLogout() {
    logout();
    navigate({ to: "/login", replace: true });
  }

  function runApp() {
    alert("Run started (placeholder).");
  }

  // Search effect
  useEffect(() => {
    if (!git || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const doSearch = async () => {
      const results = await git.search(searchQuery);
      setSearchResults(results);
    };
    doSearch();
  }, [searchQuery, git]);

  // Open search result
  async function openSearchResult(file: string, line: number) {
    await openFile(file);
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.revealLineInCenter(line);
        editorRef.current.setPosition({ lineNumber: line, column: 1 });
      }
    }, 100);
  }

  return (
    <div className="w-full h-screen bg-[#1e1e1e] text-white flex relative">
      <ActivityBar
        active={activePanel}
        setActive={setActivePanel}
        onToggleUser={() => setShowUserMenu((s) => !s)}
      />

      {/* Side Panel */}
      <div className="w-64 bg-[#252526] border-r border-black/20 flex flex-col">
        {activePanel === "explorer" && (
          <div className="flex-1 min-h-0">
            <div className="px-3 py-2 text-xs uppercase tracking-wide text-slate-300 flex items-center justify-between">
              <span>Explorer</span>
              <div className="flex items-center gap-1">
                <button
                  title="New File"
                  onClick={addFile}
                  className="p-1 rounded hover:bg-white/5"
                >
                  <FilePlus size={16} />
                </button>
                <button
                  title="New Folder"
                  onClick={addFolder}
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
                selection={"single"}
                height={560}
                rowHeight={28}
                onSelect={handleSelect}
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
        )}
        {activePanel === "search" && (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="p-3 space-y-2">
              <div className="text-xs uppercase tracking-wide text-slate-300">
                Search
              </div>
              <input
                className="w-full bg-[#1f1f1f] border border-black/20 rounded px-2 py-1 text-sm outline-none focus:ring-1 ring-blue-500"
                placeholder="Search across files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-auto px-3 pb-3">
              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="p-2 bg-[#1f1f1f] rounded cursor-pointer hover:bg-white/5 text-sm"
                      onClick={() => openSearchResult(result.file, result.line)}
                    >
                      <div className="text-blue-400 font-medium truncate">
                        {result.file}:{result.line}
                      </div>
                      <div className="text-slate-300 text-xs truncate">
                        {result.content.trim()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="text-slate-400 text-xs">No results found</div>
              ) : (
                <div className="text-slate-400 text-xs">
                  Enter a search term
                </div>
              )}
            </div>
          </div>
        )}
        {activePanel === "debug" && (
          <div className="p-3 space-y-3">
            <div className="text-xs uppercase tracking-wide text-slate-300">
              Run & Debug
            </div>
            <button
              onClick={runApp}
              className="flex items-center gap-2 bg-green-600/90 hover:bg-green-600 px-3 py-1.5 rounded text-sm"
            >
              <Play size={16} /> Run
            </button>
            <div className="text-slate-400 text-xs">
              Runs your app (placeholder)
            </div>
          </div>
        )}
        {activePanel === "terminal" && <TerminalPanel />}
        {activePanel === "git" && <GitPanel git={git} />}
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab Bar */}
        <div className="h-9 bg-[#2d2d2d] border-b border-black/20 flex items-center px-3 text-sm justify-between">
          <div className="px-2 py-1 bg-[#1f1f1f] rounded min-w-0 truncate">
            {selectedFile || repoLabel || "No repository selected"}
          </div>
          {/* User menu */}
          {showUserMenu && (
            <div className="absolute left-12 bottom-4 bg-[#252526] border border-black/20 rounded shadow-lg w-44 py-2 z-50">
              <div className="px-3 pb-2 text-xs text-slate-400">
                {repoLabel ?? "No repository"}
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center gap-2 text-sm"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
        {/* Editor or Repo List */}
        <div className="flex-1 min-h-0">
          {loadingText ? (
            <div className="h-full w-full flex items-center justify-center text-slate-300">
              {loadingText}
            </div>
          ) : !git ? (
            <RepoList
              onSelectGitHubRepo={onSelectGitHubRepo}
              onCreateLocalRepo={onCreateLocalRepo}
            />
          ) : (
            <Editor
              height="100%"
              theme="vs-dark"
              language={languageFromPath(selectedFile)}
              value={editorValue}
              onChange={onChangeEditor}
              options={{ fontSize: 14, minimap: { enabled: false } }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
