/*
  * HomePage
  * -------------------------------------------------------------
  * Main customer landing page. It shows:
  *  - A banner slider of stores (from API, de-duplicated)
  *  - Popular products and the full product grid with filters
  *  - Sticky search bar and filter controls
  *  - Add-to-cart interactions with success feedback modal
  *  - Bottom navigation and a small popup menu (profile, orders, settings, logout)
  *
  * Data flow & caching:
  *  - Cache-first render from localStorage for stores/products
  *  - Fetch fresh data on mount and via debounced background refresh
  *  - Cart count fetched and updated optimistically on add-to-cart
  *
  * Responsiveness:
  *  - Product grid columns auto-adjust with viewport width
  *  - Styled primarily via external CSS + inline styles
  */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdSearch, MdHome, MdFavoriteBorder, MdShoppingCart, MdReceipt, MdPerson, MdFilterList, MdClose, MdMenuOpen, MdSettings, MdLogout, MdStore, MdAddShoppingCart, MdCheckCircle } from 'react-icons/md';
import Slider from 'react-slick';
// Removed react-toastify to avoid popups on the homepage
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { store as storeApi, product as productApi, auth, cart } from '../api';
import '../styles/HomePage.css';
import { getUser } from '../utils/tokenUtils';
import useDebouncedRefresh from '../hooks/useDebouncedRefresh';
import { SkeletonCard } from '../components/Skeletons';

const styles = {
  bannerContainer: {
    padding: '0 1px',
    marginBottom: '5px',
    maxWidth: '100%',
    overflow: 'hidden'
  },
  slide: {
    padding: '0 5px'
  },
  banner: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    height: '180px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease'
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  bannerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)',
    zIndex: 1
  },
  bannerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '20px',
    zIndex: 2,
    color: 'white'
  },
  storeName: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: 'white',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },
  storeDescription: {
    fontSize: '14px',
    margin: '0 0 8px 0',
    opacity: 0.9,
    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
  },
  bottomNav:{
    borderRadius: '29px 29px 0 0',
    boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
  },
  placeholderBanner: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    height: '180px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  }
};

