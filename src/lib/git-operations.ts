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
  reset,
  status,
} from "isomorphic-git";
import * as http from "isomorphic-git/http/web";
import LightningFS from "@isomorphic-git/lightning-fs";
import { ungzip } from "pako";
import untar from "js-untar";
import { getSupabase } from "@/lib/supabase";

const CORS_PROXY = import.meta.env.VITE_GIT_CORS_PROXY ||
  "https://cors.isomorphic-git.org";
const GH_ARCHIVE_FUNCTION_NAME: string =
  (import.meta.env.VITE_GH_ARCHIVE_FUNCTION_NAME as string) || "clever-handler";

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

  async commit(message: string) {
    await add({ fs: ifs, dir: this.workDir, filepath: "." });
    await commit({
      fs: ifs,
      dir: this.workDir,
      message,
      author: { name: "User", email: "user@example.com" },
    });
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

  // Import via Supabase Edge Function tarball only
  async importFromTarball(
    owner: string,
    repo: string,
    ref = "main",
    token?: string,
  ) {
    await this.ensureWorkdir();

    const supabase = getSupabase();
    const { data, error } = await supabase.functions.invoke(
      GH_ARCHIVE_FUNCTION_NAME,
      {
        body: { token, owner, repo, ref },
        headers: { Accept: "application/octet-stream" },
        // @ts-ignore
        responseType: "arraybuffer",
      } as any,
    );

    if (error) throw error;

    let ab: ArrayBuffer;
    if (data instanceof ArrayBuffer) ab = data;
    else if (data && typeof (data as any).arrayBuffer === "function") {
      ab = await (data as Blob).arrayBuffer();
    } else if (data instanceof Uint8Array) ab = data.buffer;
    else if (typeof data === "string") {
      ab = new TextEncoder().encode(data).buffer;
    } else {throw new Error(
        "Unexpected tarball response type from Edge Function",
      );}

    // Decompress gzip -> tar
    let tarBytes: Uint8Array;
    try {
      tarBytes = ungzip(new Uint8Array(ab));
    } catch {
      tarBytes = new Uint8Array(ab);
    }

    // Parse tar with js-untar
    const files = await untar(tarBytes.buffer);

    // Extract all files
    for (const file of files as any[]) {
      const full: string = file.name as string;
      if (!full) continue;
      const rel = full.split("/").slice(1).join("/");
      if (!rel || rel.endsWith("/")) continue; // skip root and directories

      // Ensure parent dirs
      const parent = rel.split("/").slice(0, -1).join("/");
      if (parent) {
        let cur = this.workDir;
        for (const seg of parent.split("/")) {
          cur += `/${seg}`;
          try {
            await ifs.promises.mkdir(cur);
          } catch {}
        }
      }

      const dataBuf: Uint8Array = file.buffer as Uint8Array;
      await ifs.promises.writeFile(`${this.workDir}/${rel}`, dataBuf);
    }

    // Initialize git repo and set origin
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

  async search(
    query: string,
  ): Promise<{ file: string; line: number; content: string }[]> {
    const results: { file: string; line: number; content: string }[] = [];
    const files = await this.listFiles();
    for (const file of files) {
      try {
        const content = await this.readFile(file);
        const lines = content.split("\n");
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            results.push({ file, line: index + 1, content: line.trim() });
          }
        });
      } catch {
        // Skip binary files or errors
      }
    }
    return results;
  }

  async status() {
    return status({ fs: ifs, dir: this.workDir });
  }

  async currentBranch() {
    const branches = await branch({ fs: ifs, dir: this.workDir });
    return branches.current || "main";
  }

  async add(filepath: string) {
    await add({ fs: ifs, dir: this.workDir, filepath });
  }

  async reset(filepath: string) {
    await reset({ fs: ifs, dir: this.workDir, filepath });
  }
}
