import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { product, cart, review } from '../api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdArrowBack, MdShoppingCart, MdAdd, MdRemove } from 'react-icons/md';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { toggleFavorite, isInFavorites } from '../utils/favoriteUtils';
import styled from 'styled-components';
import { getUser } from '../utils/tokenUtils';

// Styled Components
const PageContainer = styled.div`
  background-color: #f7f7f7;
  height: 100vh;
  height: 100dvh;
  width: 100vw;
  max-width: 100%;
  position: fixed;
  top: -20px;
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

const HeaderTitle = styled.h1`
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0;
  color: white;
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
  padding: 16px 0 100px;
  
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

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 0 16px;
  
  @media (max-width: 768px) {
    padding: 0;
  }
`;

const ProductCard = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    border-radius: 0;
    box-shadow: none;
  }
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
  
  @media (max-width: 768px) {
    height: 250px;
  }
  
  @media (max-width: 480px) {
    height: 200px;
  }
`;

const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  margin-bottom: 50px;
  filter: ${props => props.$isOut ? 'blur(1.5px) grayscale(60%) brightness(0.85)' : 'none'};
  transition: filter 0.2s ease;
`;

const OutOfStockOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 1.1rem;
  pointer-events: none;
`;

const ProductInfo = styled.div`
  padding: 24px;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const ProductHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const ProductName = styled.h2`
  font-size: 23px;
  margin: 1px;
  color: #333;
  flex-grow: 1;
  margin-left: 40px;
`;

const FavoriteButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
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

const Price = styled.p`
  font-size: 18px;
  font-weight: 600;
  color: #ff8c00;
  margin: 0 0 10px 0;
  
  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const SoldCount = styled.div`
  font-size: 12px;
  color: #777;
  margin: -8px 0 7px;
`;

const Section = styled.div`
  margin-bottom: 5px;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  margin: 0 0 8px 0;
  color: #333;
`;

const DescriptionText = styled.p`
  font-size: 1rem;
  color: #666;
  margin: 0;
  line-height: 1.6;
`;

const StoreText = styled.p`
  font-size: 1rem;
  color: #666;
  margin: 0;
`;

const CategoryText = styled.p`
  font-size: 1rem;
  color: #666;
  margin: 0;
`;

const DeliveryInfo = styled.div`
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const InfoLabel = styled.span`
  font-size: 0.875rem;
  color: #888;
  margin-bottom: 4px;
`;

const InfoValue = styled.span`
  font-size: 1rem;
  color: #333;
  font-weight: 500;
`;

const AddToCartSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 7px;
  }
`;

