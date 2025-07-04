// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Order Configuration
export const ORDER_TYPES = {
    DELIVERY: 'Delivery',
    PICKUP: 'Pickup'
};

export const ORDER_STATUS = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    PREPARING: 'Preparing',
    READY: 'Ready',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    READY_FOR_PICKUP: 'Ready for Pickup',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    REJECTED: 'Rejected'
};

export const PAYMENT_METHODS = {
    CASH_ON_DELIVERY: 'Cash on Delivery',
    GCASH: 'GCash',
    CASH_ON_PICKUP: 'Cash on Pickup'
};

// Time slot configuration
export const TIME_SLOT_INTERVAL = 30; // minutes
export const BUSINESS_HOURS = {
    start: '08:00',
    end: '20:00'
};

// Delivery configuration
export const DEFAULT_DELIVERY_RADIUS = 5; // kilometers
export const BASE_DELIVERY_FEE = 50;
export const PER_KM_FEE = 10;

// Group order configuration
export const MAX_GROUP_ORDER_PARTICIPANTS = 10;
export const GROUP_ORDER_EXPIRY = 24; // hours

// Bulk order configuration
export const MIN_BULK_ORDER_QUANTITY = 10;
export const BULK_ORDER_DISCOUNT = 0.1; // 10% discount

// Recurring order configuration
export const RECURRING_ORDER_FREQUENCIES = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly'
};

// Cache configuration
export const CACHE_DURATION = {
    DELIVERY_ZONES: 24 * 60 * 60 * 1000, // 24 hours
    TIME_SLOTS: 5 * 60 * 1000, // 5 minutes
    TEMPLATES: 12 * 60 * 60 * 1000 // 12 hours
}; 