import axios from 'axios';
import http from './api/http';
import { supabase } from './supabaseClient';
import { getToken, getRefreshToken, removeToken, removeRefreshToken, removeUser, setToken, setRefreshToken } from './utils/tokenUtils';

// Prefer explicit VITE_API_BASE_URL in all modes. If not set:
//  - In dev, fall back to '/api' (Vite proxy)
//  - In prod, fall back to the Render URL
const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV
        ? '/api'
        : 'https://capstonedelibup-o7sl.onrender.com/api')
);

// Simple retry helper for POST with exponential backoff
async function postWithRetry(url, data, config = {}, retries = 2, baseDelayMs = 1500) {
    let attempt = 0;
    // Ensure per-call timeout can override instance default
    const cfg = { timeout: 30000, ...config };
    while (true) {
        try {
            return await api.post(url, data, cfg);
        } catch (error) {
            const status = error.response?.status;
            const isTimeout = error.code === 'ECONNABORTED';
            const isGateway = status === 502 || status === 503 || status === 504;
            const isNetwork = !error.response && !error.request;
            if (attempt < retries && (isTimeout || isGateway || isNetwork)) {
                const delay = baseDelayMs * Math.pow(2, attempt);
                await new Promise(r => setTimeout(r, delay));
                attempt += 1;
                continue;
            }
            throw error;
        }
    }
}

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    // Prevent requests from hanging indefinitely (helps surface errors faster)
    // Note: deployed server (cold starts) may need longer
    timeout: 30000,
});

// Small JWT decoder to inspect exp (no validation)
function decodeJwt(token) {
    try {
        const [, payload] = token.split('.');
        return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch { return null; }
}

let refreshInFlight = null; // single-flight promise

async function refreshAccessTokenIfNeeded() {
    const token = getToken();
    const refreshToken = getRefreshToken();
    if (!token || !refreshToken) return null;
    const decoded = decodeJwt(token);
    const now = Math.floor(Date.now() / 1000);
    const exp = decoded?.exp || 0;
    const secondsLeft = exp - now;
    if (secondsLeft > 30) return null; // not near expiry

    if (!refreshInFlight) {
        refreshInFlight = (async () => {
            const resp = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
            const newAccess = resp.data?.accessToken || resp.data?.token;
            const newRefresh = resp.data?.refreshToken;
            if (!newAccess) throw new Error('Refresh failed: no access token');
            setToken(newAccess, true);
            if (newRefresh) setRefreshToken(newRefresh, true);
            return newAccess;
        })().finally(() => { refreshInFlight = null; });
    }
    return refreshInFlight;
}

// Attach Supabase token to requests (authoritative source)
api.interceptors.request.use(async (config) => {
    // If sending FormData, let axios/browser set proper multipart boundary
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        if (config.headers && config.headers['Content-Type']) delete config.headers['Content-Type'];
    }

    try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (_) {
        // leave request without Authorization; backend will respond 401 if required
    }
    return config;
});

// Simplified response interceptor: do not auto-refresh or redirect here.
// Global auth handling is centralized in src/api/http.js
api.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
);

