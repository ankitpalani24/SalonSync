import { Platform } from 'react-native';

// Priority: EXPO_PUBLIC_API_URL -> Production Live API -> Localhost Fallback
const DEFAULT_PROD_API = 'https://salonsync-api.onrender.com/api';
const DEFAULT_LOCAL_API = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_PROD_API;

export const APP_NAME = 'SalonSync';
export const APP_VERSION = '1.0.0';
