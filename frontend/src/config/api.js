const getApiUrl = () => {
  // If explicitly configured via Vite env, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Dynamic fallback based on current host
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // Production backend fallback (Render)
  return 'https://salonsync-api.onrender.com/api';
};

export const API_URL = getApiUrl();