const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://capstonedelibup.onrender.com/api";
import { getToken } from '../utils/tokenUtils';

export const store = {
  // ... existing methods ...
  
  // Add the getSellerProfile method
  async getSellerProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/seller/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch seller profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching seller profile:', error);
      throw error;
    }
  },
  
  // ... other existing methods ...
}; 