import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiBaseUrl } from './ConnectionManager';
import { API_TIMEOUT } from '../constants';

/**
 * Custom hook to get an Axios API client instance with the working backend URL
 * @param {Object} options - Configuration options
 * @param {String} options.token - Authentication token (optional)
 * @returns {Object} The Axios client and loading state
 */
export const useApiClient = (options = {}) => {
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = options;

  useEffect(() => {
    const initializeClient = async () => {
      try {
        setIsLoading(true);
        // Get the working backend URL
        const baseUrl = await getApiBaseUrl();
        
        // Create a client with this URL
        const axiosClient = axios.create({
          baseURL: baseUrl,
          timeout: API_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            ...(token ? { token } : {})
          }
        });

        // Add response interceptor
        axiosClient.interceptors.response.use(
          response => response,
          error => {
            // Log network errors with the URL being accessed
            if (error.message === 'Network Error') {
              console.log(`Network error accessing: ${baseUrl}`);
            }
            return Promise.reject(error);
          }
        );

        setClient(axiosClient);
      } catch (error) {
        console.error('Error initializing API client:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeClient();
  }, [token]);

  return { client, isLoading };
};

/**
 * Create an API client with the working backend URL without using a hook
 * @param {Object} options - Configuration options
 * @param {String} options.token - Authentication token (optional)
 * @returns {Promise<Object>} The Axios client
 */
export const createApiClient = async (options = {}) => {
  const { token } = options;
  
  // Get the working backend URL - use the actual local network IP
  const baseUrl = "http://192.168.1.6:4000";
  
  // Create a client with this URL
  const axiosClient = axios.create({
    baseURL: baseUrl,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...(token ? { token } : {})
    }
  });

  return axiosClient;
};

export default useApiClient; 