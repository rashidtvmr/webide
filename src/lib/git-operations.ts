import {
  add,
  addRemote,
  branch,
  checkout,
  clone,
  commit,
  init,
  listFiles,
  log,
  push,
} from "isomorphic-git";
import * as http from "isomorphic-git/http/web";
import LightningFS from "@isomorphic-git/lightning-fs";
import JSZip from "jszip";

const CORS_PROXY = import.meta.env.VITE_GIT_CORS_PROXY ||
  "https://cors.isomorphic-git.org";

// Initialize the file system
const ifs = new LightningFS("myeditor");

// Small helper to ensure nested folder creation
async function mkdirp(path: string) {
  const parts = path.split("/").filter(Boolean);
  let cur = "";
  for (const p of parts) {
    cur += "/" + p;
    try {
      // @ts-ignore - stat throws if missing
      await ifs.promises.stat(cur);
    } catch {
      await ifs.promises.mkdir(cur);
    }
  }
}

function decodeBase64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64.replace(/\n/g, ""));
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function pLimit<T>(
  limit: number,
  tasks: (() => Promise<T>)[],
): Promise<T[]> {
  const results: T[] = [];
  let idx = 0;
  let active = 0;
  return await new Promise((resolve, reject) => {
    const runNext = () => {
      if (idx >= tasks.length && active === 0) return resolve(results);
      while (active < limit && idx < tasks.length) {
        const cur = tasks[idx++]();
        active++;
        cur
          .then((res) => results.push(res))
          .catch(reject)
          .finally(() => {
            active--;
            runNext();
          });
      }
    };
    runNext();
  });
}

export type FsTreeNode = {
  id: string;
  name: string;
  path: string;
  isDir?: boolean;
  children?: FsTreeNode[];
};

export class GitOperations {
  constructor(private workDir: string) {}

  private authHeaders(token?: string): Record<string, string> | undefined {
    if (!token) return undefined;
    // GitHub expects token as username with 'x-oauth-basic' password for Basic auth
    const basic = btoa(`${token}:x-oauth-basic`);
    return { Authorization: `Basic ${basic}` };
  }

  async listRepositories() {
    throw new Error(
      "Cannot list GitHub repositories with Isomorphic Git - requires GitHub API",
    );
  }

  async ensureWorkdir() {
    await mkdirp(this.workDir);
  }

  async initLocal(defaultBranch = "main") {
    await this.ensureWorkdir();
    await init({ fs: ifs, dir: this.workDir, defaultBranch });
  }

  async clone(url: string, token?: string) {
    await this.ensureWorkdir();
    await clone({
      fs: ifs,
      http,
      dir: this.workDir,
      url,
      corsProxy: CORS_PROXY,
      headers: this.authHeaders(token),
      onAuth: () => ({
        username: token || "",
        password: token ? "x-oauth-basic" : "",
      }),
    });
  }

  async commit(
    { message, author }: {
      message: string;
      author: { name: string; email: string };
    },
  ) {
    await add({ fs: ifs, dir: this.workDir, filepath: "." });
    await commit({ fs: ifs, dir: this.workDir, message, author });
  }

  async listFiles() {
    return listFiles({ fs: ifs, dir: this.workDir });
  }

  async getHistory() {
    return log({ fs: ifs, dir: this.workDir });
  }

  async checkoutBranch(branchName: string) {
    await checkout({ fs: ifs, dir: this.workDir, ref: branchName });
  }

  async createBranch(branchName: string) {
    await branch({
      fs: ifs,
      dir: this.workDir,
      ref: branchName,
      checkout: true,
    });
  }

  async pushChanges(token: string) {
    await push({
      fs: ifs,
      http,
      dir: this.workDir,
      corsProxy: CORS_PROXY,
      headers: this.authHeaders(token),
      onAuth: () => ({
        username: token || "",
        password: token ? "x-oauth-basic" : "",
      }),
    });
  }

  async importFromZipball(
    owner: string,
    repo: string,
    ref = "main",
    token?: string,
  ) {
    await this.ensureWorkdir();
    const url = `https://api.github.com/repos/${owner}/${repo}/zipball/${
      encodeURIComponent(ref)
    }`;
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error(`Zipball fetch failed: ${res.status}`);
    const blob = await res.blob();

    const zip = await JSZip.loadAsync(blob);

    // Extract all files
    for (const [path, entry] of Object.entries(zip.files)) {
      const file: any = entry as any;
      if (file.dir) continue;

      // Strip top-level folder (GitHub zip includes one root folder)
      const relative = path.split("/").slice(1).join("/");
      if (!relative) continue;

      // Ensure parent directories
      const parts = relative.split("/");
      const parentParts = parts.slice(0, -1);
      let cur = this.workDir;
      for (const part of parentParts) {
        cur += `/${part}`;
        try {
          await ifs.promises.mkdir(cur);
        } catch {}
      }

      const data = await file.async("uint8array");
      await ifs.promises.writeFile(`${this.workDir}/${relative}`, data);
    }

    // Initialize a git repo and set remote so future git ops can work
    try {
      await init({ fs: ifs, dir: this.workDir, defaultBranch: ref });
    } catch {}
    try {
      await addRemote({
        fs: ifs,
        dir: this.workDir,
        remote: "origin",
        url: `https://github.com/${owner}/${repo}.git`,
        force: true,
      });
    } catch {}
  }

