/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  // Doit correspondre au nom du repo GitHub Pages (docs/ARCHITECTURE.md §6).
  // Isolé ici : le reste du code applicatif ne doit jamais dépendre de ce chemin.
  base: "/ultimate-playbook/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
  },
});
