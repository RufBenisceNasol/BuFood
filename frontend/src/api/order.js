import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const orderAPI = {
  // Create order from cart
  createOrderFromCart: async (orderData) => {
    try {
      const response = await api.post('/orders/create-from-cart', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create direct order (without cart)
  createDirectOrder: async (orderData) => {
    try {
      const response = await api.post('/orders/create-direct', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get seller's orders with filters and pagination
  getSellerOrders: async (params) => {
    try {
      const response = await api.get('/orders/seller', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get order details
  getOrderDetails: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update order status (Seller only)
  updateOrderStatus: async (orderId, statusData) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, statusData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Accept order (Seller only)
  acceptOrder: async (orderId, acceptData) => {
    try {
      const response = await api.post(`/orders/${orderId}/accept`, acceptData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cancel order (Customer only, for pending orders)
  cancelOrder: async (orderId, cancelData = {}) => {
    try {
      const response = await api.post(`/orders/${orderId}/cancel`, cancelData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Example usage of the API with TypeScript interfaces
/**
 * @typedef {Object} DeliveryDetails
 * @property {string} receiverName - Name of the person receiving the order
 * @property {string} contactNumber - Contact number of the receiver
 * @property {string} building - Building name/number
 * @property {string} roomNumber - Room or unit number
 * @property {string} [additionalInstructions] - Additional delivery instructions
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} productId - ID of the product
 * @property {number} quantity - Quantity to order
 */

/**
 * @typedef {Object} CreateOrderData
 * @property {'Pickup' | 'Delivery'} orderType - Type of order
 * @property {string[]} selectedItems - Array of product IDs (for cart order)
 * @property {OrderItem[]} items - Array of items (for direct order)
 * @property {'Cash on Delivery' | 'GCash' | 'Cash on Pickup'} [paymentMethod] - Payment method
 * @property {DeliveryDetails} [deliveryDetails] - Required for delivery orders
 * @property {string} [pickupTime] - Required for pickup orders (ISO date string)
 * @property {string} [notes] - Additional notes
 */

/**
 * @typedef {Object} OrderFilters
 * @property {string} [status] - Filter by order status
 * @property {'Pickup' | 'Delivery'} [orderType] - Filter by order type
 * @property {string} [startDate] - Start date for date range filter
 * @property {string} [endDate] - End date for date range filter
 * @property {number} [page] - Page number for pagination
 * @property {number} [limit] - Items per page
 * @property {string} [sortBy] - Field to sort by
 * @property {'asc' | 'desc'} [sortOrder] - Sort direction
 */

// Example usage:
/*
// Create order from cart
const createOrder = async () => {
  const orderData = {
    orderType: 'Delivery',
    selectedItems: ['productId1', 'productId2'],
    paymentMethod: 'Cash on Delivery',
    deliveryDetails: {
      receiverName: 'John Doe',
      contactNumber: '+639123456789',
      building: 'Building A',
      roomNumber: '101',
      additionalInstructions: 'Call upon arrival'
    }
  };
  
  try {
    const result = await orderAPI.createOrderFromCart(orderData);
    console.log('Order created:', result);
  } catch (error) {
    console.error('Error creating order:', error);
  }
};

// Get seller orders with filters
const getOrders = async () => {
  const filters = {
    status: 'Pending',
    orderType: 'Delivery',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };

  try {
    const result = await orderAPI.getSellerOrders(filters);
    console.log('Orders:', result);
  } catch (error) {
    console.error('Error getting orders:', error);
  }
};
*/ 