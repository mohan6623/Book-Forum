import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    // Bind to 0.0.0.0 to avoid IPv6 issues
    host: 'localhost',
    port: 5173,
    strictPort: false, // Try next available port if 5173 is in use
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
