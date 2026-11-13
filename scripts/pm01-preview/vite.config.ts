import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { localHomePlugin } from "./local-home-plugin";
import type { Plugin } from "vite";

function demoProductsPlugin(): Plugin {
  const demoModule = fileURLToPath(new URL("./demo-products.functions.ts", import.meta.url));
  return {
    name: "mobi-preview-product-functions",
    enforce: "pre",
    resolveId(id) {
      return id.replaceAll("\\", "/").includes("products.functions") ? demoModule : null;
    },
  };
}

// Isolated demo harness. Product data and revision writes stay in the local demo store.
export default defineConfig({
  plugins: [
    localHomePlugin(process.env.MOBI_PREVIEW_DATA_DIR),
    demoProductsPlugin(),
    react(),
    tailwindcss(),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("../../src", import.meta.url)) } },
  server: {
    host: "127.0.0.1",
    port: 5187,
    strictPort: true,
    open: false,
    watch: { ignored: ["**/.output/**", "**/artifacts/**", "**/.mobi-local-preview/**"] },
    fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/.mobi-local-preview/**"] },
  },
});
