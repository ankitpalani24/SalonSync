const getApiUrl = () => {
  // If explicitly configured via Vite env and not a placeholder, use it
  if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes("YOUR-RENDER-URL")) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Dynamic fallback based on current host
  const hostname = window.location.hostname;
  
  // Check if current hostname is localhost or a local network IP / domain
  const isLocal = 
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.') ||
    hostname.endsWith('.local');
    
  if (isLocal) {
    return `http://${hostname}:5000/api`;
  }
  
  // Production backend fallback (Render)
  return 'https://salonsync-api.onrender.com/api';
};

export const API_URL = getApiUrl();