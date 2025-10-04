import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Resolve dev proxy target robustly:
  // 1) VITE_DEV_API_TARGET if provided (no trailing /api)
  // 2) Else derive from VITE_API_BASE_URL by stripping trailing /api
  // 3) Else default to deployed backend to avoid localhost dependency
  const derivedFromApiBase = env.VITE_API_BASE_URL
    ? env.VITE_API_BASE_URL.replace(/\/?api\/?$/, '')
    : ''
  const devTarget = (env.VITE_DEV_API_TARGET || derivedFromApiBase || 'https://capstonedelibup-o7sl.onrender.com')
  const isHttps = devTarget.startsWith('https://')
  // Helpful log to confirm target during dev
  // eslint-disable-next-line no-console
  console.log(`[vite] Proxy target => ${devTarget}`)

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
          // Disable TLS verification to avoid local dev cert issues when targeting https
          secure: false,
        },
        '/health': {
          target: devTarget,
          changeOrigin: true,
          // Disable TLS verification to avoid local dev cert issues when targeting https
          secure: false,
        },
      },
    },
  }
})
