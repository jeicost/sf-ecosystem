import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = env.VITE_API_BASE || 'http://localhost:8000/api'
  // Derivar el origen del backend desde VITE_API_BASE
  const backendOrigin = apiBase.replace(/\/[^/]+$/, '') // quitar el path (/api o /cms)

  return {
    plugins: [react()],
    base: '/editor/',
    server: {
      port: 5174,
      proxy: {
        // Proxiar /api y /design hacia el backend activo (FastAPI o Mock)
        '/api':    { target: backendOrigin, changeOrigin: true },
        '/design': { target: backendOrigin, changeOrigin: true },
        '/static': { target: backendOrigin, changeOrigin: true },
        '/exports':{ target: backendOrigin, changeOrigin: true },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  }
})
