import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/stores/auth";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Tree } from "react-arborist";
import {
  FolderTree,
  Search as SearchIcon,
  Bug,
  Play,
  User as UserIcon,
  FilePlus,
  FolderPlus,
  LogOut,
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { LIST_REPOSITORIES, CREATE_REPOSITORY } from "@/lib/github-graphql";

export const Route = createFileRoute("/editor")({
  component: EditorPage,
});

// Simple in-memory file tree demo
type FileNode = {
  id: string;
  name: string;
  isDir?: boolean;
  children?: FileNode[];
};

const demoTree: FileNode[] = [
  {
    id: "root",
    name: "my-project",
    isDir: true,
    children: [
      {
        id: "src",
        name: "src",
        isDir: true,
        children: [
          { id: "main.ts", name: "main.ts" },
          { id: "utils.ts", name: "utils.ts" },
        ],
      },
      { id: "README.md", name: "README.md" },
      {
        id: "public",
        name: "public",
        isDir: true,
        children: [{ id: "index.html", name: "index.html" }],
      },
    ],
  },
];

const demoFileContents: Record<string, string> = {
  "main.ts": `export function greet(name: string){\n  return 'Hello, ' + name\n}\n\nconsole.log(greet('World'))\n`,
  "utils.ts": `export const sum = (a: number, b: number) => a + b\n`,
  "README.md": `# My Project\n\nThis is a demo workspace.`,
  "index.html": `<!doctype html>\n<html><head><meta charset="utf-8"/><title>Demo</title></head><body><div id="app"></div></body></html>`,
};

// Repository minimal type for picker
type RepoNode = {
  id: string;
  name: string;
  nameWithOwner: string;
  isPrivate: boolean;
  defaultBranchRef: { name: string } | null;
};

type CreateRepoResult = {
  createRepository?: {
    repository?: RepoNode;
  };
};

function RepoPicker({ onSelect }: { onSelect: (repo: RepoNode) => void }) {
  const { data, loading, error, refetch } = useQuery<{
    viewer: { repositories: { nodes: RepoNode[] } };
  }>(LIST_REPOSITORIES);
  const [repoName, setRepoName] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");
  const [createRepo, { loading: creating }] = useMutation<CreateRepoResult>(
    CREATE_REPOSITORY,
    {
      variables: { name: repoName, visibility },
      onCompleted: (res) => {
        const created = res?.createRepository?.repository;
        if (created) onSelect(created);
      },
    }
  );

  return (
    <div className="w-full min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold">Select a Repository</h1>
        <p className="text-slate-300 mt-1">
          Choose from your GitHub repositories or create a new one.
        </p>

        <div className="mt-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-slate-800/60 rounded-lg border border-white/10 p-4 min-h-[360px]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm uppercase tracking-wide text-slate-300">
                Your Repositories
              </h2>
              <button
                onClick={() => refetch()}
                className="text-xs text-slate-300 hover:text-white"
              >
                Refresh
              </button>
            </div>
            <div className="mt-3 divide-y divide-white/5">
              {loading && <div className="py-6 text-slate-400">Loading...</div>}
              {error && (
                <div className="py-6 text-red-400">{error.message}</div>
              )}
              {(data?.viewer.repositories.nodes ?? []).map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => onSelect(repo)}
                  className="w-full text-left py-3 px-2 hover:bg-white/5 rounded flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{repo.nameWithOwner}</div>
                    <div className="text-xs text-slate-400">
                      {repo.defaultBranchRef?.name ?? "No default branch"}
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-200">
                    {repo.isPrivate ? "Private" : "Public"}
                  </span>
                </button>
              ))}
              {!loading &&
                (data?.viewer.repositories.nodes ?? []).length === 0 && (
                  <div className="py-6 text-slate-400">
                    No repositories found.
                  </div>
                )}
            </div>
          </div>

          <div className="w-full md:w-80 bg-slate-800/60 rounded-lg border border-white/10 p-4 h-fit">
            <h2 className="text-sm uppercase tracking-wide text-slate-300">
              Create New
            </h2>
            <div className="mt-3 space-y-3">
              <input
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="repository-name"
                className="w-full bg-[#1f1f1f] border border-black/20 rounded px-2 py-2 text-sm outline-none focus:ring-1 ring-blue-500"
              />
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full bg-[#1f1f1f] border border-black/20 rounded px-2 py-2 text-sm outline-none"
              >
                <option value="PRIVATE">Private</option>
                <option value="PUBLIC">Public</option>
              </select>
              <button
                disabled={!repoName || creating}
                onClick={() => createRepo()}
                className="w-full bg-blue-600/90 hover:bg-blue-600 disabled:opacity-50 px-3 py-2 rounded text-sm"
              >
                Create Repository
              </button>
              <div className="text-xs text-slate-400">
                Repo will be created under your account.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorPage() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [activePanel, setActivePanel] = useState<
    "explorer" | "search" | "debug"
  >("explorer");
  const [selectedFile, setSelectedFile] = useState<string>("main.ts");
  const [fileContents, setFileContents] =
    useState<Record<string, string>>(demoFileContents);
  const [editorValue, setEditorValue] = useState<string>(
    demoFileContents["main.ts"]
  );
  const [treeData, setTreeData] = useState<FileNode[]>(demoTree);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<RepoNode | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  function handleSelect(nodes: any[]) {
    const node = nodes?.[0];
    if (!node) return;
    const data = node.data as FileNode;
    setSelectedNodeId(data.id);
    if (!data.isDir) {
      setSelectedFile(data.name);
      setEditorValue(fileContents[data.name] ?? "");
    }
  }

  function upsertChild(
    nodes: FileNode[],
    targetId: string,
    newNode: FileNode
  ): FileNode[] {
    return nodes.map((n) => {
      if (n.id === targetId) {
        const children = n.children ? [...n.children, newNode] : [newNode];
        return { ...n, children };
      }
      if (n.children) {
        return { ...n, children: upsertChild(n.children, targetId, newNode) };
      }
      return n;
    });
  }

  function addFile() {
    const name = prompt("New file name (e.g., new-file.ts)")?.trim();
    if (!name) return;
    const id = `${Date.now()}-${name}`;
    const fileNode: FileNode = { id, name };
    const targetId = selectedNodeId || "root";
    setTreeData((prev) => upsertChild(prev, targetId, fileNode));
    setFileContents((prev) => ({ ...prev, [name]: "" }));
  }

  function addFolder() {
    const name = prompt("New folder name")?.trim();
    if (!name) return;
    const id = `${Date.now()}-${name}`;
    const folderNode: FileNode = { id, name, isDir: true, children: [] };
    const targetId = selectedNodeId || "root";
    setTreeData((prev) => upsertChild(prev, targetId, folderNode));
  }

  function runApp() {
    console.log("Running app with file:", selectedFile);
    alert("Run started (placeholder).");
  }

  function handleLogout() {
    logout();
    navigate({ to: "/login", replace: true });
  }

  // Persist editor changes into file contents map
  function onEditorChange(v?: string) {
    const next = v ?? "";
    setEditorValue(next);
    setFileContents((prev) => ({ ...prev, [selectedFile]: next }));
  }

  if (!selectedRepo) {
    return <RepoPicker onSelect={(repo) => setSelectedRepo(repo)} />;
  }

  return (
    <div className="w-full h-screen bg-[#1e1e1e] text-white flex relative">
      {/* Activity Bar */}
      <div className="w-12 bg-[#252526] flex flex-col items-center py-2 gap-3 border-r border-black/20 relative">
        <button
          aria-label="Explorer"
          onClick={() => setActivePanel("explorer")}
          className={`p-2 rounded ${
            activePanel === "explorer" ? "bg-[#3c3c3c]" : "hover:bg-[#2a2a2a]"
          }`}
        >
          <FolderTree size={18} />
        </button>
        <button
          aria-label="Search"
          onClick={() => setActivePanel("search")}
          className={`p-2 rounded ${
            activePanel === "search" ? "bg-[#3c3c3c]" : "hover:bg-[#2a2a2a]"
          }`}
        >
          <SearchIcon size={18} />
        </button>
        <button
          aria-label="Debug"
          onClick={() => setActivePanel("debug")}
          className={`p-2 rounded ${
            activePanel === "debug" ? "bg-[#3c3c3c]" : "hover:bg-[#2a2a2a]"
          }`}
        >
          <Bug size={18} />
        </button>
        <div className="mt-auto" />
        <button
          aria-label="User"
          onClick={() => setShowUserMenu((s) => !s)}
          className="p-2 rounded hover:bg-[#2a2a2a]"
        >
          <UserIcon size={18} />
        </button>
        {showUserMenu && (
          <div className="absolute left-12 bottom-4 bg-[#252526] border border-black/20 rounded shadow-lg w-44 py-2 z-50">
            <div className="px-3 pb-2 text-xs text-slate-400">
              {selectedRepo.nameWithOwner}
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
                    <span>{(node.data as FileNode).name}</span>
                  </div>
                )}
              </Tree>
            </div>
          </div>
        )}
        {activePanel === "search" && (
          <div className="p-3 space-y-2">
            <div className="text-xs uppercase tracking-wide text-slate-300">
              Search
            </div>
            <input
              className="w-full bg-[#1f1f1f] border border-black/20 rounded px-2 py-1 text-sm outline-none focus:ring-1 ring-blue-500"
              placeholder="Search (placeholder)"
            />
            <div className="text-slate-400 text-xs">
              Type to search across files (not implemented)
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
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab Bar */}
        <div className="h-9 bg-[#2d2d2d] border-b border-black/20 flex items-center px-3 text-sm">
          <div className="px-2 py-1 bg-[#1f1f1f] rounded">{selectedFile}</div>
        </div>
        {/* Editor */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            theme="vs-dark"
            language={
              selectedFile.endsWith(".ts")
                ? "typescript"
                : selectedFile.endsWith(".md")
                  ? "markdown"
                  : selectedFile.endsWith(".html")
                    ? "html"
                    : "plaintext"
            }
            value={editorValue}
            onChange={onEditorChange}
            options={{ fontSize: 14, minimap: { enabled: false } }}
          />
        </div>
      </div>
    </div>
  );
}
