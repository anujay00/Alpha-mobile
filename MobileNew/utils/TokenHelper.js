/**
 * Helper utility for debugging token-related issues
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import axios from 'axios';
import { backendUrl } from '../constants';

/**
 * Check if the token is valid by making a test request to the backend
 * @param {string} token The JWT token to validate
 * @returns {Promise<boolean>} Whether the token is valid
 */
export const validateToken = async (token) => {
  if (!token) return false;
  
  try {
    const response = await axios.get(`${backendUrl}/api/user/profile`, {
      headers: { token }
    });
    
    return response.data.success === true;
  } catch (error) {
    console.log('Token validation error:', error);
    return false;
  }
};

/**
 * Display the current token for debugging purposes
 */
export const showToken = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    
    if (token) {
      const isValid = await validateToken(token);
      
      Alert.alert(
        'Token Information',
        `Token exists and is ${isValid ? 'valid' : 'invalid'}\n\nToken: ${token.substring(0, 20)}...`,
        [
          { text: 'OK' }
        ]
      );
    } else {
      Alert.alert(
        'Token Information',
        'No token found. Please log in again.',
        [
          { text: 'OK' }
        ]
      );
    }
  } catch (error) {
    console.error('Error retrieving token:', error);
    
    Alert.alert(
      'Token Error',
      'Could not retrieve token information.',
      [
        { text: 'OK' }
      ]
    );
  }
};

/**
 * Clear the stored token (for logout or troubleshooting)
 */
export const clearToken = async () => {
  try {
    await AsyncStorage.removeItem('userToken');
    
    Alert.alert(
      'Token Cleared',
      'The authentication token has been removed.',
      [
        { text: 'OK' }
      ]
    );
    
    return true;
  } catch (error) {
    console.error('Error clearing token:', error);
    
    Alert.alert(
      'Token Error',
      'Could not clear token.',
      [
        { text: 'OK' }
      ]
    );
    
    return false;
  }
}; 