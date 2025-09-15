import React, { useState, useEffect } from 'react';
import useDebouncedRefresh from '../hooks/useDebouncedRefresh';
import { SkeletonCard } from '../components/Skeletons';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import axios from 'axios';
import styled from 'styled-components';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from '../components/ErrorBoundary';
import { isStoreInFavorites, toggleStoreFavorite } from '../utils/favoriteUtils';
import { getToken } from '../utils/tokenUtils';
import { MdCheckCircle } from 'react-icons/md';

// Styled Components
const StoreDetailWrapper = styled.div`
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
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  background: #ff8c00e0;
  z-index: 100;
  padding: 15px 0;
  border-bottom: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 480px) {
    padding: 12px 0;
  }
`;

const HeaderContent = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 0 15px;
  display: flex;
  align-items: center;
  gap: 15px;
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  margin-right: 5px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
    transform: translateX(-2px);
  }
  
  &:active {
    background-color: rgba(255, 255, 255, 0.4);
  }
  
  svg {
    width: 24px;
    height: 24px;
  }
  
  @media (max-width: 480px) {
    padding: 6px;
    
    svg {
      width: 22px;
      height: 22px;
    }
  }
`;

const StoreTitleHeader = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const ScrollableContent = styled.main`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  padding-bottom: 80px; /* Space for any fixed footer */
  
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

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 15px;
  background: #ffffff;
  position: relative;
  min-height: 100%;
  
  @media (max-width: 768px) {
    padding: 15px 10px;
  }
`;

const StoreBanner = styled.header`
  width: 100%;
  height: 180px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin: 10px 0 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  
  @media (max-width: 768px) {
    height: 150px;
    border-radius: 0;
    margin: 0 0 15px;
    margin-top: -14px;
    border-radius: 0 0 20px 20px;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7));
  }
`;

const StoreHeader = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  border-radius: 0 0 8px 8px;
  color: white;
`;

const StoreInfo = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

const StoreImage = styled.img`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid white;
  margin-right: 15px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  
  @media (max-width: 480px) {
    width: 60px;
    height: 60px;
  }
`;

const StoreText = styled.div`
  flex: 1;
  min-width: 0;
  padding-right: 60px;
`;

const StoreTitle = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  line-height: 1.2;
  
  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const StoreDescription = styled.p`
  margin: 6px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  
  @media (max-width: 480px) {
    font-size: 12px;
    margin-top: 4px;
  }
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  max-width: calc(100% - 60px);
`;

const FavoriteButton = styled.button`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${props => props.$isFavorite ? ' #ff4444' : ' white'};
  font-size: 24px;
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const StoreNav = styled.nav`
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  margin: 15px 0 20px;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  
  @media (max-width: 480px) {
    margin: 10px 0 15px;
  }
`;

const NavButton = styled.button`
  flex: 1;
  padding: 12px 10px;
  border: none;
  background: ${props => props.$isActive ? '#ff6b00' : 'white'};
  font-size: 14px;
  font-weight: ${props => props.$isActive ? '600' : '500'};
  color: ${props => props.$isActive ? 'white' : '#555'};
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  border-radius: 6px;
  margin: 4px;
  
  &:first-child {
    margin-right: 2px;
  }
  
  &:last-child {
    margin-left: 2px;
  }
  
  &:hover {
    background: ${props => props.$isActive ? '#ff6b00' : '#fff9f5'};
  }
  
  @media (max-width: 480px) {
    font-size: 13px;
    padding: 10px 8px;
  }
`;

const ProductsSection = styled.section`
  padding: 15px 0 30px;
  
  @media (max-width: 768px) {
    padding: 10px 0 20px;
  }
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 15px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
`;

// Categories UI
const CategoriesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
  margin-top: 15px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const CategoryCard = styled.div`
  background: #fff7f0;
  border: 1px solid #ffe0c2;
  color: #e65100;
  padding: 16px;
  border-radius: 10px;
  text-align: center;
  font-weight: 600;
`;

const ProductCard = styled.div`
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #eee;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 480px) {
    border-radius: 8px;
  }
`;

const ProductImage = styled.img`
  width: 100%;
  height: 140px;
  object-fit: cover;
  
  @media (max-width: 480px) {
    height: 120px;
  }
`;

const ProductInfo = styled.div`
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  flex: 1;
  
  @media (max-width: 480px) {
    padding: 10px 8px;
  }
`;

const ProductName = styled.h3`
  margin: 0 0 6px 0;
  font-size: 15px;
  font-weight: 500;
  color: #333;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 38px;
  
  @media (max-width: 480px) {
    font-size: 14px;
    min-height: 36px;
  }
`;

const ProductPrice = styled.div`
  margin: 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #ff6b00;
  
  span {
    display: block;
  }
  
  @media (max-width: 480px) {
    font-size: 15px;
    margin: 6px 0;
  }
