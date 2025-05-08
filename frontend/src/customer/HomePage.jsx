import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdSearch, MdHome, MdFavoriteBorder, MdShoppingCart, MdReceipt, MdPerson, MdFilterList, MdClose, MdMenuOpen, MdSettings, MdLogout, MdStore } from 'react-icons/md';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { store as storeApi, product as productApi, auth } from '../api';
import '../styles/HomePage.css';

const styles = {
  bannerContainer: {
    padding: '0 16px',
    marginBottom: '20px',
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

  const handleAddToCart = (product) => {
    try {
      // Get existing cart from localStorage
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      // Check if product is already in cart
      const existingItemIndex = existingCart.findIndex(item => item.id === product._id);
      
      if (existingItemIndex >= 0) {
        // If product exists, increment quantity
        existingCart[existingItemIndex].quantity += 1;
      } else {
        // Otherwise add new product to cart
        existingCart.push({
          id: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          storeName: product.storeName,
          quantity: 1
        });
      }
      
      // Save updated cart to localStorage
      localStorage.setItem('cart', JSON.stringify(existingCart));
      
      // Provide feedback to user
      alert(`${product.name} added to cart!`);
    } catch (error) {
      console.error('Error adding product to cart:', error);
      alert('Failed to add product to cart. Please try again.');
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

  const navigateTo = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

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
      <div className="mainContainer">
        {/* Header */}
        <div className="header">
          <div>
            <h1 className="greeting">Hello, {userName}</h1>
            <p className="subGreeting">What do you want to eat today?</p>
          </div>
          <button 
            className="menuToggle" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <MdMenuOpen size={24} />
          </button>
          
          {isMenuOpen && (
            <div className="popupMenu">
              <div className="menuItem" onClick={() => navigateTo('/customer/profile')}>
                <MdPerson className="menuIcon" />
                Profile
              </div>
              <div className="menuItem" onClick={() => navigateTo('/stores')}>
                <MdStore className="menuIcon" />
                Stores
              </div>
              <div className="menuItem" onClick={() => navigateTo('/settings')}>
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

        {/* Search Bar */}
        <div className="searchContainer">
          <div className="searchBar">
            <MdSearch size={24} color="#999" />
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
                color="#999" 
                onClick={clearSearch}
                className="clearSearchIcon"
              />
            )}
          </div>
          <div className="filterButton" onClick={toggleFilters}>
            <MdFilterList size={24} color="#fff" />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="scrollableContent">
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
            {stores.length > 0 ? (
              <Slider {...sliderSettings}>
                {stores.map(store => (
                  <div key={store._id} style={styles.slide}>
                    <div 
                      style={styles.banner}
                      onClick={() => navigate(`/store/${store._id}`)}
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
                    onClick={() => navigate(`/customer/product/${product._id}`)}
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
                      <p className="storeName">{product.storeName || 'Store Name'}</p>
                      <div className="productPriceRow">
                        <p className="productPrice">₱{product.price || '49'}</p>
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
                    onClick={() => navigate(`/customer/product/${product._id}`)}
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
                      <p className="storeName">{product.storeName || 'Store Name'}</p>
                      <div className="productPriceRow">
                        <p className="productPrice">₱{product.price || '0'}</p>
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
                ))}
              </div>
            ) : (
              <div className="noResults">
                <p>No products found. Try a different search or filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bottomNav">
        <div className={"navItem activeNavItem"} onClick={() => navigateTo('/customer/home')}>
          <MdHome size={24} className="activeNavIcon" />
          <span className="navText">Home</span>
        </div>
        <div className="navItem" onClick={() => navigateTo('/favorites')}>
          <MdFavoriteBorder size={24} />
          <span className="navText">Favorites</span>
        </div>
        <div className="navItem" onClick={() => navigateTo('/customer/cart')}>
          <MdShoppingCart size={24} />
          <span className="navText">Cart</span>
        </div>
        <div className="navItem" onClick={() => navigateTo('/stores')}>
          <MdStore size={24} />
          <span className="navText">Stores</span>
        </div>
        <div className="navItem" onClick={() => navigateTo('/customer/profile')}>
          <MdPerson size={24} />
          <span className="navText">Profile</span>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
