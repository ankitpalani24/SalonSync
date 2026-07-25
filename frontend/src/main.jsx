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

// ──────────────────────────────────────────────────────────────
// PWA Service Worker Registration with Auto-Update Detection
// ──────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Unregister active service workers in local development to clear HMR/caching issues
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('Unregistered active service worker for local development.');
          }
        });
      }
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('PWA Service Worker registered with scope:', registration.scope);

          // ── AUTO-UPDATE DETECTION ──
          // Check for updates every 60 seconds
          setInterval(() => {
            registration.update();
          }, 60 * 1000);

          // Listen for a new service worker being installed
          registration.onupdatefound = () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.onstatechange = () => {
              // New SW is installed & waiting, and an older SW is already controlling the page
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateBanner(registration);
              }
            };
          };
        })
        .catch((err) => {
          console.error('PWA Service Worker registration failed:', err);
        });

      // Reload the page when the new service worker takes over
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }
}

/**
 * Shows a non-intrusive update banner at the bottom of the screen.
 * Tapping "Update Now" tells the waiting service worker to activate,
 * which triggers `controllerchange` → automatic page reload.
 */
function showUpdateBanner(registration) {
  // Prevent duplicate banners
  if (document.getElementById('pwa-update-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-update-banner';
  banner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99999;
      background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
      color: #ffffff;
      padding: 14px 24px;
      border-radius: 12px;
      border: 1px solid rgba(112, 130, 56, 0.4);
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      gap: 16px;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.85rem;
      max-width: 420px;
      width: calc(100vw - 48px);
      animation: slideUp 0.4s ease-out;
    ">
      <span style="flex: 1;">🚀 A new version of SalonSync is available!</span>
      <button id="pwa-update-btn" style="
        background: #708238;
        color: #fff;
        border: none;
        padding: 8px 18px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.8rem;
        cursor: pointer;
        white-space: nowrap;
        font-family: inherit;
      ">Update Now</button>
      <button id="pwa-dismiss-btn" style="
        background: none;
        border: none;
        color: #888;
        font-size: 1.1rem;
        cursor: pointer;
        padding: 4px;
        line-height: 1;
      ">✕</button>
    </div>
  `;

  // Inject slideUp animation if not already present
  if (!document.getElementById('pwa-update-styles')) {
    const style = document.createElement('style');
    style.id = 'pwa-update-styles';
    style.textContent = `
      @keyframes slideUp {
        from { transform: translateX(-50%) translateY(100px); opacity: 0; }
        to   { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(banner);

  // "Update Now" — tell the waiting SW to skip waiting and take over
  document.getElementById('pwa-update-btn').addEventListener('click', () => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    banner.remove();
  });

  // Dismiss banner
  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    banner.remove();
  });
}
