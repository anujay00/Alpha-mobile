import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView
} from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { backendUrl } from '../constants';

const ReviewsScreen = ({ token, backendConnected }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const fetchReviews = async () => {
    if (!backendConnected) {
      // If backend is not connected, use sample data right away
      setReviews(SAMPLE_REVIEWS);
      setUsingSampleData(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Validate token presence
      if (!token) {
        Alert.alert('Authentication Error', 'No authentication token found. Please log in again.');
        setReviews(SAMPLE_REVIEWS);
        setUsingSampleData(true);
        return;
      }
      
      console.log('Fetching reviews with token:', token.substring(0, 15) + '...');
      
      // FIXED: Include token in headers for admin authentication
      const response = await axios.get(`${backendUrl}/api/review/all`, {
        headers: { token },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('Reviews API response:', response.data);
      
      if (response.data.success) {
        setReviews(response.data.reviews || []);
        setUsingSampleData(false);
        Toast.show({
          type: 'success',
          text1: 'Reviews loaded successfully',
        });
      } else {
        console.log('API returned error:', response.data.message);
        Toast.show({
          type: 'error',
          text1: 'Failed to load reviews',
          text2: response.data.message,
        });
        
        // Ask user if they want to continue with sample data
        Alert.alert(
          'Error Loading Reviews',
          'Would you like to use sample review data instead?',
          [
            { text: 'No', style: 'cancel' },
            { 
              text: 'Yes', 
              onPress: () => {
                setReviews(SAMPLE_REVIEWS);
                setUsingSampleData(true);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      
      // Check if it's a network error
      const isNetworkError = error.message.includes('Network Error') || 
                             error.code === 'ECONNABORTED' ||
                             !error.response;
      
      if (isNetworkError) {
        Alert.alert(
          'Connection Error', 
          `Could not connect to the server at ${backendUrl}. Please check that your backend server is running.`,
          [
            { text: 'Try Again', onPress: () => fetchReviews() },
            { 
              text: 'Use Sample Data', 
              onPress: () => {
                setReviews(SAMPLE_REVIEWS);
                setUsingSampleData(true);
              }
            }
          ]
        );
      } else {
        // Ask user about using sample data
        Alert.alert(
          'Error Loading Reviews',
          'Would you like to use sample review data instead?',
          [
            { text: 'No', style: 'cancel' },
            { 
              text: 'Yes', 
              onPress: () => {
                setReviews(SAMPLE_REVIEWS);
                setUsingSampleData(true);
              }
            }
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch reviews when component mounts or backend connection changes or token changes
  useEffect(() => {
    if (token) {
      fetchReviews();
    } else {
      setReviews(SAMPLE_REVIEWS);
      setUsingSampleData(true);
      setLoading(false);
    }
  }, [backendConnected, token]);

  const handleDeleteReview = async (reviewId) => {
    if (!token) {
      Alert.alert('Authentication Error', 'You need to be logged in to delete reviews.');
      return;
    }
    
    // Confirm before deletion
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Only proceed with API call if not using sample data
              if (usingSampleData) {
                // If using sample data, just update the local state
                setReviews(reviews.filter(review => review._id !== reviewId));
                Toast.show({
                  type: 'success',
                  text1: 'Review deleted from sample data',
                });
                setLoading(false);
                return;
              }
              
              // FIXED: Use the correct endpoint and request format
              const response = await axios.delete(`${backendUrl}/api/review/delete/${reviewId}`, {
                headers: { token }
              });

              if (response.data.success) {
                // Update local state after successful deletion
                setReviews(reviews.filter(review => review._id !== reviewId));
                // Close the modal if the deleted review was being viewed
                if (selectedReview && selectedReview._id === reviewId) {
                  setDetailModalVisible(false);
                }
                Toast.show({
                  type: 'success',
                  text1: 'Review deleted successfully',
                });
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Failed to delete review',
                  text2: response.data.message,
                });
              }
            } catch (error) {
              console.error('Error deleting review:', error);
              Toast.show({
                type: 'error',
                text1: 'Network error',
                text2: 'Could not connect to the server',
              });
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const formatDate = (dateObj) => {
    const date = new Date(dateObj);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  const renderRatingStars = (rating) => {
    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialIcons
            key={star}
            name="star"
            size={16}
            color={star <= rating ? '#FFD700' : '#E0E0E0'}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };
  
  // Function to handle review detail view
  const showReviewDetail = (review) => {
    setSelectedReview(review);
    setDetailModalVisible(true);
  };

  // Function to truncate text
  const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const renderReviewItem = ({ item }) => {
    // Extract user's first name for more friendly display
    const firstName = item.user && item.user.name ? item.user.name.split(' ')[0] : 
                      item.name ? item.name.split(' ')[0] : 'Anonymous';

    // Get product name from item with fallback
    const productName = item.product && item.product.name ? item.product.name : item.productName || 'Unknown Product';
    
    return (
      <TouchableOpacity 
        style={styles.reviewCard}
        onPress={() => showReviewDetail(item)}
      >
        <View style={styles.reviewHeader}>
          <View style={styles.userSection}>
            <View style={styles.userAvatar}>
              <Text style={styles.userInitial}>{firstName.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.customerName}>{firstName}</Text>
              <Text style={styles.reviewDate}>{formatDate(item.date)}</Text>
            </View>
          </View>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingValue}>{item.rating}</Text>
            <MaterialIcons name="star" size={12} color="#fff" />
          </View>
        </View>

        <View style={styles.productTitleRow}>
          <MaterialIcons name="shopping-bag" size={16} color="#666" />
          <Text style={styles.productName}>{productName}</Text>
        </View>

        <Text style={styles.reviewText}>
          {truncateText(item.review || item.comment, 120)}
        </Text>

        <View style={styles.reviewFooter}>
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={() => showReviewDetail(item)}
          >
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteReview(item._id)}
          >
            <MaterialIcons name="delete" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
        <Text style={styles.title}>Customer Reviews</Text>
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
          onPress={fetchReviews}
        >
          <MaterialIcons name="refresh" size={16} color="#fff" />
          <Text style={styles.retryButtonText}>Retry Loading Real Data</Text>
        </TouchableOpacity>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{reviews.length}</Text>
          <Text style={styles.statLabel}>Total Reviews</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {reviews.length > 0 
              ? (reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length).toFixed(1) 
              : '0.0'
            }
          </Text>
          <Text style={styles.statLabel}>Avg. Rating</Text>
        </View>
      </View>

      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reviews found</Text>
          </View>
        }
        onRefresh={fetchReviews}
        refreshing={loading}
      />
      
      {/* Review Detail Modal */}
      <Modal
        visible={detailModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        {selectedReview && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Review Details</Text>
                <TouchableOpacity 
                  onPress={() => setDetailModalVisible(false)}
                  style={styles.closeButton}
                >
                  <AntDesign name="close" size={22} color="#555" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                <View style={styles.reviewDetailHeader}>
                  <View style={styles.userDetailSection}>
                    <View style={styles.userDetailAvatar}>
                      <Text style={styles.userDetailInitial}>
                        {selectedReview.user && selectedReview.user.name 
                          ? selectedReview.user.name.charAt(0) 
                          : selectedReview.name 
                            ? selectedReview.name.charAt(0) 
                            : 'A'
                        }
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.customerDetailName}>
                        {selectedReview.user && selectedReview.user.name
                          ? selectedReview.user.name
                          : selectedReview.name || 'Anonymous'
                        }
                      </Text>
                      <Text style={styles.userDetailEmail}>
                        {selectedReview.user && selectedReview.user.email || 'Email not available'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.detailDate}>{formatDate(selectedReview.date)}</Text>
                </View>
                
                <View style={styles.detailRatingSection}>
                  <Text style={styles.detailRatingLabel}>Rating:</Text>
                  <View style={styles.detailRatingRow}>
                    {renderRatingStars(selectedReview.rating)}
                    <Text style={styles.detailRatingValue}>{selectedReview.rating}/5</Text>
                  </View>
                </View>
                
                <View style={styles.detailProductSection}>
                  <Text style={styles.detailSectionTitle}>Product</Text>
                  <View style={styles.detailProductRow}>
                    {selectedReview.product && selectedReview.product.image ? (
                      <Image 
                        source={{ uri: selectedReview.product.image[0] }} 
                        style={styles.productImage} 
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <MaterialIcons name="image" size={24} color="#ccc" />
                      </View>
                    )}
                    <Text style={styles.detailProductName}>
                      {selectedReview.product && selectedReview.product.name
                        ? selectedReview.product.name
                        : selectedReview.productName || 'Unknown Product'
                      }
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailCommentSection}>
                  <Text style={styles.detailSectionTitle}>Review Comment</Text>
                  <Text style={styles.detailCommentText}>
                    {selectedReview.review || selectedReview.comment || 'No comment provided'}
                  </Text>
                </View>
                
                {selectedReview.image && (
                  <View style={styles.detailImageSection}>
                    <Text style={styles.detailSectionTitle}>Review Image</Text>
                    <Image 
                      source={{ uri: selectedReview.image }} 
                      style={styles.reviewImage}
                      resizeMode="contain"
                    />
                  </View>
                )}
                
                <TouchableOpacity
                  style={styles.detailDeleteButton}
                  onPress={() => {
                    setDetailModalVisible(false);
                    // Small delay before showing delete confirmation
                    setTimeout(() => {
                      handleDeleteReview(selectedReview._id);
                    }, 300);
                  }}
                >
                  <MaterialIcons name="delete" size={20} color="#fff" />
                  <Text style={styles.detailDeleteButtonText}>Delete Review</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

// Sample data as fallback
const SAMPLE_REVIEWS = [
  {
    _id: '101',
    name: 'John Doe',
    user: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    date: new Date('2023-10-05'),
    productName: 'Classic T-Shirt',
    product: {
      name: 'Classic T-Shirt'
    },
    rating: 5,
    review: 'Great quality and comfortable fit. Would definitely buy again! The fabric is soft and the sizing is perfect. I ordered my usual size and it fits just right. The color is exactly as shown in the photos. Highly recommended for anyone looking for a reliable everyday t-shirt.',
    image: null
  },
  {
    _id: '102',
    name: 'Jane Smith',
    user: {
      name: 'Jane Smith',
      email: 'jane@example.com'
    },
    date: new Date('2023-09-28'),
    productName: 'Summer Dress',
    product: {
      name: 'Summer Dress'
    },
    rating: 4,
    review: 'Beautiful dress but runs a bit small. Otherwise very happy with it. The material is lightweight and perfect for summer.',
    image: null
  },
  {
    _id: '103',
    name: 'Mike Johnson',
    user: {
      name: 'Mike Johnson',
      email: 'mike@example.com'
    },
    date: new Date('2023-09-15'),
    productName: 'Denim Jacket',
    product: {
      name: 'Denim Jacket'
    },
    rating: 3,
    review: 'Average quality. The color is slightly different from the photos. It is still wearable, but I expected better quality for the price.',
    image: null
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
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reviewDate: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
  },
  ratingValue: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginRight: 2,
  },
  productTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productName: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  reviewText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 16,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  viewButtonText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#ff3b30',
    borderRadius: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#555',
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
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 16,
  },
  reviewDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  userDetailSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetailAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userDetailInitial: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#555',
  },
  customerDetailName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userDetailEmail: {
    fontSize: 14,
    color: '#777',
  },
  detailDate: {
    fontSize: 14,
    color: '#777',
  },
  detailRatingSection: {
    marginBottom: 20,
  },
  detailRatingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    marginBottom: 6,
  },
  detailRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailRatingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  detailProductSection: {
    marginBottom: 20,
  },
  detailProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailProductName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  detailCommentSection: {
    marginBottom: 20,
  },
  detailCommentText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  detailImageSection: {
    marginBottom: 20,
  },
  reviewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  detailDeleteButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  detailDeleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  }
});

export default ReviewsScreen; 