`;

const ProductDescription = styled.p`
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (max-width: 480px) {
    font-size: 11px;
    -webkit-line-clamp: 1;
  }
`;

const ProductActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
`;

const AddToCartButton = styled.button`
  background: #ff6b00;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #e65100;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const LoadingState = styled.main`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
  
  .loader {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #ff6b00;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorState = styled.main`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
  
  p {
    color: #d32f2f;
    margin-bottom: 16px;
    font-size: 18px;
  }
  
  button {
    background: #ff6b00;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.2s;
    
    &:hover {
      background: #e65100;
    }
  }
`;

const StoreDetailPage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Products');
  const [isFavorite, setIsFavorite] = useState(false);
  const [successModal, setSuccessModal] = useState({ open: false, message: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const API_BASE_URL = import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_API_BASE_URL || 'https://capstonedelibup.onrender.com/api');
  const STORE_CACHE_KEY = `bufood:store:${storeId}`;

  useEffect(() => {
    // Check favorite state
    setIsFavorite(isStoreInFavorites(storeId));
  }, [storeId]);

  useEffect(() => {
    let hadCache = false;
    // Cache-first render
    try {
      const cached = JSON.parse(localStorage.getItem(STORE_CACHE_KEY) || 'null');
      if (cached && typeof cached === 'object') {
        hadCache = true;
        setStore(cached);
        setProducts(Array.isArray(cached.products) ? cached.products : []);
        setLoading(false);
      }
    } catch (_) {}

    const fetchStore = async ({ showLoader = true } = {}) => {
      try {
        if (showLoader) setLoading(true);
        setError('');
        const res = await fetch(`${API_BASE_URL}/customers/store/${storeId}`);
        if (!res.ok) throw new Error('Failed to load store');
        const data = await res.json();
        setStore(data);
        setProducts(Array.isArray(data.products) ? data.products : []);
        try { localStorage.setItem(STORE_CACHE_KEY, JSON.stringify(data)); } catch (_) {}
      } catch (err) {
        console.error('Error fetching store:', err);
        if (!hadCache) setError('Failed to load store. Please try again.');
      } finally {
        if (showLoader) setLoading(false);
      }
    };
    // Always fetch fresh; show loader only if no cache
    fetchStore({ showLoader: !hadCache });
  }, [API_BASE_URL, storeId]);

  // Debounced background refresh
  useDebouncedRefresh(async () => {
    setIsRefreshing(true);
    try {
      // silent refresh
      try {
        const res = await fetch(`${API_BASE_URL}/customers/store/${storeId}`);
        if (res.ok) {
          const data = await res.json();
          setStore(data);
          setProducts(Array.isArray(data.products) ? data.products : []);
          try { localStorage.setItem(STORE_CACHE_KEY, JSON.stringify(data)); } catch (_) {}
        }
      } catch (_) {}
    } finally {
      setIsRefreshing(false);
    }
  }, { delayMs: 600, intervalMs: 30000 });

  const handleGoBack = () => navigate('/customer/stores');
  const handleToggleFavorite = () => {
    const next = toggleStoreFavorite(storeId);
    setIsFavorite(next);
    const msg = next ? 'Added to favorites' : 'Removed from favorites';
    setSuccessModal({ open: true, message: msg });
    setTimeout(() => setSuccessModal({ open: false, message: '' }), 1200);
  };

  const handleKeyDown = (e, product) => {
    if (e.key === 'Enter') {
      handleBuy(product);
    }
  };

  const handleBuy = (product) => {
    navigate(`/customer/product/${product._id}`);
  };

  const categories = Array.from(new Set((products || []).map(p => p.category).filter(Boolean)));

  if (loading) {
    return (
      <LoadingState>
        <div className="loader" aria-label="Loading" />
        <p>Loading store...</p>
      </LoadingState>
    );
  }

  if (error) {
    return (
      <ErrorState>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </ErrorState>
    );
  }

  if (!store) return null;

  return (
    <StoreDetailWrapper>
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
        <HeaderContent>
          <BackButton onClick={handleGoBack} aria-label="Go back">
            <ArrowBack />
          </BackButton>
          <StoreTitleHeader>{store.storeName || 'Store'}</StoreTitleHeader>
        </HeaderContent>
      </Header>

      <ScrollableContent>
        <ContentWrapper>
          <StoreBanner style={{ backgroundImage: `url(${store.bannerImage || 'https://placehold.co/1200x400/orange/white?text=Store+Banner'})` }}>
            <StoreHeader>
              <StoreInfo>
                <StoreImage
                  src={store.image || store.logo || 'https://placehold.co/140x140/ff8c00/ffffff?text=Store'}
                  alt={store.storeName}
                  loading="lazy"
                />
                <StoreText>
                  <StoreTitle>{store.storeName}</StoreTitle>
                  {store.description && (
                    <StoreDescription title={store.description}>{store.description}</StoreDescription>
                  )}
                </StoreText>
                <FavoriteButton
                  $isFavorite={isFavorite}
                  onClick={handleToggleFavorite}
                  aria-pressed={isFavorite}
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorite ? '♥' : '♡'}
                </FavoriteButton>
              </StoreInfo>
            </StoreHeader>
          </StoreBanner>

          <StoreNav role="tablist" aria-label="Store sections">
            <NavButton
              role="tab"
              aria-selected={activeTab === 'Products'}
              $isActive={activeTab === 'Products'}
              onClick={() => setActiveTab('Products')}
            >
              Products
            </NavButton>
            <NavButton
              role="tab"
              aria-selected={activeTab === 'Categories'}
              $isActive={activeTab === 'Categories'}
              onClick={() => setActiveTab('Categories')}
            >
              View product categories
            </NavButton>
          </StoreNav>

          {activeTab === 'Products' ? (
            <ProductsSection>
              <ProductsGrid role="list" aria-label="Products">
                {isRefreshing && products.length > 0 && (
                  Array.from({ length: Math.min(6, products.length) }).map((_, i) => (
                    <SkeletonCard key={`skeleton-prod-${i}`} height={220} />
                  ))
                )}
                {products.length > 0 ? (
                  products.map((product) => (
                    <ProductCard
                      key={product._id}
                      onClick={() => handleBuy(product)}
                      onKeyDown={(e) => handleKeyDown(e, product)}
                      tabIndex="0"
                      role="listitem"
                      aria-label={`${product.name}, ${Number(product.price).toFixed(2)} pesos, ${product.availability || 'Available'}`}
                    >
                      <ProductImage
                        src={product.image || 'https://placehold.co/300x200/f0f0f0/cccccc?text=No+Image'}
                        alt={product.name}
                        loading="lazy"
                      />
                      {product.availability && product.availability !== 'Available' && (
                        <OutOfStockOverlay aria-hidden="true">
                          <span>Out of Stock</span>
                        </OutOfStockOverlay>
                      )}
                      <ProductInfo>
                        <ProductName>{product.name}</ProductName>
                        {product.description && (
                          <ProductDescription>{product.description}</ProductDescription>
                        )}
                        <ProductPrice>
                          <span aria-label={`Price: ${Number(product.price).toFixed(2)} pesos`}>
                            ₱{Number(product.price).toFixed(2)}
                          </span>
                        </ProductPrice>
                        <ProductMeta>
                          <Availability $available={(product.availability || 'Available') === 'Available'}>
                            {product.availability || 'Available'}
                          </Availability>
                          {product.category && (
                            <Category aria-label={`Category: ${product.category}`}>{product.category}</Category>
                          )}
                        </ProductMeta>
                        {product.estimatedTime && (
                          <EstimatedTime aria-label={`Preparation time: ${product.estimatedTime} minutes`}>
                            ⏱ {product.estimatedTime} mins prep time
                          </EstimatedTime>
                        )}
                        <ViewDetailsButton
                          disabled={product.availability && product.availability !== 'Available'}
                          aria-disabled={product.availability && product.availability !== 'Available'}
                        >
                          {product.availability && product.availability !== 'Available' ? 'Out of Stock' : 'View Details'}
                        </ViewDetailsButton>
                      </ProductInfo>
                    </ProductCard>
                  ))
                ) : (
                  <NoProducts role="status">
                    <p>No products available in this store yet</p>
                  </NoProducts>
                )}
              </ProductsGrid>
            </ProductsSection>
          ) : (
            <ProductsSection>
              <CategoriesGrid role="list" aria-label="Categories">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <CategoryCard key={cat} role="listitem" aria-label={cat}>
                      {cat}
                    </CategoryCard>
                  ))
                ) : (
                  <NoProducts role="status">
                    <p>No categories available</p>
                  </NoProducts>
                )}
              </CategoriesGrid>
            </ProductsSection>
          )}

          <ToastContainer position="bottom-center" />
        </ContentWrapper>
      </ScrollableContent>
    </StoreDetailWrapper>
  );
};

// Additional styled components
const OutOfStockOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
`;

const ProductMeta = styled.div`
  display: flex;
  gap: 8px;
  margin: 8px 0;
`;

const Availability = styled.span`
  color: ${props => props.$available ? '#4caf50' : '#f44336'};
  font-size: 14px;
`;

const Category = styled.span`
  background: #e0e0e0;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  color: #616161;
`;

const EstimatedTime = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #757575;
  margin-bottom: 12px;
`;

const ViewDetailsButton = styled.button`
  background: #ff6b00;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  width: 100%;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: auto;
  
  &:hover:not(:disabled) {
    background: #e65100;
  }
  
  &:disabled {
    background: #9e9e9e;
    cursor: not-allowed;
  }
`;

const NoProducts = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px 0;
  color: #757575;
`;

export default StoreDetailPage;