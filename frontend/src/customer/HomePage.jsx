import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdSearch, MdHome, MdFavoriteBorder, MdShoppingCart, MdReceipt, MdPerson, MdFilterList, MdClose, MdMenuOpen, MdSettings, MdLogout, MdStore, MdAddShoppingCart } from 'react-icons/md';
import { FiRefreshCw } from 'react-icons/fi';
import Slider from 'react-slick';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { store as storeApi, product as productApi, auth, cart } from '../api';
import '../styles/HomePage.css';
import { getUser } from '../utils/tokenUtils';

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
    // Get user data from local storage
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

  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters and search
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

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch stores data
      try {
        const storesData = await storeApi.getAllStores();
        setStores(storesData || []);
      } catch (storeErr) {
        console.error('Error fetching stores:', storeErr);
        setError(storeErr.message || 'Failed to load stores');
        setStores([]);
      }

      // Fetch all products
      try {
        const allProductsData = await productApi.getAllProducts();
        setAllProducts(allProductsData || []);
        setFilteredProducts(allProductsData || []);
        
        // For popular products, take the first 4 products
        setPopularProducts(allProductsData?.slice(0, 4) || []);

        // Extract unique categories
        if (allProductsData && allProductsData.length > 0) {
          const uniqueCategories = ['All', ...new Set(allProductsData
            .filter(product => product.category)
            .map(product => product.category))];
          setCategories(uniqueCategories);
        }
      } catch (productErr) {
        console.error('Error fetching products:', productErr);
        setError(productErr.message || 'Failed to load products');
        setAllProducts([]);
        setFilteredProducts([]);
        setPopularProducts([]);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await cart.addToCart(product._id, 1);
      // Show success message
      toast.success('Product added to cart successfully');
     } catch (err) {
                const errorMessage = err.message || err.error || 'Failed to add product to cart';
                toast.error(errorMessage);
                console.error('Add to cart error:', err);
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
  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  const handleProductClick = (productId) => {
    navigate(`/customer/product/${productId}`);
  };

  const handleStoreClick = (storeId) => {
    navigate(`/customer/store/${storeId}`);
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
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="mainContainer">
        {/* Header */}
        <div className="header">
          <div>
            <h1 style={{marginRight: '27px'}} className="greeting">Hello, {userName}</h1>
            <p style={{marginLeft: '20px'}} className="subGreeting">What do you want to eat today?</p>
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
        <div className="searchContainer" style={{ position: 'sticky', right: '10px', top: 0, zIndex: 10, backgroundColor: ' #faf9f9', padding: '6px' }}>
          <div className="searchBar">
            <MdSearch size={24} color=" #999999" />
            <input 
              type="text" 
              placeholder="Search" 
              className="searchInput"
              value={searchQuery}
              onChange={handleSearch}
            />
            {searchQuery && (
              <MdClose 
                size={20} 
                color=" #999999" 
                onClick={clearSearch}
                className="clearSearchIcon"
              />
            )}
          </div>
          <div className="filterButton" onClick={toggleFilters} style={{ width: '33px', height: '33px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdFilterList size={24} color="#fff" />
          </div>
          <button
            className="refreshButton"
            aria-label="Refresh"
            onClick={fetchData}
            disabled={loading}
            style={{
              background: '#ff9800',
              border: 'none',
              padding: 0,
              marginLeft: '0px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              borderRadius: '50%',
              width: '33px',
              height: '33px',
              position: 'relative',
            }}
            tabIndex={0}
          >
            <FiRefreshCw
              size={20}
              color={loading ? ' #ff9800' : 'rgba(255, 255, 255, 0.85)'}
              className={loading ? 'spin' : ''}
              aria-hidden="true"
            />
          </button>
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
          <div style={styles.bannerContainer}>
            {dedupedStores.length > 0 ? (
              <Slider {...sliderSettings}>
                {dedupedStores.map(store => (
                  <div key={store._id} style={styles.slide}>
                    <div 
                      style={styles.banner}
                      onClick={() => handleStoreClick(store._id)}
                    >
                      <img 
                        src={store.bannerImage || 'https://i.ibb.co/qkGWKQX/pizza-promotion.jpg'} 
                        alt={store.storeName} 
                        style={styles.bannerImage}
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
              <div style={styles.placeholderBanner}>
                <img 
                  src="https://i.ibb.co/qkGWKQX/pizza-promotion.jpg" 
                  alt="Welcome to BuFood" 
                  style={styles.bannerImage}
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
            <h2 className="sectionTitle">Popular</h2>
            
            <div className="productsGrid">
              {popularProducts.length > 0 ? (
                popularProducts.slice(0, 4).map(product => (
                  <div 
                    key={product._id || Math.random()} 
                    className="productCard"
                    onClick={() => handleProductClick(product._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="productImageContainer">
                      <img 
                        src={product.image || 'https://i.ibb.co/YZDGnfr/chicken-rice.jpg'} 
                        alt={product.name || 'Chicken With Rice'} 
                        className="productImage"
                      />
                    </div>
                    <div className="productInfo">
                      <h3 className="productName">{product.name || 'Chicken With Rice'}</h3>
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
          <div className="sectionContainer">
            <h2 className="sectionTitle">
              {searchQuery ? `Results for "${searchQuery}"` : "All Foods"}
            </h2>
            
            {filteredProducts.length > 0 ? (
              <div className="productsGrid">
                {filteredProducts.map(product => (
                  <div 
                    key={product._id || Math.random()} 
                    className="productCard"
                    onClick={() => handleProductClick(product._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="productImageContainer">
                      <img 
                        src={product.image || 'https://i.ibb.co/YZDGnfr/chicken-rice.jpg'} 
                        alt={product.name || 'Product'} 
                        className="productImage"
                      />
                    </div>
                    <div className="productInfo">
                      <h3 className="productName">{product.name || 'Product Name'}</h3>
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
      <div className="bottomNav">
        <div className={"navItem activeNavItem"} onClick={() => navigate('/customer/home')}>
          <MdHome size={24} className="activeNavIcon" />
          <span className="navText">Home</span>
        </div>
        <div className="navItem" onClick={() => navigate('/customer/favorites')}>
          <MdFavoriteBorder size={24} />
          <span className="navText">Favorites</span>
        </div>
        <div className="navItem" onClick={() => navigate('/customer/cart')}>
          <MdShoppingCart size={24} />
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
