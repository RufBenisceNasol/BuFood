import axios from 'axios';
import { getToken, getRefreshToken, removeToken, removeRefreshToken, removeUser, setToken } from './utils/tokenUtils';

// Use environment variable for API base URL, fallback to Render URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://capstonedelibup.onrender.com/api";

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add response interceptor for token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status !== 401 || originalRequest.url === '/auth/refresh-token') {
            return Promise.reject(error);
        }

        try {
            const refreshToken = getRefreshToken();
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                refreshToken
            });

            if (response.data.accessToken) {
                setToken(response.data.accessToken, true); // Always persist refreshed token
                api.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
                return api(originalRequest);
            }
        } catch (err) {
            removeToken();
            removeRefreshToken();
            removeUser();
            window.location.href = '/login';
            return Promise.reject(err);
        }
    }
);

// Auth API endpoints
export const auth = {
    register: async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    login: async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
            removeToken();
            removeRefreshToken();
            removeUser();
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    verifyEmail: async (token) => {
        try {
            const response = await api.get(`/auth/verify/${token}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    resendVerification: async (email) => {
        try {
            const response = await api.post('/auth/resend-verification', { email });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    checkEmailVerification: async (email) => {
        try {
            const response = await api.post('/auth/check-verification', { email });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    forgotPassword: async (email) => {
        try {
            const response = await api.post('/auth/forgot-password', { email });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    resetPassword: async (token, newPassword) => {
        try {
            const response = await api.post('/auth/reset-password', { 
                token, 
                newPassword 
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getMe: async () => {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

// Store API endpoints
export const store = {
    // Get seller's own store
    getMyStore: async () => {
        try {
            const response = await api.get('/store/my-store', {
                params: { _t: Date.now() }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Update store
    updateStore: async (storeId, formData) => {
        try {
            const response = await api.put(`/store/${storeId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Delete store
    deleteStore: async (storeId) => {
        try {
            const response = await api.delete(`/store/${storeId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get all stores
    getAllStores: async () => {
        try {
            const response = await api.get('/store');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get store by ID
    getStoreById: async (storeId) => {
        try {
            const response = await api.get(`/store/view/${storeId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get store products
    getStoreProducts: async (storeId) => {
        try {
            const response = await api.get(`/store/${storeId}/products`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

// Product API endpoints
export const product = {
    // Create a new product
    createProduct: async (formData) => {
        try {
            const response = await api.post('/seller/products', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get seller's products
    getSellerProducts: async () => {
        try {
            const response = await api.get('/seller/products');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get all products
    getAllProducts: async () => {
        try {
            const response = await api.get('/products');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get product by ID
    getProductById: async (productId) => {
        try {
            // Add cache-busting timestamp
            const cacheBuster = `?t=${Date.now()}`;
            const productIdWithoutParams = productId.split('?')[0]; // Remove any existing query params
            const response = await api.get(`/products/${productIdWithoutParams}${cacheBuster}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Update product
    updateProduct: async (productId, data) => {
        try {
            let formData;
            if (data instanceof FormData) {
                formData = data;
            } else {
                formData = new FormData();
                Object.keys(data).forEach(key => {
                    formData.append(key, data[key]);
                });
            }
            
            const response = await api.patch(`/seller/products/${productId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Delete product
    deleteProduct: async (productId) => {
        try {
            const response = await api.delete(`/seller/products/${productId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Toggle product availability
    toggleAvailability: async (productId) => {
        try {
            const response = await api.patch(`/products/${productId}/toggle-availability`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

// Cart API endpoints
export const cart = {    addToCart: async (productId, quantity) => {
        try {
            const response = await api.post('/cart/add', { productId, quantity });
            return response.data.data.cart;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    viewCart: async () => {
        try {
            const response = await api.get('/cart');
            return response.data.data.cart;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getCartSummary: async () => {
        try {
            const response = await api.get('/cart/summary');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },    removeFromCart: async (productId) => {
        try {
            console.log('Removing product:', productId); // Debug log
            const response = await api.post('/cart/remove', { productId });
            if (response.data?.data?.cart) {
                return response.data.data.cart;
            }
            return response.data;
        } catch (error) {
            console.error('API error:', error.response || error); // Debug log
            throw error.response?.data || error.message;
        }
    },

    clearCart: async () => {
        try {
            const response = await api.delete('/cart/clear');
            return response.data.data.cart;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    updateCartItem: async (productId, quantity) => {
        try {
            const response = await api.put('/cart/update', { productId, quantity });
            return response.data.data.cart;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

// Order API endpoints
export const order = {
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
    getSellerOrders: async (params = {}) => {
        const { 
            status,
            orderType,
            startDate,
            endDate,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = params;
        
        try {
            const response = await api.get('/orders/seller', { 
                params: {
                    status,
                    orderType,
                    startDate,
                    endDate,
                    page,
                    limit,
                    sortBy,
                    sortOrder
                }
            });
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

    // Get customer orders
    getCustomerOrders: async () => {
        try {
            const response = await api.get('/orders/my-orders');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Helper method for managing orders (accept, update status)
    manageOrder: async (orderId, action, data) => {
        switch (action) {
            case 'accept':
                return order.acceptOrder(orderId, {
                    estimatedPreparationTime: data.estimatedPreparationTime,
                    note: data.note
                });
            case 'updateStatus':
                return order.updateOrderStatus(orderId, {
                    status: data.status,
                    estimatedTime: data.estimatedTime
                });
            case 'reject':
                return order.updateOrderStatus(orderId, {
                    status: 'Rejected',
                    note: data.note
                });
            default:
                throw new Error(`Unsupported action: ${action}`);
        }
    },

    // Helper method for checkout process
    checkout: async (orderData) => {
        const { items, isFromCart = true, ...restData } = orderData;
        
        if (isFromCart) {
            return order.createOrderFromCart({
                selectedItems: items,
                ...restData
            });
        } else {
            return order.createDirectOrder({
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                })),
                ...restData
            });
        }
    },

    // GCash checkout
    gcashCheckout: async ({ amount, orderId, redirectUrl }) => {
        try {
            const response = await api.post('/orders/gcash/checkout', { amount, orderId, redirectUrl });
            return response.data.data.checkoutUrl;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Manual GCash: customer upload proof
    uploadManualGcashProof: async (orderId, { file, gcashRef }) => {
        try {
            const form = new FormData();
            if (file) form.append('proof', file);
            if (gcashRef) form.append('gcashRef', gcashRef);
            const response = await api.post(`/orders/${orderId}/gcash-manual/proof`, form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Manual GCash: seller approve/reject
    approveManualGcash: async (orderId) => {
        try {
            const response = await api.post(`/orders/${orderId}/gcash-manual/approve`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
    rejectManualGcash: async (orderId, reason) => {
        try {
            const response = await api.post(`/orders/${orderId}/gcash-manual/reject`, { reason });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

// Customer API endpoints
export const customer = {

    getProfile: async () => {
        try {
            const response = await api.get('/customers/profile');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getAllStores: async () => {
        try {
            const response = await api.get('/customers/stores');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    viewStore: async (storeId) => {
        try {
            const response = await api.get(`/customers/store/${storeId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Favorites management
    addToFavorites: async (productId) => {
        try {
            const response = await api.post(`/customers/favorites/${productId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    removeFromFavorites: async (productId) => {
        try {
            const response = await api.delete(`/customers/favorites/${productId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getFavorites: async () => {
        try {
            const response = await api.get('/customers/favorites');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Profile management
    updateProfile: async (profileData) => {
        try {
            const response = await api.put('/auth/me', profileData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    uploadProfileImage: async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        try {
            const response = await api.post('/auth/profile-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Address management
    addAddress: async (addressData) => {
        try {
            const response = await api.post('/customers/addresses', addressData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    updateAddress: async (addressId, addressData) => {
        try {
            const response = await api.put(`/customers/addresses/${addressId}`, addressData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    deleteAddress: async (addressId) => {
        try {
            const response = await api.delete(`/customers/addresses/${addressId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getAddresses: async () => {
        try {
            const response = await api.get('/customers/addresses');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

// Review API endpoints
export const review = {
    // List reviews for a product
    listByProduct: async (productId) => {
        try {
            const response = await api.get(`/products/${productId}/reviews`);
            return response.data?.data || [];
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Create a review for a product
    create: async (productId, { comment, rating }) => {
        try {
            const response = await api.post(`/products/${productId}/reviews`, { comment, rating });
            return response.data?.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default api;
export { API_BASE_URL };