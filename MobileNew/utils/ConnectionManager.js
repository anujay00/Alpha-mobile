import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { backendUrl } from '../constants';

// Key for storing the working backend URL
const WORKING_URL_KEY = 'WORKING_BACKEND_URL';

/**
 * Save a successful backend URL for future use
 * @param {string} url - The working backend URL
 */
export const saveWorkingBackendUrl = async (url) => {
  try {
    if (!url) return;
    console.log(`Saving working backend URL: ${url}`);
    await AsyncStorage.setItem(WORKING_URL_KEY, url);
  } catch (error) {
    console.error('Error saving working backend URL:', error);
  }
};

/**
 * Get the previously saved working backend URL
 * @returns {Promise<string|null>} The saved URL or null if none
 */
export const getWorkingBackendUrl = async () => {
  try {
    const savedUrl = await AsyncStorage.getItem(WORKING_URL_KEY);
    if (savedUrl) {
      console.log(`Using previously saved backend URL: ${savedUrl}`);
      return savedUrl;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving working backend URL:', error);
    return null;
  }
};

/**
 * Get a list of backend URLs to try in order of preference
 * @returns {Array<string>} Array of URLs to try
 */
export const getBackendUrlsToTry = async () => {
  // First try the saved working URL if available
  const savedUrl = await getWorkingBackendUrl();
  
  // Start with the default URLs
  let urls = [
    "http://10.16.135.0:4000",
    backendUrl
  ];
  
  // Add saved URL at the beginning if it exists and isn't already included
  if (savedUrl && !urls.includes(savedUrl)) {
    urls.unshift(savedUrl);
  }
  
  // Add other potential URLs
  const additionalUrls = [
    "http://10.16.135.0:4000",
    "http://localhost:4000"
  ];
  
  // Add additional URLs only if they're not already in the list
  additionalUrls.forEach(url => {
    if (!urls.includes(url)) {
      urls.push(url);
    }
  });
  
  return urls;
};

/**
 * Gets the API base URL, automatically tries all possibilities if needed
 * @returns {Promise<string>} The working backend URL
 */
export const getApiBaseUrl = async () => {
  // Default to the known working URL
  return "http://10.16.135.0:4000";
}; 