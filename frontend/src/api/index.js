export const store = {
  // ... existing methods ...
  
  // Add the getSellerProfile method
  async getSellerProfile() {
    try {
      const response = await fetch('/api/seller/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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