import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const isDev = process.env.VITE_DEV_SERVER === "true";

export default defineConfig({
  base: isDev ? "/" : "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
