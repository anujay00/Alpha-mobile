import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ScrollView,
  Dimensions
} from 'react-native';
import Toast from 'react-native-toast-message';
import { backendUrl, DEMO_TOKEN } from '../constants';
import { MaterialIcons } from '@expo/vector-icons';
import { createApiClient } from '../utils/useApiClient';
import { wp, hp, fontSize, adaptiveValue } from '../utils/ResponsiveUtils';

// Get device dimensions for responsiveness
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LoginScreen = ({ setToken, backendConnected, isValidating = false }) => {
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('123456789');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Email and password are required',
      });
      return;
    }
    
    // Check for backend connection before attempting login
    if (!backendConnected) {
      Alert.alert(
        'Backend Server Unavailable',
        'Cannot log in because the backend server is not running. Please start the server and try again.',
        [
          { text: 'OK' },
          { 
            text: 'Use Default Admin',
            onPress: () => {
              // For demo purposes, allow login with default admin credentials
              if (email === 'admin@gmail.com' && password === '123456789') {
                Toast.show({
                  type: 'warning',
                  text1: 'Offline demo mode enabled',
                  text2: 'Limited functionality available',
                });
                setToken(DEMO_TOKEN);
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Invalid credentials',
                  text2: 'Use default admin credentials for offline mode',
                });
              }
            }
          }
        ]
      );
      return;
    }

    setLoading(true);
    try {
      // Create an API client using our helper that uses the working URL
      const apiClient = await createApiClient();
      
      console.log('Attempting login to API with:', {email, password});
      const response = await apiClient.post('/api/user/admin', {
        email,
        password
      });

      console.log('Login response:', JSON.stringify(response.data));

      if (response.data.success) {
        setToken(response.data.token);
        Toast.show({
          type: 'success',
          text1: 'Login successful',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: response.data.message || 'Login failed',
        });
      }
    } catch (error) {
      console.log('Login error:', error);
      
      // Try alternate URL if the first one fails
      if (error.message === 'Network Error') {
        try {
          console.log('Attempting login with fallback URL:', `${backendUrl}/api/user/admin`);
          
          // Create an API client with a different base URL
          const fallbackClient = await createApiClient();
          fallbackClient.defaults.baseURL = backendUrl;
          
          const response = await fallbackClient.post('/api/user/admin', {
            email,
            password
          });
          
          console.log('Fallback login response:', response.data);
          
          if (response.data.success) {
            setToken(response.data.token);
            Toast.show({
              type: 'success',
              text1: 'Login successful (fallback)',
            });
            return;
          }
        } catch (fallbackError) {
          console.log('Fallback login error:', fallbackError);
        }
      }
      
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Network error. Please try again.',
        text2: 'Check your connection and server status.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show a loading indicator while validating token
  if (isValidating) {
    return (
      <View style={styles.validationContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.validationText}>Checking login status...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.loginContainer}>
          <Text style={styles.title}>ALPHA Admin Panel</Text>
          
          {/* Server Connection Indicator */}
          <View style={[
            styles.serverStatus, 
            backendConnected ? styles.serverConnected : styles.serverDisconnected
          ]}>
            <MaterialIcons 
              name={backendConnected ? "cloud-done" : "cloud-off"} 
              size={fontSize(16)} 
              color={backendConnected ? "#43a047" : "#e53935"} 
            />
            <Text style={[
              styles.serverStatusText,
              backendConnected ? styles.serverConnectedText : styles.serverDisconnectedText
            ]}>
              {backendConnected ? 'Server Connected' : 'Server Disconnected'}
            </Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.hint}>
            Default admin: admin@gmail.com / 123456789
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: wp(20),
    minHeight: '100%',
  },
  loginContainer: {
    backgroundColor: 'white',
    borderRadius: adaptiveValue(6, 8, 10),
    padding: wp(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    maxWidth: adaptiveValue(350, 400, 450),
    alignSelf: 'center',
  },
  title: {
    fontSize: fontSize(24),
    fontWeight: 'bold',
    marginBottom: hp(20),
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: hp(16),
  },
  label: {
    fontSize: fontSize(14),
    fontWeight: '500',
    marginBottom: hp(8),
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: adaptiveValue(4, 6, 8),
    paddingVertical: hp(10),
    paddingHorizontal: wp(12),
    fontSize: fontSize(16),
  },
  button: {
    backgroundColor: '#333',
    borderRadius: adaptiveValue(4, 6, 8),
    paddingVertical: hp(12),
    alignItems: 'center',
    marginTop: hp(10),
  },
  buttonText: {
    color: '#fff',
    fontSize: fontSize(16),
    fontWeight: '600',
  },
  validationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  validationText: {
    marginTop: hp(20),
    fontSize: fontSize(16),
    color: '#333',
  },
  hint: {
    marginTop: hp(16),
    fontSize: fontSize(12),
    color: '#999',
    textAlign: 'center',
  },
  serverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(6),
    paddingHorizontal: wp(10),
    borderRadius: 20,
    marginBottom: hp(16),
    marginTop: hp(-10),
  },
  serverConnected: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  serverDisconnected: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  serverStatusText: {
    marginLeft: wp(5),
    fontSize: fontSize(12),
  },
  serverConnectedText: {
    color: '#43a047',
  },
  serverDisconnectedText: {
    color: '#e53935',
  },
});

export default LoginScreen; 