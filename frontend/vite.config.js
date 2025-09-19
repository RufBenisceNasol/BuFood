import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Allow overriding dev proxy target: e.g., https://capstonedelibup-o7sl.onrender.com or http://localhost:8000
  const devTarget = env.VITE_DEV_API_TARGET || 'http://localhost:8000'
  const isHttps = devTarget.startsWith('https://')

  return {
    plugins: [react()],
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      proxy: {
        '/api': {
          target: devTarget,
          changeOrigin: true,
          secure: isHttps,
        },
        '/health': {
          target: devTarget,
          changeOrigin: true,
          secure: isHttps,
        },
      },
    },
  }
})
