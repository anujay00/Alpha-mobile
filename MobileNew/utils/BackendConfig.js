import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Get the right backend URL based on the current platform
 * This is needed because app.config.js can't use Platform.select
 */
export const getPlatformBackendUrl = () => {
  try {
    // First try to get it from the app config
    const configUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;
    if (configUrl && typeof configUrl === 'string') {
      console.log('Using backend URL from config:', configUrl);
      return configUrl;
    }
    
    // If not in config, use platform-specific defaults
    if (Platform.OS === 'android') {
      // For Android emulator, use 10.0.2.2 (special IP to reach host's localhost)
      return 'http://10.0.2.2:4000';
    } else if (Platform.OS === 'ios') {
      // For iOS simulator, localhost works fine
      return 'http://127.0.0.1:4000';
    } else {
      // For web or anything else
      return 'http://localhost:4000';
    }
  } catch (error) {
    console.error('Error determining backend URL:', error);
    // Safe fallback based on platform
    return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://127.0.0.1:4000';
  }
};

/**
 * Get URLs to try for physical devices (not emulators/simulators)
 */
export const getPhysicalDeviceUrls = () => {
  // Common IPs for physical device connections
  return [
    'http://192.168.137.1:4000', // From network diagnostic
    'http://192.168.1.2:4000',   // Common local network
    'http://192.168.1.3:4000',   // Another common pattern
    'http://192.168.0.1:4000',   // Another router pattern
    'http://10.0.2.2:4000',      // Android emulator fallback
  ];
};

/**
 * Check if running on a real physical device (not emulator/simulator)
 */
export const isPhysicalDevice = () => {
  if (Platform.OS === 'android') {
    // On Android, check if Brand exists and isn't 'google' (emulator)
    const brand = Platform.constants?.Brand?.toLowerCase();
    console.log('Android brand:', brand);
    return !!brand && brand !== 'google';
  } else if (Platform.OS === 'ios') {
    // On iOS, Constants.isDevice is TRUE for physical devices
    // and FALSE for simulators
    console.log('iOS isDevice:', Constants.isDevice);
    return Constants.isDevice; 
  }
  return false; // Default for web/other platforms
}; 