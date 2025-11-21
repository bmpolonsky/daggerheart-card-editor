import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
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
      "/font": {
        target: "https://daggerheart.su",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
