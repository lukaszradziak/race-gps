/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dsv from "@rollup/plugin-dsv";

export default defineConfig({
  plugins: [react(), dsv()],
  test: {
    environment: "happy-dom",
    coverage: {
      provider: "istanbul",
    },
  },
});
