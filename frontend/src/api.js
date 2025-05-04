import axios from 'axios';

// Try to get the API URL from different sources with fallbacks
const API_BASE_URL = 'http://localhost:8000/api';

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

        if (error.response?.status !== 401 || originalRequest.url === '/auth/refresh-token') {
            return Promise.reject(error);
        }

        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                refreshToken
            });

            if (response.data.accessToken) {
                localStorage.setItem('token', response.data.accessToken);
                api.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
                return api(originalRequest);
            }
        } catch (err) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
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
            if (response.data.accessToken) {
                localStorage.setItem('token', response.data.accessToken);
                localStorage.setItem('refreshToken', response.data.refreshToken);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
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
export const cart = {
    addToCart: async (productId, quantity) => {
        try {
            const response = await api.post('/cart/add', { productId, quantity });
            return response.data.data.cart;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    viewCart: async () => {
        try {
            const response = await api.get('/cart/view');
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
    },

    removeFromCart: async (productId) => {
        try {
            const response = await api.post('/cart/remove', { productId });
            return response.data.data.cart;
        } catch (error) {
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
    checkoutFromCart: async () => {
        try {
            const response = await api.post('/orders/checkout-cart');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

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

    placeOrder: async (orderId, orderData) => {
        try {
            const response = await api.post(`/orders/place-order/${orderId}`, orderData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getCustomerOrders: async () => {
        try {
            const response = await api.get('/orders/customer');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getSellerOrders: async () => {
        try {
            const response = await api.get('/orders/seller/placed');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getOrderDetails: async (orderId) => {
        try {
            const response = await api.get(`/orders/${orderId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    cancelOrderByCustomer: async (orderId) => {
        try {
            const response = await api.patch(`/orders/cancel-by-customer/${orderId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

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
    }
};

export default api;