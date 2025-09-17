/*
 * favoriteUtils
 * -------------------------------------------------------------
 * App flow role:
 *  - Pages call these helpers to read/write favorite IDs in localStorage
 *    for both products and stores.
 *  - UI pages (e.g., Home, Favorites, Store/Product pages) then resolve
 *    the stored IDs against cached/all data from the API to render cards.
 *  - This keeps favorites fast (localStorage) while actual product/store
 *    data is fetched or reused from cache separately.
 */
/**
 * Utility functions for managing product favorites in localStorage
 */

/**
 * Check if a product is in the user's favorites
 * @param {string} productId - The ID of the product to check
 * @returns {boolean} - True if the product is in favorites, false otherwise
 */
export const isInFavorites = (productId) => {
  try {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites.includes(productId);
  } catch (error) {
    console.error('Error checking if product is in favorites:', error);
    return false;
  }
};

/**
 * Add or remove a product from favorites
 * @param {string} productId - The ID of the product to toggle
 * @returns {boolean} - True if product was added, false if removed
 */
export const toggleFavorite = (productId) => {
  try {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.indexOf(productId);
    
    if (index === -1) {
      // Add to favorites
      favorites.push(productId);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      return true;
    } else {
      // Remove from favorites
      favorites.splice(index, 1);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      return false;
    }
  } catch (error) {
    console.error('Error toggling product favorite status:', error);
    return false;
  }
};

/**
 * Get all favorite product IDs
 * @returns {string[]} - Array of product IDs
 */
export const getAllFavorites = () => {
  try {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

/**
 * Check if favorites exist
 * @returns {boolean} - True if user has any favorites
 */
export const hasFavorites = () => {
  try {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites.length > 0;
  } catch (error) {
    console.error('Error checking if favorites exist:', error);
    return false;
  }
};

/**
 * Check if a store is in the user's favorites
 * @param {string} storeId - The ID of the store to check
 * @returns {boolean} - True if the store is in favorites, false otherwise
 */
export const isStoreInFavorites = (storeId) => {
  try {
    const storeFavorites = JSON.parse(localStorage.getItem('storeFavorites') || '[]');
    return storeFavorites.includes(storeId);
  } catch (error) {
    console.error('Error checking if store is in favorites:', error);
    return false;
  }
};

/**
 * Add or remove a store from favorites
 * @param {string} storeId - The ID of the store to toggle
 * @returns {boolean} - True if store was added, false if removed
 */
export const toggleStoreFavorite = (storeId) => {
  try {
    const storeFavorites = JSON.parse(localStorage.getItem('storeFavorites') || '[]');
    const index = storeFavorites.indexOf(storeId);
    
    if (index === -1) {
      // Add to favorites
      storeFavorites.push(storeId);
      localStorage.setItem('storeFavorites', JSON.stringify(storeFavorites));
      return true;
    } else {
      // Remove from favorites
      storeFavorites.splice(index, 1);
      localStorage.setItem('storeFavorites', JSON.stringify(storeFavorites));
      return false;
    }
  } catch (error) {
    console.error('Error toggling store favorite status:', error);
    return false;
  }
};

/**
 * Get all favorite store IDs
 * @returns {string[]} - Array of store IDs
 */
export const getAllStoreFavorites = () => {
  try {
    return JSON.parse(localStorage.getItem('storeFavorites') || '[]');
  } catch (error) {
    console.error('Error getting store favorites:', error);
    return [];
  }
};