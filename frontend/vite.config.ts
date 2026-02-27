import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const usePolling = env.CHOKIDAR_USEPOLLING === "true";

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      watch: {
        usePolling,
        interval: 200,
      },
      proxy: {
        "/api": "http://localhost:8080",
      },
    },
  };
});
