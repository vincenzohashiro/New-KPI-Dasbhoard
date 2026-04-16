import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Vercel sets VERCEL=1 automatically during build.
// GitHub Actions sets GITHUB_PAGES=true via the workflow.
const base = process.env.VERCEL ? "/" : "/New-KPI-Dasbhoard/";

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
