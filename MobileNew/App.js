import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';
import { Platform, Alert, Dimensions } from 'react-native';
import axios from 'axios';

// Import constants
import { backendUrl, DEMO_TOKEN, API_TIMEOUT } from './constants';
import { checkNetworkConnectivity, isBackendReachable } from './utils/NetworkHelper';
import { getPhysicalDeviceUrls, isPhysicalDevice } from './utils/BackendConfig';
import { saveWorkingBackendUrl, getBackendUrlsToTry, getApiBaseUrl } from './utils/ConnectionManager';
import { useDimensionsListener } from './utils/ResponsiveUtils';

// Import screens
import LoginScreen from './screens/LoginScreen';
import MainNavigator from './navigation/MainNavigator';

// Constants imported from constants.js instead of defining here
// No need to define backendUrl and currency here anymore

const Stack = createStackNavigator();

// Global variable to store the working backend URL
let workingBackendUrl = null;

export default function App() {
  const [token, setToken] = useState('');
  const [backendConnected, setBackendConnected] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });
  
  // Listen for dimension changes (e.g. device rotation)
  useEffect(() => {
    const dimensionsHandler = ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    };
    
    const subscription = Dimensions.addEventListener('change', dimensionsHandler);
    
    // Cleanup
    return () => {
      subscription?.remove();
    };
  }, []);

  // Function to check backend connectivity
  const checkBackendConnection = async () => {
    try {
      console.log('Checking backend connectivity...');
      
      // First check if network is available
      const isNetworkConnected = await checkNetworkConnectivity();
      if (!isNetworkConnected) {
        console.log('No network connectivity detected');
        setBackendConnected(false);
        // Set app to use sample data when offline
        setToken(DEMO_TOKEN);
        return false;
      }
      
      // Common IPs to try if the main one fails
      const fallbackIps = [
        '10.0.2.2',      // Android emulator -> host loopback
        '192.168.137.1', // Local network IP from diagnostic
        '192.168.1.2',   // Another local network IP
        '127.0.0.1',     // Local loopback
        '192.168.0.1',   // Another common router pattern
        '192.168.43.1',  // Common Android hotspot address
      ];
      
      // First try with the configured backend URL
      let isReachable = await isBackendReachable(backendUrl, API_TIMEOUT);
      
      // If not reachable, try with alternative IPs
      if (!isReachable) {
        console.log('Backend not reachable at primary URL, trying fallbacks...');
        
        // Try each alternative IP
        for (const ip of fallbackIps) {
          const alternativeUrl = `http://${ip}:4000`;
          console.log('Trying alternative backend URL:', alternativeUrl);
          
          isReachable = await isBackendReachable(alternativeUrl, API_TIMEOUT);
          if (isReachable) {
            console.log('Connected to alternative backend URL:', alternativeUrl);
            // If successful, could save this for future use
            break;
          }
        }
      }
      
      if (!isReachable) {
        console.log('Backend not reachable at any URL');
        setBackendConnected(false);
        // Set app to use sample data
        setToken(DEMO_TOKEN);
        return false;
      }
      
      // If reachable, try a full API call
      const response = await axios.get(`${backendUrl}`, { 
        timeout: API_TIMEOUT,
        // Avoid caching issues
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      console.log('Backend connectivity response:', response.data);
      setBackendConnected(true);
      return true;
    } catch (error) {
      console.error('Backend connection error:', error.message);
      
      // Set backend connected to false but allow app to function with sample data
      setBackendConnected(false);
      
      // Log additional details to help diagnose the issue
      if (error.code === 'ECONNABORTED') {
        console.log('Connection timed out - backend server may be slow or not running');
      } else if (error.code === 'ENOTFOUND') {
        console.log('Host not found - check your backend URL');
      } else if (error.message && error.message.includes('Network Error')) {
        console.log('Network error - check that your device and backend are on the same network');
      }
      
      return false;
    }
  };
  
  // Function to validate stored token
  const validateToken = async (storedToken) => {
    if (!storedToken || !backendConnected) {
      return false;
    }
    
    try {
      console.log('Validating token...');
      
      // Check if token is the offline demo token
      if (storedToken === DEMO_TOKEN) {
        console.log('Using offline demo token');
        return true;
      }
      
      // For admin tokens, try with the admin auth endpoint that checks token validity
      const adminCheckResponse = await axios.get(
        `${backendUrl}/api/product/list`,
        { headers: { token: storedToken }, timeout: API_TIMEOUT }
      );
      
      console.log('Admin token validation response:', adminCheckResponse.data);
      
      if (adminCheckResponse.data.success) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };
  
  // Load saved token and check backend connectivity on app start  
  useEffect(() => {
    // Get and validate token from AsyncStorage
    const getToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
          console.log('Retrieved stored token');
          // Validate if the token is still valid
          const isValid = await validateToken(storedToken);
          if (isValid) {
            setToken(storedToken);
          } else {
            console.log('Stored token is no longer valid, removing');
            await AsyncStorage.removeItem('userToken');
          }
        } else {
          console.log('No stored token found');
        }
      } catch (error) {
        console.error('Error retrieving token:', error);
      } finally {
        setValidatingToken(false);
      }
    };
    
    const saveToken = async () => {
      try {
        if (token) {
          await AsyncStorage.setItem('userToken', token);
          console.log('Token saved to storage');
        }
      } catch (error) {
        console.error('Error saving token:', error);
      }
    };
    
    // Check for backend connectivity first, then try to get the token
    const init = async () => {
      await checkBackendConnection();
      await getToken();
    };
    
    init();
    
    // Save token when it changes (but not on initial load)
    if (token !== '') {
      saveToken();
    }
  }, [token]);
  
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" backgroundColor="#fff" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {token ? (
            <Stack.Screen name="Main">
              {props => <MainNavigator {...props} token={token} setToken={setToken} backendConnected={backendConnected} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="Login">
              {props => <LoginScreen {...props} setToken={setToken} backendConnected={backendConnected} isValidating={validatingToken} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
        <Toast />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
