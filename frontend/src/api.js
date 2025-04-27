import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'; // Fallback to localhost

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
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

        // If the error is not 401 or the request was for token refresh, reject the promise
        if (error.response?.status !== 401 || originalRequest.url === '/auth/refresh-token') {
            return Promise.reject(error);
        }

        try {
            // Try to refresh the token
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                refreshToken
            });

            const { accessToken, refreshToken: newRefreshToken } = response.data;

            // Update stored tokens
            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);

            // Update the failed request's authorization header and retry it
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axios(originalRequest);
        } catch (refreshError) {
            // If refresh fails, clear tokens and reject the promise
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            return Promise.reject(refreshError);
        }
    }
);

// Auth API endpoints
export const auth = {
    // Register new user
    register: async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            if (response.data.accessToken) {
                localStorage.setItem('token', response.data.accessToken);
                localStorage.setItem('refreshToken', response.data.refreshToken);
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Login user
    login: async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response.data.accessToken) {
                localStorage.setItem('token', response.data.accessToken);
                localStorage.setItem('refreshToken', response.data.refreshToken);
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Verify email with token
    verifyEmail: async (token) => {
        try {
            const response = await api.get(`/auth/verify/${token}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get current user profile
    getMe: async () => {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Resend verification email
    resendVerification: async () => {
        try {
            const response = await api.post('/auth/resend-verification');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Check email verification status
    checkVerification: async () => {
        try {
            const response = await api.post('/auth/check-verification');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Utility function to check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    // Utility function to logout (clear tokens)
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
    }
};

// Store API endpoints
export const store = {
    // Get seller's own store
    getMyStore: async () => {
        try {
            const response = await api.get('/store/my-store');
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
            const response = await api.get(`/store/${storeId}`);
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
            const response = await api.post('/products', formData, {
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
            const response = await api.get('/products/seller/products');
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
            const response = await api.get(`/products/${productId}`);
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
            
            const response = await api.put(`/products/${productId}`, formData, {
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
            const response = await api.delete(`/products/${productId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

// Cart API endpoints
export const cart = {
    // Add to cart
    addToCart: async (productId, quantity) => {
        try {
            const response = await api.post('/cart/add', { productId, quantity });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // View cart
    viewCart: async () => {
        try {
            const response = await api.get('/cart');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Remove item from cart
    removeFromCart: async (productId) => {
        try {
            const response = await api.delete('/cart/remove', { data: { productId } });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Clear cart
    clearCart: async () => {
        try {
            const response = await api.delete('/cart/clear');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Update cart item quantity
    updateCartItem: async (productId, quantity) => {
        try {
            const response = await api.patch('/cart/update', { productId, quantity });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

// Order API endpoints
export const order = {
    // Checkout from cart
    checkoutFromCart: async () => {
        try {
            const response = await api.post('/orders/checkout-cart');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Checkout from product (direct purchase)
    checkoutFromProduct: async (productId, quantity) => {
        try {
            const response = await api.post('/orders/checkout-from-product', {
                productId,
                quantity
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Place order
    placeOrder: async (orderId, orderData) => {
        try {
            const response = await api.post(`/orders/place-order/${orderId}`, orderData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get customer orders
    getCustomerOrders: async () => {
        try {
            const response = await api.get('/orders/customer');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get seller's placed orders
    getSellerOrders: async () => {
        try {
            const response = await api.get('/orders/seller/placed');
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

    // Cancel order (customer)
    cancelOrderByCustomer: async (orderId) => {
        try {
            const response = await api.patch(`/orders/cancel-by-customer/${orderId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Update order status (seller)
    updateOrderStatus: async (orderId, action, status) => {
        try {
            const response = await api.patch(`/orders/seller/manage/${orderId}`, {
                action,
                status
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

// Customer API endpoints
export const customer = {
    // Get customer profile
    getProfile: async () => {
        try {
            const response = await api.get('/customers/profile');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get all stores
    getAllStores: async () => {
        try {
            const response = await api.get('/customers/stores');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // View specific store
    viewStore: async (storeId) => {
        try {
            const response = await api.get(`/customers/store/${storeId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default api;