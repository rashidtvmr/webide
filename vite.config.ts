import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    viteReact(),
    tailwindcss(),
    {
      name: "gh-archive-proxy",
      configureServer(server) {
        // Preflight for CORS
        server.middlewares.use((req, res, next) => {
          if (
            req.method === "OPTIONS" && req.url &&
            req.url.startsWith("/__gh-archive/")
          ) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
            res.setHeader(
              "Access-Control-Allow-Headers",
              "Authorization, Content-Type, X-Requested-With",
            );
            res.statusCode = 204;
            res.end();
            return;
          }
          next();
        });

        server.middlewares.use("/__gh-archive/tarball", async (req, res) => {
          try {
            const url = new URL(req.url || "", "http://localhost");
            const owner = url.searchParams.get("owner");
            const repo = url.searchParams.get("repo");
            const ref = url.searchParams.get("ref") || "main";
            const token = url.searchParams.get("token") || "";
            if (!owner || !repo) {
              res.statusCode = 400;
              res.end("Missing owner or repo");
              return;
            }
            const ghUrl =
              `https://api.github.com/repos/${owner}/${repo}/tarball/${
                encodeURIComponent(ref)
              }`;
            const headers: Record<string, string> = {
              "User-Agent": "myeditor-dev-proxy",
              Accept: "application/octet-stream",
              "X-GitHub-Api-Version": "2022-11-28",
            };
            if (token) headers.Authorization = `Bearer ${token}`;
            const ghRes = await fetch(ghUrl, {
              headers,
              redirect: "follow" as RequestRedirect,
            });
            if (!ghRes.ok || !ghRes.body) {
              res.statusCode = ghRes.status;
              res.end(`GitHub error: ${ghRes.status}`);
              return;
            }
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Expose-Headers", "*");
            res.setHeader(
              "Content-Type",
              ghRes.headers.get("content-type") || "application/octet-stream",
            );
            res.setHeader(
              "Content-Disposition",
              ghRes.headers.get("content-disposition") || "",
            );
            // Stream body
            const reader = (ghRes.body as any).getReader?.();
            if (reader) {
              res.statusCode = 200;
              const pump = async () => {
                const { done, value } = await reader.read();
                if (done) {
                  res.end();
                  return;
                }
                res.write(Buffer.from(value));
                pump();
              };
              pump();
            } else {
              const buf = Buffer.from(await ghRes.arrayBuffer());
              res.statusCode = 200;
              res.end(buf);
            }
          } catch (e: any) {
            res.statusCode = 500;
            res.end("Proxy error: " + (e?.message || String(e)));
          }
        });
        server.middlewares.use("/__gh-archive/zipball", async (req, res) => {
          try {
            const url = new URL(req.url || "", "http://localhost");
            const owner = url.searchParams.get("owner");
            const repo = url.searchParams.get("repo");
            const ref = url.searchParams.get("ref") || "main";
            const token = url.searchParams.get("token") || "";
            if (!owner || !repo) {
              res.statusCode = 400;
              res.end("Missing owner or repo");
              return;
            }
            const ghUrl =
              `https://api.github.com/repos/${owner}/${repo}/zipball/${
                encodeURIComponent(ref)
              }`;
            const headers: Record<string, string> = {
              "User-Agent": "myeditor-dev-proxy",
              Accept: "application/octet-stream",
              "X-GitHub-Api-Version": "2022-11-28",
            };
            if (token) headers.Authorization = `Bearer ${token}`;
            const ghRes = await fetch(ghUrl, {
              headers,
              redirect: "follow" as RequestRedirect,
            });
            if (!ghRes.ok || !ghRes.body) {
              res.statusCode = ghRes.status;
              res.end(`GitHub error: ${ghRes.status}`);
              return;
            }
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Expose-Headers", "*");
            res.setHeader(
              "Content-Type",
              ghRes.headers.get("content-type") || "application/zip",
            );
            res.setHeader(
              "Content-Disposition",
              ghRes.headers.get("content-disposition") || "",
            );
            const reader = (ghRes.body as any).getReader?.();
            if (reader) {
              res.statusCode = 200;
              const pump = async () => {
                const { done, value } = await reader.read();
                if (done) {
                  res.end();
                  return;
                }
                res.write(Buffer.from(value));
                pump();
              };
              pump();
            } else {
              const buf = Buffer.from(await ghRes.arrayBuffer());
              res.statusCode = 200;
              res.end(buf);
            }
          } catch (e: any) {
            res.statusCode = 500;
            res.end("Proxy error: " + (e?.message || String(e)));
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
  },
});
