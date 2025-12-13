import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true, // 포트가 사용 중이면 에러 발생 (다른 포트로 자동 변경 방지)
    hmr: false, // HMR 비활성화하여 WebSocket 에러 방지
  },
})