const QuantitySelector = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  
  @media (max-width: 480px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const QuantityButton = styled.button`
  background: none;
  border: none;
  padding: 8px 16px;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const QuantityDisplay = styled.span`
  padding: 0 16px;
  font-size: 1rem;
  font-weight: 500;
  min-width: 40px;
  text-align: center;
`;

const AddToCartButton = styled.button`
  background: linear-gradient(135deg, #fbaa39, #fc753b);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1px;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(255, 140, 0, 0.35);
  }
  
  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #fff;
  font-size: 1.25rem;
  color: #666;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #fff;
  color: #d32f2f;
  font-size: 1.25rem;
  padding: 20px;
  text-align: center;
`;

const SingleProductPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [productData, setProductData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');    
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // Load current user from localStorage
        try {
            const user = getUser() || {};
            setCurrentUser(user && user.name ? user : null);
        } catch {
            setCurrentUser(null);
        }
    }, []);

    const handleGoBack = () => {
        navigate('/customer/home');
    };

    useEffect(() => {
        const fetchProductDetails = async () => {
            try {
                const data = await product.getProductById(productId);
                setProductData(data);
            } catch (err) {
                setError(err.message || 'Failed to fetch product details');
                toast.error(err.message || 'Failed to fetch product details');
            } finally {
                setLoading(false);
            }
        };

        fetchProductDetails();
    }, [productId]);

    useEffect(() => {
        // Load reviews for this product from backend
        let isMounted = true;
        (async () => {
            try {
                const data = await review.listByProduct(productId);
                if (isMounted) setReviews(data);
            } catch (err) {
                // Silently ignore for UI, or you can toast
                // toast.error(err.message || 'Failed to load reviews');
                if (isMounted) setReviews([]);
            }
        })();
        return () => { isMounted = false; };
    }, [productId]);

    const handleAddToCart = async () => {
        try {
            await cart.addToCart(productId, quantity);
            toast.success('Product added to cart successfully');
        } catch (err) {
            const errorMessage = err.message || err.error || 'Failed to add product to cart';
            toast.error(errorMessage);
            console.error('Add to cart error:', err);
        }
    };

    if (loading) {
        return <LoadingContainer>Loading...</LoadingContainer>;
    }

    if (error || !productData) {
        return <ErrorContainer>{error || 'Product not found'}</ErrorContainer>;
    }

    return (
        <PageContainer>
            <ToastContainer position="top-right" autoClose={3000} />
            
            <Header>
                <BackButton onClick={handleGoBack}>
                    <MdArrowBack size={24} />
                </BackButton>
                <HeaderTitle>Product Details</HeaderTitle>
            </Header>
            <ToolbarSpacer />

            <ScrollableContent>
                <ContentContainer>
                    <ProductCard>
                        <ImageContainer>
                            <ProductImage 
                                src={productData.image} 
                                alt={productData.name}
                                $isOut={productData.availability === 'Out of Stock'}
                            />
                            {productData.availability === 'Out of Stock' && (
                                <OutOfStockOverlay>Out of Stock</OutOfStockOverlay>
                            )}
                        </ImageContainer>

                        <ProductInfo>
                            <ProductHeader>
                                <ProductName>{productData.name}</ProductName>
                                <FavoriteButton 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newFavoriteStatus = toggleFavorite(productId);
                                        setIsFavorite(newFavoriteStatus);
                                        toast.success(newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites');
                                    }}
                                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    {isFavorite ? 
                                        <Favorite style={{ color: '#ff4081', fontSize: '1.5rem' }} /> : 
                                        <FavoriteBorder style={{ color: '#999', fontSize: '1.5rem' }} />
                                    }
                                </FavoriteButton>
                            </ProductHeader>
                            <Price>₱{productData.price.toFixed(2)}</Price>
                            {productData.soldCount != null && (
                                <SoldCount>Sold: {productData.soldCount}</SoldCount>
                            )}
                            
                            <Section>
                                <SectionTitle>Description</SectionTitle>
                                <DescriptionText>{productData.description}</DescriptionText>
                            </Section>

                            <Section>
                                <SectionTitle>Store</SectionTitle>
                                <StoreText>{productData?.storeId?.storeName || productData?.storeName || 'Unknown store'}</StoreText>
                            </Section>

                            <Section>
                                <SectionTitle>Category</SectionTitle>
                                <CategoryText>{productData.category}</CategoryText>
                            </Section>

                            <Section>
                                <SectionTitle>Delivery Information</SectionTitle>
                                <DeliveryInfo>
                                    <InfoGrid>
                                        <InfoItem>
                                            <InfoLabel>Estimated Time:</InfoLabel>
                                            <InfoValue>
                                                {productData.estimatedTime ? 
                                                    `${productData.estimatedTime} minutes` : 'Not specified'}
                                            </InfoValue>
                                        </InfoItem>
                                        <InfoItem>
                                            <InfoLabel>Shipping Fee:</InfoLabel>
                                            <InfoValue>
                                                ₱{productData.shippingFee ? 
                                                    parseFloat(productData.shippingFee).toFixed(2) : '0.00'}
                                            </InfoValue>
                                        </InfoItem>
                                    </InfoGrid>
                                </DeliveryInfo>
                            </Section>

                            {productData.availability === 'Available' && (
                                <AddToCartSection>
                                    <QuantitySelector>
                                        <QuantityButton 
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        >
                                            <MdRemove size={20} />
                                        </QuantityButton>
                                        <QuantityDisplay>{quantity}</QuantityDisplay>
                                        <QuantityButton 
                                            onClick={() => setQuantity(quantity + 1)}
                                        >
                                            <MdAdd size={20} />
                                        </QuantityButton>
                                    </QuantitySelector>

                                    <AddToCartButton onClick={handleAddToCart}>
                                        <MdShoppingCart size={20} />
                                        Add to Cart
                                    </AddToCartButton>
                                </AddToCartSection>
                            )}
                        </ProductInfo>
                    </ProductCard>

                    <div style={{ marginTop: 32 }}>
                        <h3 style={{ color: ' #333333', marginBottom: 12 }}>Reviews</h3>
                        {reviews.length === 0 ? (
                            <p style={{ color: '#888' }}>No reviews yet.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {reviews.map((review, idx) => {
                                    // If this review is by the current user, always use the latest profile
                                    let displayName = review.userName || 'Anonymous';
                                    let displayImage = review.userImage || '';
                                    if (
                                        currentUser &&
                                        ((review.userName && review.userName === currentUser.name) ||
                                         (review.userEmail && review.userEmail === currentUser.email))
                                    ) {
                                        displayName = currentUser.name || 'You';
                                        displayImage = currentUser.profileImage || '';
                                    }
                                    return (
                                        <li key={idx} style={{
                                            background: ' #f9f9f9',
                                            borderRadius: 8,
                                            padding: 16,
                                            marginBottom: 12,
                                            color: '#444',
                                            fontSize: '1rem',
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                                {displayImage ? (
                                                    <img src={displayImage} alt={displayName || 'Reviewer'} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', marginRight: 12, background: ' #eeeeee' }} onError={e => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName || 'U'); }} />
                                                ) : (
                                                <div style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: '50%',
                                                    background: '#ff8c00',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 600,
                                                    fontSize: 18,
                                                    marginRight: 12
                                                }}>
                                                    {displayName ? displayName.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                )}
                                                <div style={{ fontWeight: 500, fontSize: 15, color: '#222' }}>
                                                    {displayName}
                                                </div>
                                            </div>
                                            <div>{review.comment}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: 4 }}>
                                                {review.createdAt ? `on ${new Date(review.createdAt).toLocaleDateString()}` : ''}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </ContentContainer>
            </ScrollableContent>
        </PageContainer>
    );
};

export default SingleProductPage;