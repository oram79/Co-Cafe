import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'

// Apply saved theme before first paint to avoid flash
try {
  const t = localStorage.getItem('cc_theme')
  if (t) document.documentElement.setAttribute('data-theme', t)
} catch {}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)