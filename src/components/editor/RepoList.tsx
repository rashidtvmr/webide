import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { LIST_REPOSITORIES, CREATE_REPOSITORY } from "@/lib/github-graphql";
import { useAuthStore } from "@/stores/auth";

export type RepoNode = {
  id: string;
  name: string;
  nameWithOwner: string;
  isPrivate: boolean;
  defaultBranchRef: { name: string } | null;
};

type CreateRepoResult = {
  createRepository?: { repository?: RepoNode };
};

export function RepoList({
  onSelectGitHubRepo,
  onCreateLocalRepo,
}: {
  onSelectGitHubRepo: (repo: RepoNode) => void;
  onCreateLocalRepo: (name: string) => void;
}) {
  const { user } = useAuthStore();
  const isGithub = user?.provider === "github";
  const { data, loading, error, refetch } = useQuery<{
    viewer: { repositories: { nodes: RepoNode[] } };
  }>(LIST_REPOSITORIES, { skip: !isGithub });
  const [repoName, setRepoName] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");
  const [createRepo, { loading: creating }] = useMutation<CreateRepoResult>(
    CREATE_REPOSITORY,
    {
      variables: { name: repoName, visibility },
      onCompleted: (res) => {
        const created = res?.createRepository?.repository;
        if (created) onSelectGitHubRepo(created);
      },
    }
  );

  return (
    <div className="h-full w-full overflow-auto">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-wide text-slate-300">
            Repositories
          </h2>
          {isGithub ? (
            <div className="flex items-center gap-2">
              <input
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="new-repo-name"
                className="bg-[#1f1f1f] border border-black/20 rounded px-2 py-1 text-sm outline-none focus:ring-1 ring-blue-500"
              />
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="bg-[#1f1f1f] border border-black/20 rounded px-2 py-1 text-sm outline-none"
              >
                <option value="PRIVATE">Private</option>
                <option value="PUBLIC">Public</option>
              </select>
              <button
                disabled={!repoName || creating}
                onClick={() => createRepo()}
                className="bg-blue-600/90 hover:bg-blue-600 disabled:opacity-50 px-3 py-1.5 rounded text-sm"
              >
                Create
              </button>
              <button
                onClick={() => refetch()}
                className="text-xs text-slate-300 hover:text-white"
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="local-repo-name"
                className="bg-[#1f1f1f] border border-black/20 rounded px-2 py-1 text-sm outline-none focus:ring-1 ring-blue-500"
              />
              <button
                disabled={!repoName}
                onClick={() => onCreateLocalRepo(repoName)}
                className="bg-blue-600/90 hover:bg-blue-600 disabled:opacity-50 px-3 py-1.5 rounded text-sm"
              >
                Create Local Repo
              </button>
            </div>
          )}
        </div>

        {isGithub && (
          <div className="mt-4 divide-y divide-white/5 bg-[#1f1f1f] border border-black/20 rounded">
            {loading && (
              <div className="py-6 px-3 text-slate-400">Loading...</div>
            )}
            {error && (
              <div className="py-6 px-3 text-red-400">{error.message}</div>
            )}
            {(data?.viewer.repositories.nodes ?? []).map((repo) => (
              <button
                key={repo.id}
                onClick={() => onSelectGitHubRepo(repo)}
                className="w-full text-left py-3 px-3 hover:bg-white/5 flex items-center justify-between"
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
                <div className="py-6 px-3 text-slate-400">
                  No repositories found.
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
