import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: "jsx",
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
        target: 'https://capstonedelibup.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/health': {
        target: 'https://capstonedelibup.onrender.com',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})
