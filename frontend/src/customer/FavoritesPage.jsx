import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { product as productApi, cart, store as storeApi } from '../api';
import styled, { keyframes } from 'styled-components';
import {
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  ArrowBack,
  ShoppingCart,
  Delete,
  Info,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';
import { FiRefreshCw } from 'react-icons/fi';
import { 
  getAllFavorites, 
  toggleFavorite, 
  getAllStoreFavorites, 
  toggleStoreFavorite, 
  isStoreInFavorites 
} from '../utils/favoriteUtils';
import { MdHome, MdFavoriteBorder, MdShoppingCart, MdStore, MdPerson, MdCheckCircle } from 'react-icons/md';

const styles = {
  bottomNav: {
    borderRadius: '29px 29px 0 0',
    boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
  }
};

// Styled Components
const PageContainer = styled.div`
  background-color: rgb(255, 255, 255);
  height: 100vh;
  height: 100dvh;
  width: 100vw;
  max-width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overscroll-behavior-y: none;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  padding-bottom: 20px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
    transition: background 0.3s ease;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  
  scrollbar-width: thin;
  scrollbar-color: #888 #f1f1f1;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 15px;
  background: #ffffff;
  position: relative;
  min-height: 100%;
`;

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [favoriteStores, setFavoriteStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [successModal, setSuccessModal] = useState({ open: false, message: '' });
  const navigate = useNavigate();
  const FAVORITES_CACHE_KEY = 'bufood:favorites';
  const FAVORITE_STORES_CACHE_KEY = 'bufood:favorite_stores';
  const PRODUCTS_CACHE_KEY = 'bufood:products';
  const STORES_CACHE_KEY = 'bufood:stores';
  const refreshTimerRef = useRef(null);
  const refreshingRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    loadFavorites();
    loadFavoriteStores();
  };

  useEffect(() => {
    // Cache-first render
    let hadCache = false;
    try {
      const cachedFavorites = JSON.parse(localStorage.getItem(FAVORITES_CACHE_KEY) || 'null');
      const cachedStores = JSON.parse(localStorage.getItem(FAVORITE_STORES_CACHE_KEY) || 'null');
      if (Array.isArray(cachedFavorites) || Array.isArray(cachedStores)) {
        hadCache = true;
        if (Array.isArray(cachedFavorites)) setFavorites(cachedFavorites);
        if (Array.isArray(cachedStores)) setFavoriteStores(cachedStores);
        setLoading(false);
      }
    } catch (_) {}

    // Always fetch fresh data; show loader only if no cache
    if (!hadCache) setLoading(true);
    loadFavorites({ showLoader: !hadCache });
    loadFavoriteStores({ showLoader: !hadCache });
    fetchCartCount();
  }, []);

  // Debounced background refresh on interval/focus/visibility
  useEffect(() => {
    const doRefresh = async () => {
      if (refreshingRef.current) return;
      refreshingRef.current = true;
      setIsRefreshing(true);
      try {
        // background refresh without loader
        await Promise.all([
          (async () => loadFavorites({ showLoader: false }))(),
          (async () => loadFavoriteStores({ showLoader: false }))(),
          (async () => fetchCartCount())(),
        ]);
      } finally {
        setIsRefreshing(false);
        refreshingRef.current = false;
      }
    };

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        doRefresh();
      }, 600);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) scheduleRefresh();
    };
    const handleFocus = () => {
      scheduleRefresh();
    };

    const intervalId = setInterval(scheduleRefresh, 30000);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchCartCount = async () => {
    try {
      const cartData = await cart.viewCart();
      const count = Array.isArray(cartData?.items)
        ? cartData.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        : 0;
      setCartCount(count);
    } catch (e) {
      // silently ignore errors to avoid UI disruption
    }
  };

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

  const loadFavorites = ({ showLoader = true } = {}) => {
    try {
      if (showLoader) setLoading(true);
      const favoriteIds = getAllFavorites();
      if (favoriteIds.length > 0) {
        fetchFavoriteProducts(favoriteIds, { showLoader });
      } else {
        setFavorites([]);
        if (showLoader) setLoading(false);
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Failed to load favorites');
      if (showLoader) setLoading(false);
    }
  };

  const fetchFavoriteProducts = async (favoriteIds, { showLoader = true } = {}) => {
    try {
      // Prefer cached products from Home if available to avoid extra API calls
      let allProducts = null;
      try {
        const cached = JSON.parse(localStorage.getItem(PRODUCTS_CACHE_KEY) || 'null');
        if (Array.isArray(cached)) allProducts = cached;
      } catch (_) {}
      if (!Array.isArray(allProducts)) {
        allProducts = await productApi.getAllProducts();
      }
      if (allProducts && allProducts.length > 0) {
        const favoriteProducts = allProducts.filter(product => 
          favoriteIds.includes(product._id)
        );
        setFavorites(favoriteProducts);
        try { localStorage.setItem(FAVORITES_CACHE_KEY, JSON.stringify(favoriteProducts)); } catch (_) {}
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error('Error fetching favorite products:', err);
      setError('Failed to load favorite products');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const loadFavoriteStores = async ({ showLoader = true } = {}) => {
    try {
      const storeIds = getAllStoreFavorites();
      if (!storeIds || storeIds.length === 0) {
        setFavoriteStores([]);
        return;
      }
      // Try to reuse cached stores from Home to avoid per-ID calls
      let cachedStores = null;
      try {
        const raw = JSON.parse(localStorage.getItem(STORES_CACHE_KEY) || 'null');
        if (Array.isArray(raw)) cachedStores = raw;
      } catch (_) {}

      let results = [];
      if (Array.isArray(cachedStores) && cachedStores.length > 0) {
        const setIds = new Set(storeIds);
        results = cachedStores
          .filter(s => setIds.has(s._id))
          .map(s => ({
            id: s._id,
            name: s.storeName || s.name || 'Store',
            image: s.image || s.logo || s.bannerImage || 'https://via.placeholder.com/300x200/f0f0f0/cccccc?text=Store',
            description: s.description || ''
          }));
        // For any remaining IDs not in cache, fetch individually
        const missing = storeIds.filter(id => !results.find(r => r.id === id));
        if (missing.length > 0) {
          const fetched = await Promise.all(missing.map(async (sid) => {
            try {
              const data = await storeApi.getStoreById(sid);
              return {
                id: data._id || sid,
                name: data.storeName || data.name || 'Store',
                image: data.image || data.logo || 'https://via.placeholder.com/300x200/f0f0f0/cccccc?text=Store',
                description: data.description || ''
              };
            } catch (e) {
              return { id: sid, name: 'Store', image: 'https://via.placeholder.com/300x200/f0f0f0/cccccc?text=Store', description: '' };
            }
          }));
          results = [...results, ...fetched];
        }
      } else {
        // Fallback: Fetch details for each store ID
        results = await Promise.all(
          storeIds.map(async (sid) => {
            try {
              const data = await storeApi.getStoreById(sid);
              return {
                id: data._id || sid,
                name: data.storeName || data.name || 'Store',
                image: data.image || data.logo || 'https://via.placeholder.com/300x200/f0f0f0/cccccc?text=Store',
                description: data.description || ''
              };
            } catch (e) {
              // If a store fetch fails, still return an entry so UI remains consistent
              return { id: sid, name: 'Store', image: 'https://via.placeholder.com/300x200/f0f0f0/cccccc?text=Store', description: '' };
            }
          })
        );
      }
      setFavoriteStores(results);
      try { localStorage.setItem(FAVORITE_STORES_CACHE_KEY, JSON.stringify(results)); } catch (_) {}
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

  const handleAddToCart = async (product) => {
    try {
      await cart.addToCart(product._id, 1);
      // Optimistically update badge
      setCartCount(prev => (Number.isFinite(prev) ? prev + 1 : 1));
      // Show success modal
      setSuccessModal({ open: true, message: 'Product added to cart successfully' });
      setTimeout(() => setSuccessModal({ open: false, message: '' }), 1200);
    } catch (error) {
      console.error('Error adding product to cart:', error);
      alert('Failed to add product to cart. Please try again.');
      // Attempt to refresh count in case of mismatch
      fetchCartCount();
    }
  };

  const handleRemoveFavorite = (productId) => {
    toggleFavorite(productId);
    setFavorites(prev => prev.filter(product => product._id !== productId));
    setSuccessModal({ open: true, message: 'Product removed from favorites' });
    setTimeout(() => setSuccessModal({ open: false, message: '' }), 1200);
  };

  const handleRemoveStoreFavorite = async (storeId) => {
    // Toggle favorite off and refresh the list from IDs
    toggleStoreFavorite(storeId);
    await loadFavoriteStores();
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
      <LoadingContainer>
        <CircularProgress sx={{ color: '#FF8C00' }} />
      </LoadingContainer>
    );
  }

  return (
    <PageContainer>
      {/* Success Modal */}
      {successModal.open && (
        <div
          onClick={() => setSuccessModal({ open: false, message: '' })}
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
      <Header>
        <BackButton onClick={handleGoBack}>
          <ArrowBack />
        </BackButton>
        <Title>Favorites</Title>
        <RefreshButton
          aria-label="Refresh"
          onClick={handleRefresh}
          disabled={loading}
          tabIndex={0}
        >
          <FiRefreshCw
            size={20}
            color={loading ? '#ff9800' : 'white'}
            className={loading ? 'spin' : ''}
            aria-hidden="true"
          />
        </RefreshButton>
      </Header>
      <ScrollableContent>
        <ContentWrapper>
          <div style={{ height: '60px' }} /> {/* Spacer for fixed header */}

          <SearchBar>
            <SearchIcon>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path d="M15.5 15.5L19 19" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="11" cy="11" r="7" stroke="#BDBDBD" strokeWidth="2"/>
              </svg>
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search Store"
              value={searchQuery}
              onChange={handleSearch}
            />
          </SearchBar>

          <Tabs>
            <Tab 
              $active={activeTab === 'products'}
              onClick={() => handleTabChange('products')}
            >
              Products
            </Tab>
            <Tab 
              $active={activeTab === 'stores'}
              onClick={() => handleTabChange('stores')}
            >
              Stores
            </Tab>
          </Tabs>

          {error && <AlertStyled>{error}</AlertStyled>}

          {activeTab === 'products' && (
            <GridContainer>
              {isRefreshing && filteredProducts.length > 0 && (
                Array.from({ length: Math.min(4, filteredProducts.length) }).map((_, i) => (
                  <div key={`skeleton-prod-${i}`} style={{ background: '#f6f6f6', borderRadius: 12, height: 260, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} />
                ))
              )}
              {filteredProducts.length === 0 ? (
                <EmptyState>
                  <InfoIcon />
                  <EmptyText>
                    You don't have any favorite products yet.
                  </EmptyText>
                  <BrowseButton onClick={() => navigate('/customer/home')}>
                    Browse Products
                  </BrowseButton>
                </EmptyState>
              ) : (
                filteredProducts.map(product => (
                  <ProductCard key={product._id}>
                    <ProductImage 
                      src={product.image || 'https://placehold.co/600x400/orange/white?text=Product'}
                      alt={product.name}
                      onClick={() => handleViewProduct(product._id)}
                      loading="lazy"
                    />
                    <ProductContent>
                      <ProductTitle onClick={() => handleViewProduct(product._id)}>
                        {product.name}
                      </ProductTitle>
                      {product.storeName && (
                        <StoreName>
                          {product.storeName}
                        </StoreName>
                      )}
                      <Price>
                        ₱{product.price?.toFixed(2) || '0.00'}
                      </Price>
                    </ProductContent>
                    <ProductActions>
                      <AddButton onClick={() => handleAddToCart(product)}>
                        <ShoppingCart style={{ marginRight: 6, fontSize: 18 }} /> Add to Cart
                      </AddButton>
                      <DeleteButton onClick={() => handleRemoveFavorite(product._id)}>
                        <Delete style={{ fontSize: 18 }} />
                      </DeleteButton>
                    </ProductActions>
                  </ProductCard>
                ))
              )}
            </GridContainer>
          )}

          {activeTab === 'stores' && (
            <StoreList>
              {isRefreshing && filteredStores.length > 0 && (
                Array.from({ length: Math.min(3, filteredStores.length) }).map((_, i) => (
                  <div key={`skeleton-store-${i}`} style={{ background: '#f6f6f6', borderRadius: 12, height: 88, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} />
                ))
              )}
              {filteredStores.length === 0 ? (
                <EmptyState>
                  <InfoIcon />
                  <EmptyText>
                    You don't have any favorite stores yet.
                  </EmptyText>
                </EmptyState>
              ) : (
                filteredStores.map(store => (
                  <StoreCard key={store.id} onClick={() => handleViewStore(store.id)}>
                    <StoreImage 
                      src={store.image}
                      alt={store.name}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200/f0f0f0/cccccc?text=Store';
                      }}
                    />
                    <StoreInfo>
                      <StoreName>{store.name}</StoreName>
                      {store.description && (
                        <StoreDescription>{store.description}</StoreDescription>
                      )}
                    </StoreInfo>
                    <HeartButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveStoreFavorite(store.id);
                      }}
                      aria-label="Remove from favorites"
                    >
                      <Favorite style={{ color: '#FF8C00', fontSize: 22 }} />
                    </HeartButton>
                  </StoreCard>
                ))
              )}
            </StoreList>
          )}
        </ContentWrapper>
      </ScrollableContent>
      {/* Bottom Navigation */}
      <div className="bottomNav" style={styles.bottomNav}>
        <div className="navItem" onClick={() => navigate('/customer/home')}>
          <MdHome size={24} />
          <span className="navText">Home</span>
        </div>
        <div className="navItem activeNavItem" onClick={() => navigate('/customer/favorites')}>
          <MdFavoriteBorder size={24} className="activeNavIcon" />
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
    </PageContainer>
  );
};

// Styled Components

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

const Header = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #ff8c00e0;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 1px;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: white;
  padding: 8px;
  margin-right: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Title = styled.span`
  font-size: 1.2rem;
  font-weight: 500;
  color: white;
`;

const SearchBar = styled.div`
  position: relative;
  margin: 16px 24px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 8px 1px;
`;

const SearchIcon = styled.span`
  margin-right: 8px;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  width: 100%;
  padding: 8px 0;
  font-size: 1rem;
  outline: none;

  &::placeholder {
    color: #9e9e9e;
  }
`;

const Tabs = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: 12px;
  margin: 0 24px 18px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
`;

const Tab = styled.button`
  background: none;
  border: none;
  padding: 8px 16px;
  font-size: 1rem;
  font-weight: 500;
  color: ${props => props.$active ? '#FF8C00' : '#757575'};
  cursor: pointer;
  position: relative;
  transition: color 0.2s;

  &::after {
    content: '';
    position: absolute;
    bottom: -9px;
    left: 0;
    width: 100%;
    height: 2px;
    background: ${props => props.$active ? '#FF8C00' : 'transparent'};
    transition: background 0.2s;
  }
`;

const AlertStyled = styled.div`
  margin: 0 24px 24px;
  color: #d32f2f;
  background: #fdecea;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 1rem;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 0 0 24px;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const ProductCard = styled.div`
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s, box-shadow 0.3s;
  overflow: hidden;
  height: 100%;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }
`;

const ProductImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  cursor: pointer;
`;

const ProductContent = styled.div`
  flex-grow: 1;
  padding: 18px;
  display: flex;
  flex-direction: column;
`;

const ProductTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover {
    color: #FF8C00;
  }
`;

const StoreName = styled.div`
  font-size: 0.95rem;
  color: #757575;
  margin-bottom: 8px;
`;

const Price = styled.div`
  font-size: 1.15rem;
  color: #FF8C00;
  font-weight: bold;
  margin-top: auto;
`;

const ProductActions = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 18px 18px;
  border-top: 1px solid #f0f0f0;
  gap: 8px;
`;

const AddButton = styled.button`
  background: #FF8C00;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background 0.2s;
  flex-grow: 1;
  justify-content: center;
  
  &:hover {
    background: #E67E00;
  }
`;

const DeleteButton = styled.button`
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d32f2f;
  transition: background 0.2s;
  
  &:hover {
    background: #f5f5f5;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  grid-column: 1 / -1;
  text-align: center;
`;

const InfoIcon = styled(Info)`
  font-size: 64px !important;
  color: #bdbdbd;
  margin-bottom: 16px;
`;

const EmptyText = styled.div`
  font-size: 1.1rem;
  color: #757575;
  margin-bottom: 24px;
`;

const BrowseButton = styled.button`
  background: #FF8C00;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #E67E00;
  }
`;

const StoreList = styled.div`
  padding: 0 0 24px;
`;

const StoreCard = styled.div`
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
`;

const StoreImage = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  margin-right: 16px;
`;

const StoreInfo = styled.div`
  flex: 1;
`;

const StoreDescription = styled.span`
  display: block;
  font-size: 0.9rem;
  color: #757575;
  margin-top: 4px;
`;

const HeartButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const RefreshButton = styled.button`
  background: none;
  border: none;
  color: white;
  padding: 8px;
  margin-left: auto;
  margin-right: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  transition: background 0.2s;
  position: absolute;
  right: 8px;
  top: 10px;
  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
  .spin {
    animation: ${spin} 1s linear infinite;
  }
`;

export default FavoritesPage;