// Auth API endpoints
export const auth = {
    register: async (userData) => {
        try {
            const response = await postWithRetry('/auth/register', userData, { timeout: 30000 }, 2);
            return response.data;
        } catch (error) {
            const backend = error.response?.data;
            const status = error.response?.status;
            // Collect express-validator errors if present
            let validationMsg = '';
            if (backend?.errors && Array.isArray(backend.errors)) {
                validationMsg = backend.errors.map(e => e.msg || e.message).filter(Boolean).join('\n');
            }
            const message = validationMsg || (backend && (backend.message || backend.error || (typeof backend === 'string' ? backend : null))) || error.message || 'Registration failed';
            // Throw a rich error object so UI can react (e.g., 409 duplicate, isVerified flag)
            throw { message, status, isVerified: backend?.isVerified };
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
        // Always clear client-side session, regardless of server response
        try {
            // Try to notify backend, but don't block UX; use a shorter timeout
            await api.post('/auth/logout', undefined, { timeout: 4000 });
        } catch (_) {
            // Swallow errors/timeouts – client logout should proceed regardless
        } finally {
            try { await supabase.auth.signOut(); } catch (_) {}
            // Ensure Supabase session is really cleared before redirecting
            try {
                const deadline = Date.now() + 1500;
                while (Date.now() < deadline) {
                    const { data } = await supabase.auth.getSession();
                    if (!data?.session) break;
                    await new Promise(r => setTimeout(r, 100));
                }
            } catch (_) {}
            // Hard clear any locally stored auth artifacts
            try { localStorage.removeItem('access_token'); } catch (_) {}
            try { localStorage.removeItem('user_role'); } catch (_) {}
            try { localStorage.removeItem('user_id'); } catch (_) {}
            try { sessionStorage.removeItem('access_token'); } catch (_) {}
            removeToken();
            removeRefreshToken();
            removeUser();
            // Also clear axios default Authorization in case any code cached it
            try { delete api.defaults.headers.common.Authorization; } catch (_) {}
            if (typeof window !== 'undefined') {
                window.location.replace('/login');
            }
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

    // OTP-based password reset
    sendPasswordResetOtp: async (email) => {
        try {
            const response = await api.post('/auth/forgot-password-otp', { email });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    resetPasswordWithOtp: async ({ email, otp, newPassword }) => {
        try {
            const response = await api.post('/auth/reset-password-otp', { email, otp, newPassword });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    resendPasswordResetOtp: async (email) => {
        try {
            const response = await api.post('/auth/resend-password-otp', { email });
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
    },

    // Permanently delete current authenticated user's account and related data
    // Attempts Supabase path if requested; otherwise defaults to legacy path
    deleteAccount: async ({ supabase = false } = {}) => {
        try {
            const url = supabase ? '/auth/supabase/account' : '/auth/account';
            const response = await api.delete(url);
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
            // Backend route: POST /api/products
            const response = await api.post('/products', formData);
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
    },

    // Get seller analytics
    getSellerAnalytics: async () => {
        try {
            const response = await api.get('/products/seller/analytics');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

// Cart API endpoints
export const cart = {
    addToCart: async (productId, quantity, selectedVariantId = null, selectedOptions = null) => {
        try {
            const payload = { productId, quantity };
            if (selectedVariantId) payload.selectedVariantId = selectedVariantId;
            if (selectedOptions) payload.selectedOptions = selectedOptions;
            const response = await http.post('/cart/add', payload);
            return response.data.data.cart;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    viewCart: async () => {
        try {
            const response = await http.get('/cart');
            return response.data.data.cart;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getCartSummary: async () => {
        try {
            const response = await http.get('/cart/summary');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },    removeFromCart: async (productId) => {
        try {
            console.log('Removing product:', productId); // Debug log
            const response = await http.post('/cart/remove', { productId });
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
            const response = await http.delete('/cart/clear');
            return response.data.data.cart;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    updateCartItem: async (productId, quantity) => {
        try {
            const response = await http.put('/cart/update', { productId, quantity });
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
            const response = await http.post('/orders/create-from-cart', orderData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Create direct order (without cart)
    createDirectOrder: async (orderData) => {
        try {
            const response = await http.post('/orders/create-direct', orderData);
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
            const response = await http.get('/orders/seller', { 
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
            const response = await http.get(`/orders/${orderId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Update order status (Seller only)
    updateOrderStatus: async (orderId, statusData) => {
        try {
            const response = await http.patch(`/orders/${orderId}/status`, statusData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Accept order (Seller only)
    acceptOrder: async (orderId, acceptData) => {
        try {
            const response = await http.post(`/orders/${orderId}/accept`, acceptData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Cancel order (Customer only, for pending orders)
    cancelOrder: async (orderId, cancelData = {}) => {
        try {
            const response = await http.post(`/orders/${orderId}/cancel`, cancelData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get customer orders
    getCustomerOrders: async () => {
        try {
            const response = await http.get('/orders/my-orders');
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
            const response = await http.post('/orders/gcash/checkout', { amount, orderId, redirectUrl });
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
            const response = await http.post(`/orders/${orderId}/gcash-manual/proof`, form, {
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
            const response = await http.post(`/orders/${orderId}/gcash-manual/approve`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
    rejectManualGcash: async (orderId, reason) => {
        try {
            const response = await http.post(`/orders/${orderId}/gcash-manual/reject`, { reason });
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
            const response = await http.get('/customers/profile');
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

    // Favorites management (Supabase-authenticated)
    addToFavorites: async (productId, payload = {}) => {
        try {
            // Unified: POST /favorites with body { productId, ...optional }
            const response = await http.post(`/favorites`, { productId, ...payload });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    removeFromFavorites: async (productId, params = {}) => {
        try {
            // Unified: DELETE /favorites/product/:productId (optional ?variantId=)
            const response = await http.delete(`/favorites/product/${productId}`, { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getFavorites: async () => {
        try {
            // Unified: GET /favorites
            const response = await http.get('/favorites');
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
            const response = await http.post('/customers/addresses', addressData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    updateAddress: async (addressId, addressData) => {
        try {
            const response = await http.put(`/customers/addresses/${addressId}`, addressData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    deleteAddress: async (addressId) => {
        try {
            const response = await http.delete(`/customers/addresses/${addressId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getAddresses: async () => {
        try {
            const response = await http.get('/customers/addresses');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

// Chat API endpoints
export const chat = {
  // Get all conversations for the current user
  getConversations: () => http.get('/chat/conversations'),
  
  // Create or fetch a conversation
  createOrFetchConversation: (participantIds, orderId = null) => 
    http.post('/chat/conversations', { participantIds, orderId }),
  
  // Get messages for a conversation
  getMessages: (conversationId) => 
    http.get(`/chat/messages/${conversationId}`),
  
  // Send a message
  sendMessage: (conversationId, text, orderRef = null) => 
    http.post('/chat/messages', { conversationId, text, orderRef }),
  
  // Mark conversation as read
  markAsRead: (conversationId) => 
    http.post(`/chat/conversations/${conversationId}/read`)
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

// Lightweight warmup ping to reduce perceived cold start latency
// Intentionally ignores errors and times out quickly
export const warmup = async () => {
    try {
        // Build backend health URL safely
        const isAbsolute = /^https?:\/\//.test(API_BASE_URL);
        const healthUrl = isAbsolute
            ? (new URL('/health', API_BASE_URL.replace(/\/api$/, ''))).toString()
            : '/api/health'; // dev: rely on Vite proxy
        await axios.get(healthUrl, {
            timeout: 2500,
            params: { _t: Date.now() }
        });
    } catch (e) {
        // ignore any error; goal is to just trigger the server to wake up
    }
};

export default api;
export { API_BASE_URL };