import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToken } from '../utils/TokenHelper';
import axios from 'axios';
import { backendUrl } from '../constants';

const ProfileScreen = ({ setToken, token, backendConnected }) => {
  const [userInfo, setUserInfo] = useState({
    email: 'admin@example.com',
    role: 'Administrator',
    lastLogin: new Date().toLocaleString(),
  });
  const [backendStatus, setBackendStatus] = useState(backendConnected);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              // Clear the token to log the user out
              await AsyncStorage.removeItem('userToken');
              setToken('');
              Toast.show({
                type: 'success',
                text1: 'Logged out successfully',
              });
            } catch (error) {
              console.error('Logout error:', error);
              Toast.show({
                type: 'error',
                text1: 'Error during logout',
                text2: 'Please try again',
              });
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Function to handle token debug
  const handleCheckToken = () => {
    showToken();
  };

  // Function to check backend connection
  const checkBackendConnection = async () => {
    try {
      Toast.show({
        type: 'info',
        text1: 'Checking backend connection...',
      });
      
      const response = await axios.get(`${backendUrl}`, { timeout: 5000 });
      console.log('Backend connection response:', response.data);
      
      if (response.data) {
        setBackendStatus(true);
        Toast.show({
          type: 'success',
          text1: 'Backend server is connected!',
          text2: 'API is operational',
        });
      }
      return true;
    } catch (error) {
      console.error('Backend connection check failed:', error);
      setBackendStatus(false);
      
      Alert.alert(
        'Backend Connection Failed',
        `Could not connect to the backend server at ${backendUrl}.\n\nPlease make sure the server is running with:\n\nnode start-backend.js\n\nIf you cannot start the server, sample data will be used instead.`,
        [{ text: 'OK' }]
      );
      
      return false;
    }
  };

  useEffect(() => {
    setBackendStatus(backendConnected);
  }, [backendConnected]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <FontAwesome name="user-circle" size={80} color="#333" />
        </View>
        <Text style={styles.adminTitle}>Administrator</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={20} color="#555" />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{userInfo.email}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <MaterialIcons name="security" size={20} color="#555" />
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.infoValue}>{userInfo.role}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <MaterialIcons name="schedule" size={20} color="#555" />
            <Text style={styles.infoLabel}>Last Login:</Text>
            <Text style={styles.infoValue}>{userInfo.lastLogin}</Text>
          </View>
        </View>
      </View>

      {/* Developer Options Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developer Options</Text>
        
        {/* Server Connection Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Backend Server:</Text>
            <View style={[styles.statusIndicator, backendStatus ? styles.statusOnline : styles.statusOffline]}>
              <Text style={styles.statusText}>
                {backendStatus ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={handleCheckToken}
          >
            <MaterialIcons name="vpn-key" size={20} color="#fff" />
            <Text style={styles.debugButtonText}>Check Token</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.debugButton, { backgroundColor: '#4caf50' }]}
            onPress={checkBackendConnection}
          >
            <MaterialIcons name="sync" size={20} color="#fff" />
            <Text style={styles.debugButtonText}>Check Server</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
      >
        <MaterialIcons name="logout" size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
    marginLeft: 10,
    width: 80,
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    margin: 16,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  debugButton: {
    backgroundColor: '#007aff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    flex: 1,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOnline: {
    backgroundColor: '#e8f5e9',
  },
  statusOffline: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
});

export default ProfileScreen; 