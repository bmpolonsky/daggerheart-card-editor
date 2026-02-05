import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = fileURLToPath(new URL(".", import.meta.url));
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const inferredBase =
  repoName && repoName.endsWith(".github.io") ? "/" : repoName ? `/${repoName}/` : "/";
const base = process.env.VITE_BASE_PATH ?? inferredBase;

export default defineConfig({
  base,
  plugins: [preact()],
  resolve: {
    alias: {
      "@": resolve(workspaceRoot, "src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "https://daggerheart.su",
        changeOrigin: true,
        secure: true,
      },
      "/cards.css": {
        target: "https://daggerheart.su",
        changeOrigin: true,
        secure: true,
      },
      "/styles.css": {
        target: "https://daggerheart.su",
        changeOrigin: true,
        secure: true,
      },
      "/font": {
        target: "https://daggerheart.su",
        changeOrigin: true,
        secure: true,
      },
      "/image": {
        target: "https://daggerheart.su",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
