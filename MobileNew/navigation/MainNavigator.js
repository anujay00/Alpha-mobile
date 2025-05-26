import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AntDesign, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { wp, hp, fontSize } from '../utils/ResponsiveUtils';

// Import screens
import ProductListScreen from '../screens/ProductListScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ReviewsScreen from '../screens/ReviewsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const MainNavigator = ({ token, setToken, backendConnected }) => {
  // Calculate dynamic sizes based on device
  const tabBarHeight = Platform.OS === 'ios' ? hp(50) : hp(60);
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: hp(5),
          paddingTop: hp(5),
          height: tabBarHeight,
          // Safe area insets for notched devices
          paddingBottom: Platform.OS === 'ios' ? hp(24) : hp(8),
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
          height: Platform.OS === 'ios' ? hp(90) : hp(60),
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: fontSize(17),
        },
        tabBarIconStyle: {
          marginTop: hp(4),
        },
        tabBarLabelStyle: {
          fontSize: fontSize(12),
          marginBottom: Platform.OS === 'ios' ? hp(5) : 0,
        },
      }}
    >
      <Tab.Screen
        name="Products"
        options={{
          title: 'Products List',
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="appstore-o" size={fontSize(size * 0.85)} color={color} />
          ),
        }}
      >
        {(props) => <ProductListScreen {...props} token={token} backendConnected={backendConnected} />}
      </Tab.Screen>

      <Tab.Screen
        name="Orders"
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="shopping-bag" size={fontSize(size * 0.8)} color={color} />
          ),
        }}
      >
        {(props) => <OrdersScreen {...props} token={token} backendConnected={backendConnected} />}
      </Tab.Screen>

      <Tab.Screen
        name="Reviews"
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="rate-review" size={fontSize(size * 0.9)} color={color} />
          ),
        }}
      >
        {(props) => <ReviewsScreen {...props} token={token} backendConnected={backendConnected} />}
      </Tab.Screen>

      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" size={fontSize(size * 0.85)} color={color} />
          ),
        }}
      >
        {(props) => <ProfileScreen {...props} setToken={setToken} token={token} backendConnected={backendConnected} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default MainNavigator; 