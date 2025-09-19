/*
 * API wrapper (src/api/index.js)
 * -------------------------------------------------------------
 * App flow role:
 *  - Centralizes HTTP calls with a single base URL selection:
 *      dev => relative '/api' (Vite proxy), prod => VITE_API_BASE_URL fallback.
 *  - Reads auth token via `getToken()` to attach Authorization headers
 *    for endpoints that require authentication.
 *  - Pages/modules import domain groups (e.g., `store`, `product`, `cart`)
 *    and call their methods instead of using fetch directly.
 */
import { getToken } from '../utils/tokenUtils';
// Use relative base in dev to leverage Vite proxy and avoid CORS
const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || 'https://capstonedelibup-o7sl.onrender.com/api');

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