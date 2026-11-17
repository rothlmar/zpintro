import { defineConfig } from "vite";

// The site is served from https://<user>.github.io/zpintro/, so every asset
// URL needs the repository name as a prefix. The dev server uses it too,
// which keeps local and deployed behaviour identical.
export default defineConfig({
  base: "/zpintro/",
});
