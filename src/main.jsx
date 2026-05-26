import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

/**
 * WHY HashRouter instead of BrowserRouter?
 * ─────────────────────────────────────────
 * GitHub Pages serves static files. When a user navigates to:
 *   https://yourname.github.io/my-platform/cloud-monitor
 *
 * ...and then REFRESHES, GitHub Pages looks for a physical file at
 * /cloud-monitor/index.html — which doesn't exist — and returns 404.
 *
 * HashRouter uses the URL hash (#) to store the path:
 *   https://yourname.github.io/my-platform/#/cloud-monitor
 *
 * The browser never sends the hash to the server, so GitHub Pages
 * always serves index.html, and React Router handles the rest.
 *
 * BrowserRouter CAN work on GitHub Pages with a 404.html redirect
 * hack, but HashRouter is simpler and more reliable for static hosts.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
