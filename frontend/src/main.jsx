import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { warmup } from './api'

// Ensure requestIdleCallback is available (Android WebView fallback)
if (typeof window !== 'undefined' && !('requestIdleCallback' in window)) {
  window.requestIdleCallback = (cb) => {
    const start = Date.now();
    return setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
      })
    }, 1)
  }
}

// Trigger backend warmup as early as possible, non-blocking and error-tolerant
try {
  const schedule = (typeof window !== 'undefined' && window.requestIdleCallback)
    ? window.requestIdleCallback
    : (fn) => setTimeout(fn, 0)
  schedule(() => {
    warmup()
  })
} catch (_) { /* ignore */ }

const root = document.getElementById('root')
const app = (
  import.meta.env.DEV
    ? <StrictMode><App /></StrictMode>
    : <App />
)

createRoot(root).render(app)
