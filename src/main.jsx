import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// Self-hosted fonts — these ship with the build so typography survives offline.
// Latin subsets only; the site is English-only.
import '@fontsource/syne/latin-700.css'
import '@fontsource/syne/latin-800.css'
import '@fontsource-variable/dm-sans/wght.css'

import App from './App.jsx'
import { setupServiceWorker } from './offline/registerSW.js'
import './index.css'

setupServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
