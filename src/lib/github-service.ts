import { Octokit } from "@octokit/rest";
import { getSupabase } from "./supabase";

export interface GitHubRepo {
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  url: string;
  defaultBranch: string;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke(
    "github-secret-getter",
    {
      body: { code },
    },
  );

  if (error || !data?.access_token) {
    throw new Error(
      "Failed to exchange code for token: " +
        (error?.message || "No token received"),
    );
  }

  return data.access_token;
}

export class GitHubService {
  private octokit: Octokit;
  private token: string;

  constructor(token: string) {
    this.token = token;
    this.octokit = new Octokit({ auth: token });
  }

  async listRepositories(): Promise<GitHubRepo[]> {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    });

    return data.map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      url: repo.clone_url,
      defaultBranch: repo.default_branch,
    }));
  }

  async cloneRepository(repoUrl: string, path: string) {
    const git = await import("isomorphic-git");
    const http = await import("isomorphic-git/http/web");
    const fs = await import("@isomorphic-git/lightning-fs");

    const lfs = new fs.default("myeditor");

    await git.clone({
      fs: lfs,
      http,
      url: repoUrl,
      dir: path,
      corsProxy: "https://cors.isomorphic-git.org",
      onAuth: () => ({
        username: "x-oauth-basic",
        password: this.token,
      }),
    });
  }
}
