import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

/**
 * Get the current Expo server IP address
 * @returns {string} The IP address of the Expo server
 */
export const getExpoServerIp = () => {
  try {
    // Special case for Android emulator - always use 10.0.2.2 to reach host
    if (Platform.OS === 'android' && !Platform.constants.Brand) {
      console.log('Android emulator detected, using 10.0.2.2 to reach host');
      return '10.0.2.2';
    }
    
    // Try to get the manifest IP
    const manifest = Constants.manifest;
    
    if (manifest && manifest.debuggerHost) {
      const hostIp = manifest.debuggerHost.split(':')[0];
      console.log('Using Expo manifest debuggerHost IP:', hostIp);
      return hostIp;
    }
    
    // For Expo SDK 46+
    if (Constants.expoConfig && Constants.expoConfig.hostUri) {
      const hostIp = Constants.expoConfig.hostUri.split(':')[0];
      console.log('Using Expo config host IP:', hostIp);
      return hostIp;
    }
    
    // Platform-specific fallbacks
    if (Platform.OS === 'android') {
      console.log('Using Android-specific fallback IP');
      return '10.0.2.2'; // Special IP for Android emulator to reach host
    } else {
      console.log('Using iOS/web fallback IP');
      return '127.0.0.1'; // For iOS simulators and web
    }
  } catch (error) {
    console.error('Error getting Expo server IP:', error);
    // Platform-specific fallback in case of error
    return Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
  }
};

/**
 * Get the current backend URL based on the Expo server IP
 * @param {number} port The port number for the backend
 * @returns {string} The full backend URL
 */
export const getBackendUrl = (port = 4000) => {
  try {
    // Try to use URL from app config first
    const appConfig = Constants.expoConfig || Constants.manifest;
    
    if (appConfig?.extra?.EXPO_PUBLIC_BACKEND_URL) {
      const configUrl = appConfig.extra.EXPO_PUBLIC_BACKEND_URL;
      // Make sure configUrl is a string, not an object
      const urlString = typeof configUrl === 'object' ? 
                        (configUrl.toString ? configUrl.toString() : 
                        (Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://127.0.0.1:4000')) :
                        configUrl;
      console.log('Using backend URL from app config:', urlString);
      return urlString;
    }
    
    // Get custom port from config if available
    if (appConfig?.extra?.BACKEND_PORT) {
      port = appConfig.extra.BACKEND_PORT;
    }
    
    // Check if we're in a production environment
    const isProduction = appConfig?.extra?.ENV === 'production';
    if (isProduction) {
      console.log('Using production backend URL');
      return 'https://mooori-backend.vercel.app';
    }
    
    // Fallback to automatic IP detection for development
    const ip = getExpoServerIp();
    const url = `http://${ip}:${port}`;
    console.log('Using dynamically detected backend URL:', url);
    return url;
  } catch (error) {
    console.error('Error determining backend URL:', error);
    // Default fallback based on platform
    return Platform.OS === 'android' ? 
      `http://10.0.2.2:${port}` : 
      `http://127.0.0.1:${port}`;
  }
};

/**
 * Check network connectivity
 * @returns {Promise<boolean>} Whether internet is reachable
 */
export const checkNetworkConnectivity = async () => {
  try {
    const netInfo = await NetInfo.fetch();
    console.log('Network info:', netInfo);
    return netInfo.isConnected && netInfo.isInternetReachable;
  } catch (error) {
    console.error('Error checking network connectivity:', error);
    return false;
  }
};

/**
 * Check if the backend server is reachable
 * @param {string} url The URL to check
 * @param {number} timeout Timeout in milliseconds
 * @returns {Promise<boolean>} Whether the backend is reachable
 */
export const isBackendReachable = async (url, timeout = 5000) => {
  try {
    // First check network connectivity
    const isConnected = await checkNetworkConnectivity();
    if (!isConnected) {
      console.log('No network connectivity detected');
      return false;
    }
    
    // Ensure URL is a valid string
    const validUrl = typeof url === 'object' ? 'http://192.168.1.3:4000' : 
                    (url || 'http://192.168.1.3:4000');
    
    console.log('Attempting to reach backend at:', validUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Try multiple endpoints in sequence to check connectivity
    const endpoints = [
      '/api/health',  // Specific health check endpoint
      '/',            // Root endpoint (fallback)
      '/api/user'     // Another API endpoint as second fallback
    ];
    
    // Try each endpoint until one succeeds
    for (const endpoint of endpoints) {
      try {
        const fetchUrl = endpoint.startsWith('http') ? endpoint : `${validUrl}${endpoint}`;
        console.log('Trying endpoint:', fetchUrl);
        
        const response = await fetch(fetchUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok) {
          clearTimeout(timeoutId);
          console.log('Backend check success at', endpoint, 'status:', response.status);
          return true;
        }
      } catch (endpointError) {
        console.log(`Failed to reach endpoint ${endpoint}:`, endpointError.message);
        // Continue to the next endpoint
      }
    }
    
    // If we reach here, all endpoints failed
    clearTimeout(timeoutId);
    console.log('Backend not reachable at any endpoint');
    return false;
  } catch (error) {
    console.log('Backend check error:', error.message);
    return false;
  }
}; 