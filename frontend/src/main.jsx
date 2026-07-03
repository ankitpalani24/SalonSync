import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)

// Register Progressive Web App (PWA) Service Worker for home-screen installation
if ('serviceWorker' in navigator) {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Unregister active service workers in local development to clear HMR/caching issues
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('Unregistered active service worker for local development.');
            window.location.reload();
          }
        });
      }
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('PWA Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.error('PWA Service Worker registration failed:', err);
        });
    });
  }
}