  async importViaGitTrees(
    owner: string,
    repo: string,
    ref = "main",
    token?: string,
    onProgress?: (done: number, total: number) => void,
  ) {
    await this.ensureWorkdir();
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    // 1) Get full recursive tree
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${
        encodeURIComponent(ref)
      }?recursive=1`,
      { headers },
    );
    if (!treeRes.ok) throw new Error(`Tree fetch failed: ${treeRes.status}`);
    const treeJson: {
      tree: Array<{ path: string; type: "blob" | "tree"; sha: string }>;
      truncated?: boolean;
    } = await treeRes.json();

    // 2) Create folders first
    for (const entry of treeJson.tree) {
      if (entry.type === "tree") {
        try {
          await ifs.promises.mkdir(`${this.workDir}/${entry.path}`);
        } catch {}
      }
    }

    // 3) Download blobs with concurrency and progress
    const blobs = treeJson.tree.filter((e) => e.type === "blob");
    let completed = 0;
    const total = blobs.length;
    const blobTasks = blobs.map((e) => async () => {
      const blobRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/blobs/${e.sha}`,
        { headers },
      );
      if (!blobRes.ok) {
        throw new Error(`Blob fetch failed ${e.path}: ${blobRes.status}`);
      }
      const blobJson: { content: string; encoding: "base64" } = await blobRes
        .json();
      const data = decodeBase64ToUint8Array(blobJson.content);

      // Ensure parent dirs exist
      const parent = e.path.split("/").slice(0, -1).join("/");
      if (parent) {
        let cur = this.workDir;
        for (const seg of parent.split("/")) {
          cur += `/${seg}`;
          try {
            await ifs.promises.mkdir(cur);
          } catch {}
        }
      }
      await ifs.promises.writeFile(`${this.workDir}/${e.path}`, data);
      completed++;
      onProgress?.(completed, total);
      return true;
    });

    await pLimit(8, blobTasks);

    // 4) Init repo and set remote
    try {
      await init({ fs: ifs, dir: this.workDir, defaultBranch: ref });
    } catch {}
    try {
      await addRemote({
        fs: ifs,
        dir: this.workDir,
        remote: "origin",
        url: `https://github.com/${owner}/${repo}.git`,
        force: true,
      });
    } catch {}

    // If truncated, caller may want to warn
    return { truncated: !!treeJson.truncated };
  }

  // Filesystem helpers
  async readFile(path: string): Promise<string> {
    const buf = await ifs.promises.readFile(`${this.workDir}/${path}`, "utf8");
    return typeof buf === "string" ? buf : new TextDecoder().decode(buf as any);
  }

  async writeFile(path: string, content: string) {
    const full = `${this.workDir}/${path}`;
    const parent = full.split("/").slice(0, -1).join("/");
    if (parent) await mkdirp(parent);
    await ifs.promises.writeFile(full, content, "utf8");
  }

  async createFile(path: string) {
    await this.writeFile(path, "");
  }

  async createFolder(path: string) {
    await mkdirp(`${this.workDir}/${path}`);
  }

  async listTree(): Promise<FsTreeNode[]> {
    const base = this.workDir.replace(/\/$/, "");
    async function walk(dir: string): Promise<FsTreeNode[]> {
      let entries: string[] = [];
      try {
        entries = await ifs.promises.readdir(dir);
      } catch {
        return [];
      }
      const nodes: FsTreeNode[] = [];
      for (const name of entries) {
        const full = `${dir}/${name}`;
        const st = await ifs.promises.stat(full);
        const rel = full.startsWith(base + "/")
          ? full.slice(base.length + 1)
          : full;
        if (st.isDirectory()) {
          nodes.push({
            id: rel,
            name,
            path: rel,
            isDir: true,
            children: await walk(full),
          });
        } else {
          nodes.push({ id: rel, name, path: rel });
        }
      }
      return nodes;
    }

    return walk(this.workDir);
  }
}
