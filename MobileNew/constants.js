import { Platform } from 'react-native';
import { getPlatformBackendUrl, isPhysicalDevice } from './utils/BackendConfig';

// Backend URL configuration - using the actual local network IP address
const backendUrl = "http://10.16.135.0:4000";

// Log the backend URL we're using
console.log('env: export EXPO_PUBLIC_BACKEND_URL');
console.log('Using backend URL:', backendUrl);

export { backendUrl };

// Currency symbol used throughout the app
export const currency = '$';

// Sample token for offline mode
export const DEMO_TOKEN = 'demo-token-offline-mode';

// Timeout settings for API requests - more generous for real-world networks
export const API_TIMEOUT = 60000; // Increased to 60 seconds for slower network connections 