import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifestJson from "./src/manifest.json";

export default defineConfig(({ mode }) => {
  // Clone the manifest to avoid mutating the original
  const manifest = JSON.parse(JSON.stringify(manifestJson));

  // In development mode, add localhost to externally_connectable
  if (mode === "development") {
    if (!manifest.externally_connectable.matches.includes("http://localhost:3000/*")) {
      manifest.externally_connectable.matches.push("http://localhost:3000/*");
    }
    console.log(
      "[Tavlo Extension] Development mode: Added localhost to externally_connectable"
    );
  }

  return {
    plugins: [react(), crx({ manifest })],
    build: {
      rollupOptions: {
        input: {
          popup: "src/popup/index.html",
        },
      },
    },
  };
});
