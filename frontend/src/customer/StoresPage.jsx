import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { store as storeApi, cart } from '../api';
import styled, { keyframes } from 'styled-components';
import {
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  Search,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';
import { FiRefreshCw } from 'react-icons/fi';
import { MdHome, MdFavoriteBorder, MdShoppingCart, MdStore, MdPerson } from 'react-icons/md';

const styles = {
  bottomNav: {
    borderRadius: '29px 29px 0 0',
    boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
  }
};
// Styled Components
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

const PageContainer = styled.div`
  background-color: #ffffff;
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

const Header = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #ff8c00e0;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 1100;
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

const HeaderTitle = styled.span`
  font-size: 1.2rem;
  font-weight: 500;
`;

const ToolbarSpacer = styled.div`
  height: 60px;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  padding: 16px 0 20px;
  
  /* Custom scrollbar for WebKit browsers */
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
  
  /* Firefox scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #888 #f1f1f1;
`;

const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background: white;
  padding: 2px 4px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 16px;
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  padding: 10px;
  font-size: 1rem;
  outline: none;
  margin-left: 8px;
`;

const StoresGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 16px 0;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StoreCard = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
  height: 100%;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 8px 20px rgba(255, 140, 0, 0.2);
  }
`;

const StoreImage = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
`;

const StoreContent = styled.div`
  padding: 16px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const StoreName = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 8px 0;
  color: #333;
  font-size: 1.25rem;
  font-weight: 600;
  width: 100%;
`;

const StoreNameText = styled.h2`
  margin: 0;
  flex-grow: 1;
`;

const FavoriteButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff4081;
  
  &:hover {
    opacity: 0.8;
  }
  
  &:focus {
    outline: none;
  }
`;

const StoreDescription = styled.p`
  font-size: 0.875rem;
  color: #666;
  margin: 0 0 12px 0;
  flex-grow: 1;
`;

const StoreRating = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const RatingText = styled.span`
  font-size: 0.875rem;
  margin-left: 8px;
  color: #666;
`;

const StoreLocation = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  
  svg {
    color: #FF5722;
    margin-right: 4px;
    font-size: 1rem;
  }
  
  span {
    font-size: 0.875rem;
    color: #666;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
`;

const Tag = styled.span`
  background: rgba(255, 140, 0, 0.1);
  color: #FF8C00;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
`;

const StoresPage = () => {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteStores, setFavoriteStores] = useState(new Set());
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStores();
    fetchCartCount();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStores(stores);
    } else {
      const filtered = stores.filter(store => 
        store.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredStores(filtered);
    }
  }, [searchQuery, stores]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const storesData = await storeApi.getAllStores();
      setStores(storesData || []);
      setFilteredStores(storesData || []);
      setError('');
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError('Failed to load stores. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/customer/home');
  };

  const navigateToStore = (storeId) => {
    navigate(`/customer/store/${storeId}`);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const fetchCartCount = async () => {
    try {
      const cartData = await cart.viewCart();
      const count = Array.isArray(cartData?.items)
        ? cartData.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        : 0;
      setCartCount(count);
    } catch (e) {
      // silently ignore errors
    }
  };

  useEffect(() => {
    const refreshCartSilently = () => {
      fetchCartCount();
    };

    const intervalId = setInterval(refreshCartSilently, 30000);
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshCartSilently();
      }
    };
    const handleFocus = () => {
      refreshCartSilently();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#fff'
      }}>
        <CircularProgress style={{ color: '#FF8C00' }} />
      </div>
    );
  }

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={handleGoBack}>
          <ArrowBack />
        </BackButton>
        <HeaderTitle>Explore Stores</HeaderTitle>
        <RefreshButton
          aria-label="Refresh"
          onClick={fetchStores}
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
      <ToolbarSpacer />

      <ScrollableContent>
        <Container>
          <SearchContainer>
            <Search style={{ color: '#777', margin: '0 8px' }} />
            <SearchInput
              placeholder="Search stores..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </SearchContainer>

          {error && (
            <div style={{ 
              background: '#fdecea',
              color: '#d32f2f',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '1.25rem' }}>!</span>
              <span>{error}</span>
            </div>
          )}

          <StoresGrid>
            {filteredStores.length > 0 ? (
              filteredStores.map(store => (
                <StoreCard key={store._id} onClick={() => navigateToStore(store._id)}>
                  <StoreImage 
                    src={store.bannerImage || 'https://placehold.co/600x400/orange/white?text=Store'} 
                    alt={store.storeName}
                  />
                  <StoreContent>
                    <StoreName>
                      <StoreNameText>{store.storeName}</StoreNameText>
                    </StoreName>
                    <StoreDescription>
                      {store.description ? 
                        (store.description.length > 80 ? 
                          `${store.description.substring(0, 80)}...` : 
                          store.description) : 
                        'No description available'}
                    </StoreDescription>
                    
                    {store.location && (
                      <StoreLocation>
                        <LocationOn />
                        <span>{store.location}</span>
                      </StoreLocation>
                    )}
                    
                    {store.tags && store.tags.length > 0 && (
                      <TagsContainer>
                        {store.tags.slice(0, 3).map(tag => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </TagsContainer>
                    )}
                  </StoreContent>
                </StoreCard>
              ))
            ) : (
              <div style={{ 
                gridColumn: '1 / -1', 
                textAlign: 'center', 
                padding: '40px 0',
                color: '#666'
              }}>
                No stores found matching your search.
              </div>
            )}
          </StoresGrid>
        </Container>
      </ScrollableContent>
      {/* Bottom Navigation */}
      <div className="bottomNav" style={styles.bottomNav}>
        <div className="navItem" onClick={() => navigate('/customer/home')}>
          <MdHome size={24} />
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
        <div className="navItem activeNavItem" onClick={() => navigate('/customer/stores')}>
          <MdStore size={24} className="activeNavIcon" />
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

export default StoresPage;