const HomePage = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    // Set responsive grid columns based on viewport width
    const updateGrid = () => {
      const w = window.innerWidth;
      if (w >= 800) {
        setGridCols(4);
        setGridGap(20);
      } else if (w >= 600) {
        setGridCols(3);
        setGridGap(16);
      } else {
        setGridCols(2);
        setGridGap(12);
      }
    };
    updateGrid();
    window.addEventListener('resize', updateGrid);
    return () => window.removeEventListener('resize', updateGrid);
  }, []);

  useEffect(() => {
    // Get user data from localStorage for greeting
    const userData = getUser();
    if (userData && userData.name) {
      setUserName(userData.name);
    } else if (userData && userData.username) {
      setUserName(userData.username);
    }
  }, []);
  const [showFilters, setShowFilters] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all', 
    availability: 'all'
  });
  const [categories, setCategories] = useState(['All']);
  const [cartCount, setCartCount] = useState(0);
  const [successModal, setSuccessModal] = useState({ open: false, message: '' });
  const [gridCols, setGridCols] = useState(2);
  const [gridGap, setGridGap] = useState(12);
  const STORES_CACHE_KEY = 'bufood:stores';
  const PRODUCTS_CACHE_KEY = 'bufood:products';
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Cache-first render from localStorage, then refresh from API
    let hadCache = false;
    try {
      const cachedStores = JSON.parse(localStorage.getItem(STORES_CACHE_KEY) || 'null');
      const cachedProducts = JSON.parse(localStorage.getItem(PRODUCTS_CACHE_KEY) || 'null');
      if (Array.isArray(cachedStores) || Array.isArray(cachedProducts)) {
        hadCache = true;
        if (Array.isArray(cachedStores)) {
          setStores(cachedStores);
        }
        if (Array.isArray(cachedProducts)) {
          setAllProducts(cachedProducts);
          setFilteredProducts(cachedProducts);
          setPopularProducts(cachedProducts.slice(0, 4));
          const uniqueCategories = ['All', ...new Set(
            cachedProducts
              .filter(p => p && p.category)
              .map(p => p.category)
          )];
          setCategories(uniqueCategories);
        }
        // Since we rendered from cache, remove loader immediately
        setLoading(false);
      }
    } catch (_) {}

    // Always fetch fresh data; show loader only if no cache
    fetchData({ showLoader: !hadCache });
    // Fetch initial cart count
    fetchCartCount();
  }, []);

  const fetchCartCount = async () => {
    try {
      const cartData = await cart.viewCart();
      const count = Array.isArray(cartData?.items)
        ? cartData.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        : 0;
      setCartCount(count);
    } catch (e) {
      // silently ignore count errors
      setCartCount(0);
    }
  };

  // Apply filters and search to allProducts
  useEffect(() => {
    let result = [...allProducts];
    
    // Apply search
    if (searchQuery.trim() !== '') {
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.storeName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filters.category !== 'all') {
      result = result.filter(product => 
        product.category?.toLowerCase() === filters.category.toLowerCase()
      );
    }
    
    // Apply price range filter
    if (filters.priceRange !== 'all') {
      switch(filters.priceRange) {
        case 'under50':
          result = result.filter(product => product.price < 50);
          break;
        case '50to100':
          result = result.filter(product => product.price >= 50 && product.price <= 100);
          break;
        case 'over100':
          result = result.filter(product => product.price > 100);
          break;
        default:
          break;
      }
    }
    
    // Apply availability filter
    if (filters.availability !== 'all') {
      result = result.filter(product => 
        product.availability === filters.availability
      );
    }
    
    setFilteredProducts(result);
  }, [searchQuery, filters, allProducts]);

  const fetchData = async ({ showLoader = true } = {}) => {
    // Fetch stores and products concurrently; update caches on success
    if (showLoader) {
      setLoading(true);
    }
    setError(null);

    try {
      // Fire both requests concurrently
      const [storesRes, productsRes] = await Promise.allSettled([
        storeApi.getAllStores(),
        productApi.getAllProducts()
      ]);

      // Handle stores result
      if (storesRes.status === 'fulfilled') {
        const storesData = storesRes.value;
        setStores(storesData || []);
        try {
          localStorage.setItem(STORES_CACHE_KEY, JSON.stringify(storesData || []));
        } catch (_) {}
      } else {
        const storeErr = storesRes.reason;
        console.error('Error fetching stores:', storeErr);
        setStores([]);
        // Prefer not to override an existing error from products if that one also fails
        setError(prev => prev || storeErr?.message || 'Failed to load stores');
      }

      // Handle products result
      if (productsRes.status === 'fulfilled') {
        const allProductsData = productsRes.value;
        setAllProducts(allProductsData || []);
        setFilteredProducts(allProductsData || []);

        // For popular products, take the first 4 products
        setPopularProducts(allProductsData?.slice(0, 4) || []);

        // Extract unique categories
        if (allProductsData && allProductsData.length > 0) {
          const uniqueCategories = ['All', ...new Set(
            allProductsData
              .filter(product => product.category)
              .map(product => product.category)
          )];
          setCategories(uniqueCategories);
        }
        try {
          localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(allProductsData || []));
        } catch (_) {}
      } else {
        const productErr = productsRes.reason;
        console.error('Error fetching products:', productErr);
        setAllProducts([]);
        setFilteredProducts([]);
        setPopularProducts([]);
        setError(prev => prev || productErr?.message || 'Failed to load products');
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  // Debounced background refresh on focus/visibility/interval
  useDebouncedRefresh(async () => {
    setIsRefreshing(true);
    try {
      await fetchData({ showLoader: false });
      await fetchCartCount();
    } finally {
      setIsRefreshing(false);
    }
  }, { delayMs: 600, intervalMs: 30000 });

  const handleAddToCart = async (product) => {
    // Add single unit to cart; show short success modal and bump badge
    try {
      await cart.addToCart(product._id, 1);
      // Show success modal message
      setSuccessModal({ open: true, message: 'Product added to cart successfully' });
      // Auto-close the modal after a short delay
      setTimeout(() => setSuccessModal({ open: false, message: '' }), 1200);
      // Update cart badge count
      setCartCount((prev) => (Number.isFinite(prev) ? prev + 1 : 1));
     } catch (err) {
               const errorMessage = err.message || err.error || 'Failed to add product to cart';
               console.error('Add to cart error:', errorMessage, err);
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          arrows: false
        }
      }
    ]
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters({
      ...filters,
      [filterType]: value
    });
  };
  const handleLogout = async () => {
    try {
      setIsMenuOpen(false);
      await auth.logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const handleProductClick = (productId) => {
    // Navigate to product details
    navigate(`/customer/product/${productId}`);
  };

  const handleStoreClick = (storeId) => {
    // Navigate to store details
    navigate(`/customer/store/${storeId}`);
  };

  const formatPeakTimes = (peak) => {
    if (!peak) return '';
    if (Array.isArray(peak)) {
      const segments = peak
        .map(seg => {
          if (typeof seg === 'string') return seg;
          if (typeof seg === 'number') {
            const hour = String(seg).padStart(2, '0');
            return `${hour}:00`;
          }
          if (seg && typeof seg === 'object') {
            const start = seg.start ?? seg.from ?? seg.begin;
            const end = seg.end ?? seg.to ?? seg.finish;
            const fmt = (v) => typeof v === 'number' ? `${String(v).padStart(2, '0')}:00` : v;
            if (start != null && end != null) return `${fmt(start)}-${fmt(end)}`;
          }
          return null;
        })
        .filter(Boolean);
      return segments.join(', ');
    }
    if (typeof peak === 'number') {
      return `${String(peak).padStart(2, '0')}:00`;
    }
    if (typeof peak === 'object') {
      const start = peak.start ?? peak.from;
      const end = peak.end ?? peak.to;
      const fmt = (v) => typeof v === 'number' ? `${String(v).padStart(2, '0')}:00` : v;
      if (start != null && end != null) {
        return `${fmt(start)}-${fmt(end)}`;
      }
    }
    return String(peak);
  };

  const dedupedStores = useMemo(() => {
    const seen = new Set();
    return stores.filter(store => {
      if (seen.has(store._id)) return false;
      seen.add(store._id);
      return true;
    });
  }, [stores]);

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (error) {
    return (
      <div className="errorContainer">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button 
          className="retryButton"
          onClick={fetchData}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="pageContainer">
      {/* Success Modal */}
      {successModal.open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.25)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setSuccessModal({ open: false, message: '' })}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              padding: '22px 28px',
              minWidth: 260,
              maxWidth: '90vw',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              alignItems: 'center'
            }}
          >
            <MdCheckCircle size={44} color="#2E7D32" />
            <div style={{ fontSize: 16, fontWeight: 600, color: '#2E7D32', marginTop: 6 }}>
              {successModal.message || 'Success'}
            </div>
          </div>
        </div>
      )}
      <div className="mainContainer">
        {/* Header */}
        <div className="header">
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }} className="greeting">
              <span style={{ color: '#666' }}>Hello, </span>
              <span style={{ color: '#FF7A00' }}>{userName}</span>
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#777', fontSize: 13 }} className="subGreeting">What do you want to eat today?</p>
          </div>
          <button 
            className="menuToggle" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <MdMenuOpen size={24} />
          </button>
          
          {isMenuOpen && (
            <div className="popupMenu">
              <div className="menuItem" onClick={() => navigate('/customer/profile')}>
                <MdPerson className="menuIcon" />
                Profile
              </div>
              <div className="menuItem" onClick={() => navigate('/customer/view-my-order')}>
                <MdStore className="menuIcon" />
                My Orders
              </div>
              <div className="menuItem" onClick={() => navigate('/customer/settings')}>
                <MdSettings className="menuIcon" />
                Settings
              </div>
              <div className="menuItem" onClick={handleLogout}>
                <MdLogout className="menuIcon" />
                Logout
              </div>
            </div>
          )}
        </div>

        {/* Search Bar - Fixed at the top */}
        <div className="searchContainer" style={{ position: 'sticky', right: '10px', top: 0, zIndex: 10, backgroundColor: '#ffffff', padding: '8px 6px' }}>
          <div className="searchBar" style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center', background: '#f5f5f5', borderRadius: 12, padding: '10px 12px' }}>
            <MdSearch size={20} color="#999999" />
            <input 
              type="text" 
              placeholder="Search" 
              className="searchInput"
              value={searchQuery}
              onChange={handleSearch}
            />
            {searchQuery && (
              <MdClose 
                size={18} 
                color="#999999" 
                onClick={clearSearch}
                className="clearSearchIcon"
              />
            )}
          </div>
          <div className="filterButton" onClick={toggleFilters} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FF7A00', borderRadius: '50%' }}>
            <MdFilterList size={22} color="#fff" />
          </div>
          {/* Auto-refresh enabled; manual refresh button removed */}
        </div>

        {/* Main Scrollable Content */}
        <div className="scrollableContent" style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '80px', // Space for bottom navigation
          marginTop: '10px'
        }}>
          {/* Filter Panel */}
          {showFilters && (
            <div className="filterPanel">
              <div className="filterSection">
                <h3 className="filterTitle">Category</h3>
                <div className="categoryFilters">
                  {categories.map(category => (
                    <button 
                      key={category}
                      className={
                        `categoryButton${filters.category === category.toLowerCase() ? ' activeCategory' : ''}`
                      }
                      style={{
                        backgroundColor: filters.category === category.toLowerCase() ? '#ff8c00' : '#f0f0f0',
                        color: filters.category === category.toLowerCase() ? 'white' : '#333'
                      }}
                      onClick={() => handleFilterChange('category', category.toLowerCase())}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="filterSection">
                <h3 className="filterTitle">Price Range</h3>
                <select 
                  className="filterSelect"
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                >
                  <option value="all">All Prices</option>
                  <option value="under50">Under ₱50</option>
                  <option value="50to100">₱50 - ₱100</option>
                  <option value="over100">Over ₱100</option>
                </select>
              </div>
              
              <div className="filterSection">
                <h3 className="filterTitle">Availability</h3>
                <select 
                  className="filterSelect"
                  value={filters.availability}
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="Available">Available</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>
          )}

          {/* Banner/Promotional Slider */}
          <div style={{ ...styles.bannerContainer }}>
            {dedupedStores.length > 0 ? (
              <Slider {...sliderSettings}>
                {dedupedStores.map(store => (
                  <div key={store._id} style={styles.slide}>
                    <div 
                      style={{
                        ...styles.banner,
                        height: '28vw',
                        minHeight: 140,
                        maxHeight: 240
                      }}
                      onClick={() => handleStoreClick(store._id)}
                    >
                      <img 
                        src={store.bannerImage || 'https://i.ibb.co/qkGWKQX/pizza-promotion.jpg'} 
                        alt={store.storeName} 
                        style={styles.bannerImage}
                        loading="lazy"
                      />
                      <div style={styles.bannerGradient}></div>
                      <div style={styles.bannerContent}>
                        <div>
                          <h2 style={styles.storeName}>{store.storeName}</h2>
                          {store.description && (
                            <p style={styles.storeDescription}>{store.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            ) : (
              <div style={{ ...styles.placeholderBanner, height: '28vw', minHeight: 140, maxHeight: 240 }}>
                <img 
                  src="https://i.ibb.co/qkGWKQX/pizza-promotion.jpg" 
                  alt="Welcome to BuFood" 
                  style={styles.bannerImage}
                  loading="lazy"
                />
                <div style={styles.bannerGradient}></div>
                <div style={styles.bannerContent}>
                  <div>
                    <h2 style={styles.storeName}>Welcome to BuFood</h2>
                    <p style={styles.storeDescription}>No stores available at the moment.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Popular Section */}
          <div className="sectionContainer">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className="sectionTitle" style={{ margin: 0 }}>Popular</h2>
              <button onClick={() => {
                const el = document.getElementById('all-products');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }} style={{ background: 'transparent', border: 'none', color: '#FF7A00', fontWeight: 600, cursor: 'pointer' }}>See All</button>
            </div>
            
            <div className="productsGrid" style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap: gridGap }}>
              {isRefreshing && popularProducts.length > 0 && (
                Array.from({ length: Math.min(4, popularProducts.length) }).map((_, i) => (
                  <SkeletonCard key={`skeleton-pop-${i}`} height={260} />
                ))
              )}
              {popularProducts.length > 0 ? (
                popularProducts.slice(0, 4).map(product => (
                  <div 
                    key={product._id || Math.random()} 
                    className="productCard"
                    onClick={() => handleProductClick(product._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="productImageContainer" style={{ position: 'relative' }}>
                      <img 
                        src={product.image || 'https://i.ibb.co/YZDGnfr/chicken-rice.jpg'} 
                        alt={product.name || 'Chicken With Rice'} 
                        className="productImage"
                        style={{ filter: product.availability === 'Out of Stock' ? 'blur(1.5px) grayscale(60%) brightness(0.85)' : 'none', transition: 'filter 0.2s ease' }}
                        loading="lazy"
                      />
                      {product.availability === 'Out of Stock' && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.05rem', pointerEvents: 'none' }}>
                          Out of Stock
                        </div>
                      )}
                    </div>
                    <div className="productInfo">
                      <h3 className="productName">{product.name || 'Chicken With Rice'}</h3>
                      {Number.isFinite(product.soldCount) && (
                        <div style={{ fontSize: '12px', color: '#777', marginTop: 2 }}>Sold: {product.soldCount}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <span style={{ fontSize: 12, color: product.availability === 'Out of Stock' ? '#9e9e9e' : '#2e7d32', background: '#f2f2f2', borderRadius: 10, padding: '2px 8px' }}>
                          {product.availability === 'Out of Stock' ? 'Out of Stock' : 'Available'}
                        </span>
                      </div>
                      <div className="productPriceRow">
                        <p className="productPrice">₱{product.price || '49'}</p>
                        <button 
                          className="addButton"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={product.availability === 'Out of Stock'}
                          style={{
                            backgroundColor: product.availability === 'Out of Stock' ? '#ccc' : undefined,
                            cursor: product.availability === 'Out of Stock' ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '35px',
                            height: '35px',
                            borderRadius: '50%',
                            padding: '0'
                          }}
                        >
                          {product.availability === 'Out of Stock' ? (
                            <MdClose size={18} />
                          ) : (
                            <MdAddShoppingCart size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Fallback sample products if API data is not available
                [
                  { id: 1, name: 'Chicken With Rice', storeName: 'Store Name', price: 49, image: 'https://i.ibb.co/YZDGnfr/chicken-rice.jpg' },
                  { id: 2, name: 'Fries Buy 1 Take 2', storeName: 'Store Name', price: 50, image: 'https://i.ibb.co/4PYspP4/fries.jpg' },
                  { id: 3, name: 'Milktea Medium', storeName: 'Store Name', price: 69, image: 'https://i.ibb.co/S7qRBBz/milktea.jpg' },
                  { id: 4, name: 'Beef Cheesy Burger', storeName: 'Store Name', price: 49, image: 'https://i.ibb.co/GFqYQZg/burger.jpg' }
                ].map(product => (
                  <div key={product.id} className="productCard">
                    <div className="productImageContainer">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="productImage"
                        loading="lazy"
                      />
                    </div>
                    <div className="productInfo">
                      <h3 className="productName">{product.name}</h3>
                      <p className="storeName">{product.storeName}</p>
                      <div className="productPriceRow">
                        <p className="productPrice">₱{product.price}</p>
                        <button 
                          className="addButton"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* All Products Section */}
          <div className="sectionContainer" id="all-products">
            <h2 className="sectionTitle">
              {searchQuery ? `Results for "${searchQuery}"` : "All Foods"}
            </h2>
            
            {filteredProducts.length > 0 ? (
              <div className="productsGrid" style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap: gridGap }}>
                {isRefreshing && filteredProducts.length > 0 && (
                  Array.from({ length: Math.min(8, filteredProducts.length) }).map((_, i) => (
                    <SkeletonCard key={`skeleton-all-${i}`} height={260} />
                  ))
                )}
                {filteredProducts.map(product => (
                  <div 
                    key={product._id || Math.random()} 
                    className="productCard"
                    onClick={() => handleProductClick(product._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="productImageContainer" style={{ position: 'relative' }}>
                      <img 
                        src={product.image || 'https://i.ibb.co/YZDGnfr/chicken-rice.jpg'} 
                        alt={product.name || 'Product'} 
                        className="productImage"
                        style={{ filter: product.availability === 'Out of Stock' ? 'blur(1.5px) grayscale(60%) brightness(0.85)' : 'none', transition: 'filter 0.2s ease' }}
                        loading="lazy"
                      />
                      {product.availability === 'Out of Stock' && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.05rem', pointerEvents: 'none' }}>
                          Out of Stock
                        </div>
                      )}
                    </div>
                    <div className="productInfo">
                      <h3 className="productName">{product.name || 'Product Name'}</h3>
                      {Number.isFinite(product.soldCount) && (
                        <div style={{ fontSize: '12px', color: '#777', marginTop: 2 }}>Sold: {product.soldCount}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <span style={{ fontSize: 12, color: product.availability === 'Out of Stock' ? '#9e9e9e' : '#2e7d32', background: '#f2f2f2', borderRadius: 10, padding: '2px 8px' }}>
                          {product.availability === 'Out of Stock' ? 'Out of Stock' : 'Available'}
                        </span>
                      </div>
                      <div className="productPriceRow">
                        <p className="productPrice">₱{product.price || '0'}</p>
                        <button 
                          className="addButton"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={product.availability === 'Out of Stock'}
                          style={{
                            backgroundColor: product.availability === 'Out of Stock' ? '#ccc' : undefined,
                            cursor: product.availability === 'Out of Stock' ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '35px',
                            height: '35px',
                            borderRadius: '50%',
                            padding: '0'
                          }}
                        >
                          {product.availability === 'Out of Stock' ? (
                            <MdClose size={18} />
                          ) : (
                            <MdAddShoppingCart size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="noResults">
                <p>No products found. Try a different search or filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>      {/* Bottom Navigation */}
      <div className="bottomNav" style={styles.bottomNav}>
        <div className={"navItem activeNavItem"} onClick={() => navigate('/customer/home')}>
          <MdHome size={24} className="activeNavIcon" />
          <span className="navText">Home</span>
        </div>
        <div className="navItem" onClick={() => navigate('/customer/favorites')}>
          <MdFavoriteBorder size={24} />
          <span className="navText">Favorites</span>
        </div>
        <div className="navItem" onClick={() => navigate('/customer/cart')} style={{ position: 'relative' }}>
          <MdShoppingCart size={24} />
          {cartCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 2,
                right: 16,
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 8,
                backgroundColor: '#ff3b30',
                color: '#fff',
                fontSize: 10,
                lineHeight: '16px',
                textAlign: 'center',
                fontWeight: 700,
                boxShadow: '0 0 0 2px #fff'
              }}
            >
              {cartCount}
            </span>
          )}
          <span className="navText">Cart</span>
        </div>
        <div className="navItem" onClick={() => navigate('/customer/stores')}>
          <MdStore size={24} />
          <span className="navText">Stores</span>
        </div>
        <div className="navItem" onClick={() => navigate('/customer/profile')}>
          <MdPerson size={24} />
          <span className="navText">Profile</span>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
