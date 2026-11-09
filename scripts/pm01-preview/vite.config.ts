import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { localHomePlugin } from "./local-home-plugin";

// Separate read-only harness. No server functions, credentials or production data.
export default defineConfig({
  plugins: [localHomePlugin(), react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("../../src", import.meta.url)) } },
  server: {
    host: "127.0.0.1",
    port: 5187,
    strictPort: true,
    open: false,
    fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/.mobi-local-preview/**"] },
  },
});
