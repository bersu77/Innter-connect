import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyInitialTheme } from './lib/theme'

// Set the light/dark theme before the first paint to avoid a flash.
applyInitialTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
