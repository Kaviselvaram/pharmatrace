import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dedicated non-conflicting frontend port 5174
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://127.0.0.1:8001",
        ws: true,
      },
    },
  },
});
