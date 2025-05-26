import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { backendUrl, currency } from '../constants';

// Sample data to use when backend is not available
const SAMPLE_PRODUCTS = [
  {
    _id: '1',
    name: 'Classic T-Shirt',
    category: 'Men',
    price: 25,
    image: []
  },
  {
    _id: '2',
    name: 'Summer Dress',
    category: 'Women',
    price: 45,
    image: []
  },
  {
    _id: '3',
    name: 'Kids Hoodie',
    category: 'Kids',
    price: 30,
    image: []
  }
];

const ProductListScreen = ({ token, backendConnected }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingSampleData, setUsingSampleData] = useState(false);

  const fetchProducts = async () => {
    if (!backendConnected) {
      // If backend is not connected, use sample data
      setProducts(SAMPLE_PRODUCTS);
      setUsingSampleData(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      console.log('Fetching products...');
      const response = await axios.get(`${backendUrl}/api/product/list`, {
        timeout: 10000 // 10 second timeout
      });
      
      console.log('Products API response:', response.data);
      
      if (response.data.success) {
        setProducts(response.data.products || []);
        setUsingSampleData(false);
        Toast.show({
          type: 'success',
          text1: 'Products loaded successfully',
        });
      } else {
        console.log('API returned error:', response.data.message);
        Toast.show({
          type: 'error',
          text1: 'Failed to load products',
          text2: response.data.message,
        });
        
        setProducts(SAMPLE_PRODUCTS);
        setUsingSampleData(true);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      
      setProducts(SAMPLE_PRODUCTS);
      setUsingSampleData(true);
      
      Toast.show({
        type: 'error',
        text1: 'Network error',
        text2: 'Could not connect to the server',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [backendConnected]);

  const handleRemoveProduct = async (id, name) => {
    if (usingSampleData) {
      // Just remove from local state if using sample data
      setProducts(products.filter(product => product._id !== id));
      Toast.show({
        type: 'success',
        text1: 'Product removed from sample data',
      });
      return;
    }
    
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await axios.post(
                `${backendUrl}/api/product/remove`, 
                { id },
                { headers: { token } }
              );

              if (response.data.success) {
                // Remove from local state
                setProducts(products.filter(product => product._id !== id));
                Toast.show({
                  type: 'success',
                  text1: 'Product removed successfully',
                });
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Failed to remove product',
                  text2: response.data.message,
                });
              }
            } catch (error) {
              console.error('Error removing product:', error);
              Toast.show({
                type: 'error',
                text1: 'Network error',
                text2: error.response?.data?.message || 'Could not connect to the server',
              });
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderProductItem = ({ item }) => (
    <View style={styles.productItem}>
      <View style={styles.productRow}>
        {item.image && item.image.length > 0 ? (
          <Image 
            source={{ uri: item.image[0] }} 
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImagePlaceholder} />
        )}
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.detailRow}>
            <Text style={styles.productCategory}>{item.category}</Text>
            <Text style={styles.productPrice}>
              {currency}{item.price}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleRemoveProduct(item._id, item.name)}
        >
          <AntDesign name="delete" size={22} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Products</Text>
        {usingSampleData && (
          <View style={styles.sampleDataIndicator}>
            <MaterialIcons name="warning" size={16} color="#ff9800" />
            <Text style={styles.sampleDataText}>Sample Data</Text>
          </View>
        )}
      </View>
      
      {/* Add a retry button if using sample data */}
      {usingSampleData && backendConnected && (
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchProducts}
        >
          <MaterialIcons name="refresh" size={16} color="#fff" />
          <Text style={styles.retryButtonText}>Retry Loading Real Data</Text>
        </TouchableOpacity>
      )}
      
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
        onRefresh={fetchProducts}
        refreshing={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  listContent: {
    paddingBottom: 20,
  },
  productItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productCategory: {
    fontSize: 14,
    color: '#777',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#777',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sampleDataIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  sampleDataText: {
    color: '#ff9800',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007aff',
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default ProductListScreen; 