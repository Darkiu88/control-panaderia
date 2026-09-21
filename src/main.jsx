import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// Arranca el Service Worker para las actualizaciones automáticas
const updateSW = registerSW({
  onOfflineReady() {
    console.log("¡La app ya está lista para usarse sin internet en las localidades!")
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)