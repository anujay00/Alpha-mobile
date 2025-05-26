import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  Platform
} from 'react-native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { backendUrl, currency } from '../constants';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const OrdersScreen = ({ token, backendConnected }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState([]);
  
  const ORDER_STATUSES = [
    'Order Placed',
    'Packing',
    'Shipped',
    'Out for delivery',
    'Delivered'
  ];

  const fetchOrders = async () => {
    if (!backendConnected) {
      // If backend is not connected, use sample data right away
      setOrders(SAMPLE_ORDERS);
      // No need to set filteredOrders manually as the useEffect will handle it
      setUsingSampleData(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Validate token presence
      if (!token) {
        console.log('No auth token found, using sample data');
        setOrders(SAMPLE_ORDERS);
        // No need to set filteredOrders manually as the useEffect will handle it
        setUsingSampleData(true);
        return;
      }
      
      console.log('Fetching orders with token:', token.substring(0, 15) + '...');
      
      const response = await axios.post(
        `${backendUrl}/api/order/list`, 
        {}, // empty body since we're just fetching data
        {
          headers: { token },
          timeout: 10000 // 10 second timeout
        }
      );
      
      console.log('Order API response:', response.data);
      
      if (response.data.success) {
        setOrders(response.data.orders || []);
        // No need to set filteredOrders manually as the useEffect will handle it
        setUsingSampleData(false);
        
        Toast.show({
          type: 'success',
          text1: 'Orders loaded successfully',
        });
      } else {
        console.log('API returned error:', response.data.message);
        Toast.show({
          type: 'error',
          text1: 'Failed to load orders',
          text2: response.data.message,
        });
        
        setOrders(SAMPLE_ORDERS);
        // No need to set filteredOrders manually as the useEffect will handle it
        setUsingSampleData(true);
      }
    } catch (error) {
      console.log('Error fetching orders:', error.message);
      
      // Always use sample data on error
      setOrders(SAMPLE_ORDERS);
      setUsingSampleData(true);
      
      // Inform the user but don't block the app functionality
      Toast.show({
        type: 'info',
        text1: 'Using sample data',
        text2: 'App running in offline mode'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders when component mounts or token changes or backend connection changes
  useEffect(() => {
    if (token) {
      fetchOrders();
    } else {
      setOrders(SAMPLE_ORDERS);
      // No need to set filteredOrders manually as the useEffect will handle it
      setUsingSampleData(true);
      setLoading(false);
    }
  }, [token, backendConnected]);

  // Update filtered orders when orders or selected date changes
  useEffect(() => {
    if (selectedDate) {
      const filtered = orders.filter(order => {
        const orderDate = new Date(order.date);
        return (
          orderDate.getDate() === selectedDate.getDate() &&
          orderDate.getMonth() === selectedDate.getMonth() &&
          orderDate.getFullYear() === selectedDate.getFullYear()
        );
      });
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [orders, selectedDate]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${backendUrl}/api/order/status`,
        { 
          orderId,
          status: newStatus 
        },
        {
          headers: { token }
        }
      );

      if (response.data.success) {
        // Update local state for both orders and filteredOrders
        const updatedOrders = orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        );
        
        setOrders(updatedOrders);
        // The filteredOrders will be automatically updated by the useEffect
        
        Toast.show({
          type: 'success',
          text1: 'Status updated successfully',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to update status',
          text2: response.data.message,
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      // Update UI optimistically despite the error
      const updatedOrders = orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      );
      
      setOrders(updatedOrders);
      // The filteredOrders will be automatically updated by the useEffect
      
      Toast.show({
        type: 'warning',
        text1: 'Network issue',
        text2: 'Status updated locally only',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Open status selection modal
  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setStatusModalVisible(true);
  };
  
  // Handle status selection from modal
  const handleStatusSelect = (status) => {
    if (selectedOrder) {
      updateOrderStatus(selectedOrder._id, status);
    }
    setStatusModalVisible(false);
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    
    // Only update the date if a date was actually picked
    if (date !== undefined) {
      setSelectedDate(date);
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  // Platform-specific date picker
  const showDatePickerModal = () => {
    if (Platform.OS === 'android') {
      // On Android, showing the DateTimePicker directly
      setShowDatePicker(true);
    } else {
      // On iOS, the DateTimePicker is shown in the render method when showDatePicker is true
      setShowDatePicker(true);
    }
  };

  // Format date to readable string
  const formatDate = (dateObj) => {
    const date = new Date(dateObj);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };
  
  // Get appropriate status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Order Placed':
        return '#2196F3'; // Blue
      case 'Packing':
        return '#FF9800'; // Orange
      case 'Shipped':
        return '#8BC34A'; // Light Green
      case 'Out for delivery':
        return '#9C27B0'; // Purple
      case 'Delivered':
        return '#4CAF50'; // Green
      default:
        return '#757575'; // Grey
    }
  };

  const renderOrderItem = ({ item }) => {
    // Calculate total price
    const totalPrice = item.items.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    );

    const statusColor = getStatusColor(item.status);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderWebStyle}>
          {/* Left Column - Parcel Icon */}
          <View style={styles.iconColumn}>
            <MaterialIcons name="local-shipping" size={32} color="#333" />
          </View>

          {/* Middle Column - Order Details */}
          <View style={styles.detailsColumn}>
            {/* Product items */}
            <View style={styles.productsContainer}>
              {item.items.map((product, index) => (
                <Text key={index} style={styles.productText}>
                  {product.name} x {product.quantity} <Text style={styles.sizeText}>{product.size}</Text>
                  {index !== item.items.length - 1 ? "," : ""}
                </Text>
              ))}
            </View>

            {/* Customer info */}
            <Text style={styles.customerName}>{item.address.name}</Text>
            <View style={styles.addressContainer}>
              <Text style={styles.address}>{item.address.street},</Text>
              <Text style={styles.address}>
                {item.address.city}, {item.address.state} - {item.address.pin}
              </Text>
            </View>
            <Text style={styles.phone}>{item.address.phone}</Text>
          </View>

          {/* Right Column - Order Meta */}
          <View style={styles.metaColumn}>
            <Text style={styles.metaText}>Items: {item.items.length}</Text>
            <Text style={styles.metaText}>Date: {formatDate(item.date)}</Text>
            <Text style={styles.orderAmount}>{currency}{totalPrice}</Text>
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.statusRow}>
          <TouchableOpacity 
            onPress={() => openStatusModal(item)}
            style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
            <MaterialIcons name="arrow-drop-down" size={18} color={statusColor} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Date Filter UI
  const renderDatePicker = () => {
    if (!showDatePicker) return null;
    
    return (
      <DateTimePicker
        testID="dateTimePicker"
        value={selectedDate || new Date()}
        mode="date"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={handleDateChange}
      />
    );
  };

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
        <Text style={styles.title}>Orders</Text>
        {usingSampleData && (
          <View style={styles.sampleDataIndicator}>
            <MaterialIcons name="warning" size={16} color="#ff9800" />
            <Text style={styles.sampleDataText}>Sample Data</Text>
          </View>
        )}
      </View>

      {/* Date Filter UI */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={styles.datePickerButton}
          onPress={showDatePickerModal}
        >
          <MaterialIcons name="calendar-today" size={16} color="#333" />
          <Text style={styles.datePickerButtonText}>
            {selectedDate ? formatDate(selectedDate) : "Filter by Date"}
          </Text>
        </TouchableOpacity>
        
        {selectedDate && (
          <TouchableOpacity
            style={styles.clearFilterButton}
            onPress={clearDateFilter}
          >
            <MaterialIcons name="close" size={16} color="#fff" />
            <Text style={styles.clearFilterText}>Clear</Text>
          </TouchableOpacity>
        )}

        {/* Render DateTimePicker using the function */}
        {renderDatePicker()}
      </View>

      {/* Add a retry button if using sample data */}
      {usingSampleData && backendConnected && (
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchOrders}
        >
          <MaterialIcons name="refresh" size={16} color="#fff" />
          <Text style={styles.retryButtonText}>Retry Loading Real Data</Text>
        </TouchableOpacity>
      )}

      {/* Display filtered orders count if filter is active */}
      {selectedDate && (
        <View style={styles.filterResultsContainer}>
          <Text style={styles.filterResultsText}>
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}
      
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedDate ? "No orders found for selected date" : "No orders found"}
            </Text>
          </View>
        }
        refreshing={loading}
        onRefresh={fetchOrders}
      />
      
      {/* Status Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={statusModalVisible}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Order Status</Text>
            
            {ORDER_STATUSES.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  { 
                    backgroundColor: `${getStatusColor(status)}20`,
                    borderLeftWidth: 4,
                    borderLeftColor: getStatusColor(status)
                  }
                ]}
                onPress={() => handleStatusSelect(status)}
              >
                <Text style={[styles.statusOptionText, { color: getStatusColor(status) }]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Sample data for fallback - updated with correct status values
const SAMPLE_ORDERS = [
  {
    _id: '1001',
    date: new Date('2023-10-15'),
    status: 'Order Placed',
    address: {
      name: 'John Doe',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      pin: '10001',
      phone: '+1 123-456-7890'
    },
    items: [
      { name: 'Classic T-Shirt', quantity: 2, size: 'M', price: 25 }
    ]
  },
  {
    _id: '1002',
    date: new Date('2023-10-10'),
    status: 'Packing',
    address: {
      name: 'Jane Smith',
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      pin: '90001',
      phone: '+1 987-654-3210'
    },
    items: [
      { name: 'Summer Dress', quantity: 1, size: 'S', price: 45 },
      { name: 'Denim Jacket', quantity: 1, size: 'M', price: 60 }
    ]
  }
];

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
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    padding: 16,
    borderWidth: 2,
    borderColor: '#eee',
  },
  orderWebStyle: {
    flexDirection: 'row',
  },
  iconColumn: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 40,
  },
  detailsColumn: {
    flex: 2,
    paddingRight: 8,
  },
  metaColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  productsContainer: {
    marginBottom: 12,
  },
  productText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 1,
  },
  sizeText: {
    fontStyle: 'italic',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
    marginTop: 8,
  },
  addressContainer: {
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#555',
    lineHeight: 18,
  },
  phone: {
    fontSize: 14,
    color: '#555',
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    marginTop: 8,
  },
  statusRow: {
    marginTop: 16,
    marginBottom: 12,
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 6,
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#777',
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
  },
  datePickerButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#666',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  clearFilterText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#fff',
  },
  filterResultsContainer: {
    marginBottom: 12,
  },
  filterResultsText: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },
});

export default OrdersScreen; 