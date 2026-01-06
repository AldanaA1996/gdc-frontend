// vite.config.ts
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  server: {
    host: true,
    strictPort: true,
    hmr: {
      host: 'c82f00e11cd3.ngrok-free.app'
    },
    allowedHosts: ['c82f00e11cd3.ngrok-free.app']
  },
  resolve: {
    alias: {
      "@": "/src",
      "~": "/"
    }
  }
});
