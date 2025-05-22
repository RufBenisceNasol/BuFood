import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { product as productApi } from '../api';
import './FavoritesPage.css';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  ShoppingCart,
  Delete,
  Info,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';
import { 
  getAllFavorites, 
  toggleFavorite, 
  getAllStoreFavorites, 
  toggleStoreFavorite, 
  isStoreInFavorites 
} from '../utils/favoriteUtils';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [favoriteStores, setFavoriteStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
    loadFavoriteStores();
  }, []);

  useEffect(() => {
    setFilteredProducts(
      favorites.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    setFilteredStores(
      favoriteStores.filter(store =>
        store.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, favorites, favoriteStores]);

  const loadFavorites = () => {
    try {
      setLoading(true);
      const favoriteIds = getAllFavorites();
      if (favoriteIds.length > 0) {
        fetchFavoriteProducts(favoriteIds);
      } else {
        setFavorites([]);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Failed to load favorites');
      setLoading(false);
    }
  };

  const fetchFavoriteProducts = async (favoriteIds) => {
    try {
      const allProducts = await productApi.getAllProducts();
      if (allProducts && allProducts.length > 0) {
        const favoriteProducts = allProducts.filter(product => 
          favoriteIds.includes(product._id)
        );
        setFavorites(favoriteProducts);
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error('Error fetching favorite products:', err);
      setError('Failed to load favorite products');
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteStores = () => {
    try {
      const storeIds = getAllStoreFavorites();
      // Note: This is a placeholder. In a real implementation, you would 
      // fetch store details from the API using these IDs
      // For now we're just loading from localStorage
      const stored = JSON.parse(localStorage.getItem('favoriteStores') || '[]');
      setFavoriteStores(stored);
    } catch (err) {
      console.error('Error loading favorite stores:', err);
      setFavoriteStores([]);
    }
  };

  const handleGoBack = () => {
    navigate('/customer/home');
  };

  const handleViewProduct = (productId) => {
    navigate(`/customer/product/${productId}`);
  };

  const handleAddToCart = (product) => {
    try {
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItemIndex = existingCart.findIndex(item => item.id === product._id);
      if (existingItemIndex >= 0) {
        existingCart[existingItemIndex].quantity += 1;
      } else {
        existingCart.push({
          id: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          storeName: product.storeName,
          quantity: 1
        });
      }
      localStorage.setItem('cart', JSON.stringify(existingCart));
      alert(`${product.name} added to cart!`);
    } catch (error) {
      console.error('Error adding product to cart:', error);
      alert('Failed to add product to cart. Please try again.');
    }
  };

  const handleRemoveFavorite = (productId) => {
    toggleFavorite(productId);
    setFavorites(prev => prev.filter(product => product._id !== productId));
    alert('Product removed from favorites!');
  };

  const handleRemoveStoreFavorite = (storeId) => {
    // Remove from favorites list
    const isNowFavorite = toggleStoreFavorite(storeId);
    
    // Update UI state
    setFavoriteStores(prev => prev.filter(store => store.id !== storeId));

    // Update localStorage
    try {
      const storedFavorites = JSON.parse(localStorage.getItem('favoriteStores') || '[]');
      const updatedFavorites = storedFavorites.filter(store => store.id !== storeId);
      localStorage.setItem('favoriteStores', JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error updating favorite stores:', error);
    }
  };

  const handleViewStore = (storeId) => {
    navigate(`/customer/store/${storeId}`);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  if (loading) {
    return (
      <div className="favorites-loading">
        <CircularProgress sx={{ color: '#FF8C00' }} />
      </div>
    );
  }

  return (
    <div className="favorites-container">
      <div className="favorites-header">
        <IconButton 
          onClick={handleGoBack}
          className="favorites-back-btn"
        >
          <ArrowBack />
        </IconButton>
        <h1 className="favorites-title">FAVORITES</h1>
      </div>

      {/* Search Bar */}
      <div className="favorites-search-bar">
        <span className="favorites-search-icon">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15.5 15.5L19 19" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round"/><circle cx="11" cy="11" r="7" stroke="#BDBDBD" strokeWidth="2"/></svg>
        </span>
        <input
          type="text"
          placeholder="Search Store"
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {/* Tabs */}
      <div className="favorites-tabs">
        <button
          className={`favorites-tab${activeTab === 'products' ? ' favorites-tab-active' : ''}`}
          onClick={() => handleTabChange('products')}
        >
          Products
        </button>
        <button
          className={`favorites-tab${activeTab === 'stores' ? ' favorites-tab-active' : ''}`}
          onClick={() => handleTabChange('stores')}
        >
          Stores
        </button>
      </div>

      {error && <div className="favorites-alert">{error}</div>}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="favorites-grid">
          {filteredProducts.length === 0 ? (
            <div className="favorites-empty">
              <Info className="favorites-info-icon" />
              <div className="favorites-empty-text">
                You don't have any favorite products yet.
              </div>
              <button 
                className="favorites-browse-btn"
                onClick={() => navigate('/customer/home')}
              >
                Browse Products
              </button>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div className="favorites-card" key={product._id}>
                <img
                  className="favorites-card-media"
                  src={product.image || 'https://placehold.co/600x400/orange/white?text=Product'}
                  alt={product.name}
                  onClick={() => handleViewProduct(product._id)}
                />
                <div className="favorites-card-content">
                  <div
                    className="favorites-card-title"
                    onClick={() => handleViewProduct(product._id)}
                  >
                    {product.name}
                  </div>
                  {product.storeName && (
                    <div className="favorites-card-store">
                      {product.storeName}
                    </div>
                  )}
                  <div className="favorites-card-price">
                    ₱{product.price?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="favorites-card-actions">
                  <button
                    className="favorites-add-btn"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart style={{ marginRight: 6, fontSize: 18 }} /> Add to Cart
                  </button>
                  <button
                    className="favorites-delete-btn"
                    onClick={() => handleRemoveFavorite(product._id)}
                  >
                    <Delete style={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Stores Tab */}
      {activeTab === 'stores' && (
        <div className="favorites-store-list">
          {filteredStores.length === 0 ? (
            <div className="favorites-empty">
              <Info className="favorites-info-icon" />
              <div className="favorites-empty-text">
                You don't have any favorite stores yet.
              </div>
            </div>
          ) : (
            filteredStores.map(store => (
              <div className="favorites-store-card" key={store.id} onClick={() => handleViewStore(store.id)}>
                <img 
                  className="favorites-store-img" 
                  src={store.image} 
                  alt={store.name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200/f0f0f0/cccccc?text=Store';
                  }}
                />
                <div className="favorites-store-info">
                  <span className="favorites-store-name">{store.name}</span>
                  {store.description && (
                    <span className="favorites-store-description">{store.description}</span>
                  )}
                </div>
                <button
                  className="favorites-store-heart"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveStoreFavorite(store.id);
                  }}
                  aria-label="Remove from favorites"
                >
                  <Favorite style={{ color: '#FF8C00', fontSize: 22 }} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;