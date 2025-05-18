import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StoreDetailPage.css';
import ErrorBoundary from '../components/ErrorBoundary';
import { isStoreInFavorites, toggleStoreFavorite } from '../utils/favoriteUtils';

const StoreDetailPage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('Products');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (storeId) {
      setIsFavorite(isStoreInFavorites(storeId));
    }
  }, [storeId]);

  useEffect(() => {
    const fetchStoreDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Fetching store with ID:', storeId);
        
        // API base URL
        const API_BASE_URL = 'http://localhost:8000/api';
        
        // Get auth token if available
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // Fetch store details directly
        const storeResponse = await axios.get(`${API_BASE_URL}/store/view/${storeId}`, { headers });
        console.log('Store data received:', storeResponse.data);
        
        if (!storeResponse.data) {
          throw new Error('Store not found');
        }
        setStore(storeResponse.data);
        
        console.log('Fetching products for store ID:', storeId);
        // Fetch products directly
        const productsResponse = await axios.get(`${API_BASE_URL}/store/${storeId}/products`, { headers });
        console.log('Products data received:', productsResponse.data);
        
        // Ensure we have an array of products and sort them
        let products = Array.isArray(productsResponse.data) ? productsResponse.data : [];
        if (productsResponse.data && typeof productsResponse.data === 'object' && productsResponse.data.products) {
          products = productsResponse.data.products;
        }
        
        // Sort products by availability (Available first)
        const sortedProducts = products.sort((a, b) => {
          if (a.availability === 'Available' && b.availability !== 'Available') return -1;
          if (a.availability !== 'Available' && b.availability === 'Available') return 1;
          return 0;
        });
        
        console.log('Sorted products:', sortedProducts);
        setProducts(sortedProducts);
      } catch (err) {
        console.error('Error fetching store details:', err);
        setError(err.response?.data?.message || 'Failed to load store data');
      } finally {
        setIsLoading(false);
      }
    };

    if (storeId) {
      fetchStoreDetails();
    }
  }, [storeId]);

  const handleBuy = (product) => {
    // Navigate to product detail page
    navigate(`/customer/product/${product._id}`);
  };

  const handleKeyDown = (event, product) => {
    // Handle keyboard navigation for product cards
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleBuy(product);
    }
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isNowFavorite = toggleStoreFavorite(storeId);
    setIsFavorite(isNowFavorite);

    // Update stored favorite stores list
    try {
      const storedFavorites = JSON.parse(localStorage.getItem('favoriteStores') || '[]');
      
      if (isNowFavorite) {
        // Add store to favorites if not already present
        if (!storedFavorites.find(s => s.id === storeId)) {
          storedFavorites.push({
            id: storeId,
            name: store.storeName,
            image: store.image || defaultStoreImage,
            description: store.description,
            bannerImage: store.bannerImage || defaultBannerImage
          });
        }
      } else {
        // Remove store from favorites
        const index = storedFavorites.findIndex(s => s.id === storeId);
        if (index !== -1) {
          storedFavorites.splice(index, 1);
        }
      }
      
      localStorage.setItem('favoriteStores', JSON.stringify(storedFavorites));
    } catch (error) {
      console.error('Error updating favorite stores:', error);
    }
  };

  if (isLoading) {
    return (
      <main className="loading-state" aria-live="polite" aria-busy="true">
        <div className="loader" aria-hidden="true"></div>
        <p>Loading store details...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="error-state" aria-live="polite">
        <p role="alert">{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </main>
    );
  }

  if (!store) {
    return (
      <main className="error-state" aria-live="polite">
        <p role="alert">Store not found</p>
        <button onClick={() => navigate('/customer/stores')}>Back to Stores</button>
      </main>
    );
  }

  const defaultBannerImage = 'https://via.placeholder.com/1200x300/f5f5f5/cccccc?text=No+Banner+Image';
  const defaultStoreImage = 'https://via.placeholder.com/80x80/e0e0e0/999999?text=Store';

  return (
    <ErrorBoundary>
      <div className="store-detail-wrapper">
        <main className="store-detail-container">
          <div className="content-wrapper">
            <header 
              className="store-banner" 
              style={{ backgroundImage: `url(${store.bannerImage || defaultBannerImage})` }}
              role="banner" 
              aria-label={`${store.storeName} banner`}
            >
              <div className="store-header">
                <div className="store-info">
                  <img 
                    src={store.image || defaultStoreImage} 
                    alt={`${store.storeName} logo`} 
                    className="store-image" 
                  />
                  <div className="store-text">
                    <h1>{store.storeName}</h1>
                    {store.description && (
                      <p className="store-description">{store.description}</p>
                    )}
                    <button 
                      className={`favorite-button ${isFavorite ? 'active' : ''}`}
                      onClick={handleFavoriteClick}
                      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <i className="heart-icon" aria-hidden="true">
                        {isFavorite ? '♥' : '♡'}
                      </i>
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <div className="store-nav">
              <div className="store-nav-content">
                <button 
                  className={activeTab === 'Products' ? 'active' : ''} 
                  onClick={() => setActiveTab('Products')}
                  aria-pressed={activeTab === 'Products'}
                  aria-label="View all products"
                >
                  All Products
                </button>
                <button 
                  className={activeTab === 'Categories' ? 'active' : ''} 
                  onClick={() => setActiveTab('Categories')}
                  aria-pressed={activeTab === 'Categories'}
                  aria-label="View by categories"
                >
                  Categories
                </button>
              </div>
            </div>

            <section 
              className="products-section"
              aria-labelledby="products-heading"
            >
              <h2 id="products-heading" className="sr-only">Store Products</h2>
              
              <div 
                className="products-grid" 
                role="list"
                aria-label="Products"
              >
                {products.length > 0 ? (
                  products.map((product) => (
                    <div 
                      key={product._id} 
                      className={`product-card ${product.availability.toLowerCase().replace(' ', '-')}`}
                      onClick={() => handleBuy(product)}
                      onKeyDown={(e) => handleKeyDown(e, product)}
                      tabIndex="0"
                      role="listitem"
                      aria-label={`${product.name}, ${product.price.toFixed(2)} pesos, ${product.availability}`}
                    >
                      <div className="product-image-container">
                        <img 
                          src={product.image || 'https://via.placeholder.com/300x200/f0f0f0/cccccc?text=No+Image'} 
                          alt={product.name} 
                          className="product-image" 
                        />
                        {product.availability !== 'Available' && (
                          <div className="out-of-stock-overlay" aria-hidden="true">
                            <span>Out of Stock</span>
                          </div>
                        )}
                      </div>
                      <div className="product-info">
                        <h3 className="product-name">{product.name}</h3>
                        {product.description && (
                          <p className="product-description">{product.description}</p>
                        )}
                        <div className="product-price">
                          <span className="current-price" aria-label={`Price: ${product.price.toFixed(2)} pesos`}>
                            ₱{product.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="product-details">
                          <div className="product-meta">
                            <span 
                              className={`availability ${product.availability.toLowerCase().replace(' ', '-')}`}
                              aria-label={`Availability: ${product.availability}`}
                            >
                              {product.availability}
                            </span>
                            {product.category && (
                              <span className="category" aria-label={`Category: ${product.category}`}>
                                {product.category}
                              </span>
                            )}
                          </div>
                          {product.estimatedTime && (
                            <span className="estimated-time" aria-label={`Preparation time: ${product.estimatedTime} minutes`}>
                              <i className="time-icon" aria-hidden="true">⏱</i> {product.estimatedTime} mins prep time
                            </span>
                          )}
                        </div>
                        <button 
                          className={`buy-button ${product.availability !== 'Available' ? 'disabled' : ''}`}
                          disabled={product.availability !== 'Available'}
                          aria-disabled={product.availability !== 'Available'}
                        >
                          {product.availability === 'Available' ? 'View Details' : 'Out of Stock'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-products" role="status">
                    <p>No products available in this store yet</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default StoreDetailPage;