/*
  * SingleProductPage
  * -------------------------------------------------------------
  * Displays a single product’s details for customers. It supports:
  *  - Cache-first product loading with background fetch update
  *  - Add-to-cart with quantity controls and success feedback
  *  - Favorite toggle persisted in localStorage
  *  - Basic reviews list fetched from backend
  *  - Responsive layout using styled-components
  *
  * Data flow:
  *  - On mount, read cached product (localStorage) when available
  *  - Fetch latest details from the API and refresh the cache
  *  - Separately fetch product reviews
  *
  * Navigation:
  *  - Back button returns to the customer home page
  */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { product, cart, review } from '../api';
import VariantSelector from './VariantSelector';

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdArrowBack, MdShoppingCart, MdAdd, MdRemove, MdCheckCircle } from 'react-icons/md';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { toggleFavorite, isInFavorites } from '../utils/favoriteUtils';
import styled from 'styled-components';
import { getUser } from '../utils/tokenUtils';
import { apiRequest } from '../utils/api';
import http from '../api/http';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 2100;
  animation: fadeIn 180ms ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalPanel = styled.div`
  background: #fff;
  width: 100%;
  max-width: 560px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  box-shadow: 0 -4px 24px rgba(0,0,0,0.2);
  padding: 16px;
  animation: slideUp 220ms ease;

  @keyframes slideUp {
    from { transform: translateY(24px); opacity: 0.96; }
    to { transform: translateY(0); opacity: 1; }
  }

  @media (min-width: 700px) {
    border-radius: 12px;
    margin: 48px 16px;
    align-self: center;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const ModalTitle = styled.h4`
  margin: 0;
  font-size: 1.05rem;
  color: #333;
`;

const ModalCloseBtn = styled.button`
  border: none;
  background: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #666;
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
`;

const ConfirmBtn = styled.button`
  flex: 1;
  min-width: 180px;
  background: linear-gradient(135deg, #fbaa39, #fc753b);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  font-weight: 700;
  cursor: pointer;
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

// Confirmation Modal Styles
const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.35);
  z-index: 2200;
  animation: fadeIn 150ms ease-in;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ConfirmBox = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.18);
  padding: 20px 22px;
  width: 100%;
  max-width: 420px;
  transform: translateY(4px);
  animation: popIn 180ms ease-out;

  @keyframes popIn {
    from { transform: translateY(12px); opacity: 0.96; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const ConfirmTitle = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: #2E7D32;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ConfirmInfo = styled.div`
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 16px;
  line-height: 1.5;
`;

const ConfirmActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const ConfirmButtonPrimary = styled.button`
  flex: 1;
  min-width: 160px;
  background: linear-gradient(135deg, #fbaa39, #fc753b);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
`;

const ConfirmButtonSecondary = styled.button`
  flex: 1;
  min-width: 160px;
  background: #f1f1f1;
  color: #333;
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
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
    const [successModal, setSuccessModal] = useState({ open: false, productName: '', variantText: '', quantity: 1 });
    const [variantSelections, setVariantSelections] = useState([]);
    const [isSelectionsValid, setIsSelectionsValid] = useState(false);
    const [calculatedPrice, setCalculatedPrice] = useState(0);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [selectedVariantChoice, setSelectedVariantChoice] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
    const [showVariantModal, setShowVariantModal] = useState(false);
    const [modalAction, setModalAction] = useState(null); // 'cart' | 'fav'
    const [modalQuantity, setModalQuantity] = useState(1);
    const [modalSelectedChoice, setModalSelectedChoice] = useState(null);
    const [loginPrompt, setLoginPrompt] = useState(false);

    const getAuthToken = () => {
        // Prefer app token from localStorage/sessionStorage
        const token = window.localStorage.getItem('token') || window.sessionStorage.getItem('token');
        if (token) return token;
        // Fallback to accessToken (set by supabaseAuthService)
        const accessToken = window.localStorage.getItem('accessToken');
        if (accessToken) return accessToken;
        // Fallback to Supabase stored session under custom storageKey
        try {
            const sbRaw = window.localStorage.getItem('bufood-auth-token');
            if (sbRaw) {
                const parsed = JSON.parse(sbRaw);
                if (parsed && parsed.currentSession && parsed.currentSession.access_token) {
                    return parsed.currentSession.access_token;
                }
                if (parsed && parsed.access_token) {
                    return parsed.access_token;
                }
            }
            // Common Supabase keys
            const sbAccess = window.localStorage.getItem('sb-access-token');
            if (sbAccess) return sbAccess;
            const sbAuthToken = window.localStorage.getItem('supabase.auth.token');
            if (sbAuthToken) {
                const parsed = JSON.parse(sbAuthToken);
                if (parsed && parsed.currentSession && parsed.currentSession.access_token) {
                    return parsed.currentSession.access_token;
                }
            }
        } catch (_) {}
        return null;
    };

    useEffect(() => {
        // Load current user from localStorage (for review name/image resolution)
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
        // Cache-first render for product, then fetch latest to refresh cache
        const CACHE_KEY = `bufood:product:${productId}`;
        let hadCache = false;

        // Cache-first render
        try {
            const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
            if (cached && typeof cached === 'object') {
                hadCache = true;
                setProductData(cached);
                setCalculatedPrice(cached?.price || 0);

                setLoading(false);
            }
        } catch (_) {}

        const fetchProductDetails = async ({ showLoader = true } = {}) => {
            // Fetch product details from API and update local cache
            try {
                if (showLoader) setLoading(true);
                const data = await product.getProductById(productId);
                setProductData(data);
                setCalculatedPrice(data?.price || 0);

                try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (_) {}
            } catch (err) {
                setError(err.message || 'Failed to fetch product details');
                toast.error(err.message || 'Failed to fetch product details');
            } finally {
                if (showLoader) setLoading(false);
            }
        };

        // Always fetch fresh; show loader only if no cache
        fetchProductDetails({ showLoader: !hadCache });
    }, [productId]);

    useEffect(() => {
        // Load reviews for this product from backend (best-effort)
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

    // Load related products by category (simple in-memory filter)
    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const { data: all } = await http.get('/products');
                if (Array.isArray(all) && productData?.category) {
                    const rel = all.filter(p => p._id !== productId && p.category === productData.category).slice(0, 6);
                    if (isMounted) setRelatedProducts(rel);
                } else if (isMounted) {
                    setRelatedProducts([]);
                }
            } catch (_) {
                if (isMounted) setRelatedProducts([]);
            }
        })();
        return () => { isMounted = false; };
    }, [productId, productData?.category]);

    // Compute effective stock from selected choices
    const getEffectiveStock = () => {
        const hasVariants = Array.isArray(productData?.variants) && productData.variants.length > 0;
        if (!hasVariants) {
            return typeof productData?.stock === 'number' ? productData.stock : Infinity;
        }
        if (!variantSelections || variantSelections.length === 0) return 0;
        const stocks = variantSelections
            .map(s => (typeof s.stock === 'number' ? s.stock : undefined))
            .filter(n => typeof n === 'number');
        if (stocks.length === 0) return 0;
        return Math.min(...stocks);
    };

    const selectedVariantImage = (() => {
        const img = variantSelections?.find(s => s.image)?.image;
        return img || productData?.image;
    })();

    const handleAddToFavorites = async () => {
        try {
            const hasVariantChoices = Array.isArray(productData?.variantChoices) && productData.variantChoices.length > 0;
            const hasLegacyVariants = Array.isArray(productData?.variants) && productData.variants.length > 0;
            if (hasVariantChoices && !selectedVariantChoice) {
                // Trigger modal UX instead
                setModalAction('fav');
                setIsVariantModalOpen(true);
                setShowVariantModal(true);
                setModalQuantity(1);
                setModalSelectedChoice(null);
                return;
            }
            if (!hasVariantChoices && hasLegacyVariants && !isSelectionsValid) {
                toast.error('Please select required options');
                return;
            }

            const token = getAuthToken();
            const hasChoice = hasVariantChoices && selectedVariantChoice;
            const selectedVarSnapshot = hasChoice ? {
                variantName: selectedVariantChoice.variantName,
                optionName: selectedVariantChoice.optionName,
                image: selectedVariantChoice.image || productData?.image || ''
            } : undefined;

            const body = hasChoice ? {
                productId,
                selectedVariant: selectedVarSnapshot,
            } : {
                productId,
                // best-effort legacy mapping
                selectedVariant: (Array.isArray(variantSelections) && variantSelections.length === 1) ? {
                    variantName: variantSelections[0]?.variant || null,
                    optionName: variantSelections[0]?.choice || null,
                    image: variantSelections[0]?.image || productData?.image || ''
                } : undefined,
            };

            if (!token) {
                setLoginPrompt(true);
                return;
            } else {
                const res = await apiRequest('/favorites', {
                    method: 'POST',
                    body: JSON.stringify(body),
                });
                const data = await res.json();
                if (res.status === 401 || data?.code === 'TOKEN_EXPIRED') { setLoginPrompt(true); return; }
                if (!res.ok || data?.error) throw new Error(data?.message || 'Failed to add to favorites');
                toast.success('Added to favorites');
            }
        } catch (err) {
            toast.error(err.message || 'Failed to add to favorites');
        }
    };

    // Modal confirm handler
    const confirmVariantModal = async () => {
        const choice = modalSelectedChoice;
        if (!choice) {
            alert('Please select a variant.');
            return;
        }
        try {
            if (modalAction === 'cart') {
                const body = {
                    productId,
                    quantity: Number(modalQuantity),
                    variant: {
                        variantName: choice.variantName,
                        optionName: choice.optionName,
                        price: choice.price,
                    },
                };
                const res = await apiRequest('/carts', { method: 'POST', body: JSON.stringify(body) });
                const data = await res.json();
                console.log('Add to cart response:', data);
                if (res.status === 401) { setLoginPrompt(true); return; }
                if (!res.ok || !data.success) throw new Error(data?.message || 'Failed to add to cart');
                setSuccessModal({
                    open: true,
                    productName: productData?.name || 'Product',
                    variantText: `${choice.variantName}: ${choice.optionName}`,
                    quantity: Number(modalQuantity) || 1,
                });
            } else if (modalAction === 'fav') {
                const token = getAuthToken();
                const body = {
                    productId,
                    selectedVariant: {
                        variantName: choice.variantName,
                        optionName: choice.optionName,
                        price: choice.price,
                        image: choice.image || productData?.image || ''
                    },
                };
                if (!token) {
                    setLoginPrompt(true);
                    return;
                } else {
                    const res = await apiRequest('/favorites', { method: 'POST', body: JSON.stringify(body) });
                    const data = await res.json();
                    if (res.status === 401 || data?.code === 'TOKEN_EXPIRED') { setLoginPrompt(true); return; }
                    if (!res.ok || data?.error) throw new Error(data?.message || 'Failed to add to favorites');
                    toast.success('Added to favorites');
                }
            }
            setIsVariantModalOpen(false);
            setShowVariantModal(false);
            setModalAction(null);
        } catch (err) {
            toast.error(err.message || 'Failed to process request');
        }
    };

    const handleAddToCart = async () => {
        try {
            const hasVariantChoices = Array.isArray(productData?.variantChoices) && productData.variantChoices.length > 0;
            const hasLegacyVariants = Array.isArray(productData?.variants) && productData.variants.length > 0;
            if (hasVariantChoices && !selectedVariantChoice) {
                // Open modal for selection
                setModalAction('cart');
                setIsVariantModalOpen(true);
                setShowVariantModal(true);
                setModalQuantity(1);
                setModalSelectedChoice(null);
                return;
            }
            if (!hasVariantChoices && hasLegacyVariants && !isSelectionsValid) {
                toast.error('Please select required options');
                return;
            }
            // Stock check
            const effStock = getEffectiveStock();
            if (effStock === 0) {
                toast.error('Selected option is out of stock');
                return;
            }

            let body;
            if (hasVariantChoices && selectedVariantChoice) {
                body = {
                    productId,
                    variant: {
                        variantName: selectedVariantChoice.variantName,
                        optionName: selectedVariantChoice.optionName,
                        price: selectedVariantChoice.price,
                    }
                };
            } else if (Array.isArray(variantSelections) && variantSelections.length === 1) {
                const sel = variantSelections[0];
                body = {
                    productId,
                    variant: sel.variant,
                    option: sel.choice,
                    variantId: sel.choiceId,
                    price: calculatedPrice || sel.price || productData.price,
                    image: sel.image || productData.image,
                };
            } else {
                body = {
                    productId,
                    variantSelections,
                    price: calculatedPrice || productData.price,
                };
            }

            const response = await apiRequest('/carts', { method: 'POST', body: JSON.stringify(body) });
            const data = await response.json();
            if (response.status === 401) { setLoginPrompt(true); return; }
            if (!response.ok || !data.success) {
                const msg = data?.message || 'Failed to add product to cart';
                throw new Error(msg);
            }

            if (hasVariantChoices && selectedVariantChoice) {
                setSuccessModal({
                    open: true,
                    productName: productData?.name || 'Product',
                    variantText: `${selectedVariantChoice.variantName}: ${selectedVariantChoice.optionName}`,
                    quantity: Number(quantity) || 1,
                });
            } else {
                // Legacy variants or no variants; build best-effort label
                const label = Array.isArray(variantSelections) && variantSelections.length > 0
                  ? variantSelections.map(v => `${v.variant?.name || v.variant || ''}${v.choice ? `: ${v.choice}` : ''}`).filter(Boolean).join(', ')
                  : '';
                setSuccessModal({
                    open: true,
                    productName: productData?.name || 'Product',
                    variantText: label,
                    quantity: Number(quantity) || 1,
                });
            }
        } catch (err) {
            const errorMessage = err.message || 'Failed to add product to cart';
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
            {/* Login Prompt Modal */}
            {loginPrompt && (
                <ConfirmOverlay onClick={() => setLoginPrompt(false)}>
                    <ConfirmBox onClick={(e) => e.stopPropagation()}>
                        <ConfirmTitle>
                            Authentication Required
                        </ConfirmTitle>
                        <ConfirmInfo>
                            You must be logged in to add items to your favorites.
                        </ConfirmInfo>
                        <ConfirmActions>
                            <ConfirmButtonSecondary onClick={() => setLoginPrompt(false)}>Cancel</ConfirmButtonSecondary>
                            <ConfirmButtonPrimary onClick={() => navigate('/login')}>Go to Login</ConfirmButtonPrimary>
                        </ConfirmActions>
                    </ConfirmBox>
                </ConfirmOverlay>
            )}
            {/* Confirmation Modal: Added to Cart */}
            {successModal.open && (
                <ConfirmOverlay onClick={() => setSuccessModal(prev => ({ ...prev, open: false }))}>
                    <ConfirmBox onClick={(e) => e.stopPropagation()}>
                        <ConfirmTitle>
                            <MdCheckCircle size={22} color="#2E7D32" />
                            Added to Cart!
                        </ConfirmTitle>
                        <ConfirmInfo>
                            <div style={{ fontWeight: 700 }}>{successModal.productName}</div>
                            {successModal.variantText ? (
                                <div>Variant: {successModal.variantText}</div>
                            ) : null}
                            <div>Quantity: {successModal.quantity}</div>
                        </ConfirmInfo>
                        <ConfirmActions>
                            <ConfirmButtonSecondary onClick={() => setSuccessModal(prev => ({ ...prev, open: false }))}>
                                Continue Shopping
                            </ConfirmButtonSecondary>
                            <ConfirmButtonPrimary onClick={() => navigate('/customer/cart')}>
                                Go to Cart
                            </ConfirmButtonPrimary>
                        </ConfirmActions>
                    </ConfirmBox>
                </ConfirmOverlay>
            )}
            
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
                                src={selectedVariantImage} 
                                alt={productData.name}
                                $isOut={productData.availability === 'Out of Stock'}
                                loading="lazy"
                            />
                            {productData.availability === 'Out of Stock' && (
                                <OutOfStockOverlay>Out of Stock</OutOfStockOverlay>
                            )}
                        </ImageContainer>

                        <ProductInfo>
                            <ProductHeader>
                                <ProductName>{productData.name}</ProductName>
                                <FavoriteButton 
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        const hasVariantChoices = Array.isArray(productData?.variantChoices) && productData.variantChoices.length > 0;
                                        if (hasVariantChoices) {
                                            setModalAction('fav');
                                            setIsVariantModalOpen(true);
                                            setModalQuantity(1);
                                            setModalSelectedChoice(selectedVariantChoice || null);
                                        } else {
                                            await handleAddToFavorites();
                                        }
                                    }}
                                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    {isFavorite ? 
                                        <Favorite style={{ color: '#ff4081', fontSize: '1.5rem' }} /> : 
                                        <FavoriteBorder style={{ color: '#999', fontSize: '1.5rem' }} />
                                    }
                                </FavoriteButton>
                            </ProductHeader>
                            <Price>₱{Number(calculatedPrice || productData.price || 0).toFixed(2)}</Price>

                            {productData.soldCount != null && (
                                <SoldCount>Sold: {productData.soldCount}</SoldCount>
                            )}
                            
                            <Section>
                                <SectionTitle>Description</SectionTitle>
                                <DescriptionText>{productData.description}</DescriptionText>
                            </Section>

                            {/* Variant Choices (new schema) */}
                            {Array.isArray(productData.variantChoices) && productData.variantChoices.length > 0 && (
                                <Section>
                                    <SectionTitle>Choose a Variant</SectionTitle>
                                    {productData.variantChoices.map((variant) => (
                                        <div key={variant.variantName} style={{ marginBottom: 10 }}>
                                            <p style={{ margin: '0 0 8px', color: '#333' }}><strong>{variant.variantName}</strong></p>
                                            <div className="variant-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                                                {(variant.options || []).map((opt) => {
                                                    const active = selectedVariantChoice && selectedVariantChoice.optionName === opt.optionName && selectedVariantChoice.variantName === variant.variantName;
                                                    return (
                                                        <div
                                                            key={opt.optionName}
                                                            className={`variant-card${active ? ' active' : ''}`}
                                                            style={{
                                                                border: active ? '2px solid #007bff' : '1px solid #ccc',
                                                                borderRadius: 8,
                                                                textAlign: 'center',
                                                                padding: 10,
                                                                cursor: 'pointer',
                                                                transition: '0.3s',
                                                                background: active ? '#f0f8ff' : '#fff',
                                                                boxShadow: active ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'
                                                            }}
                                                            onClick={() => {
                                                                const sel = {
                                                                    variantName: variant.variantName,
                                                                    optionName: opt.optionName,
                                                                    price: Number(opt.price || 0),
                                                                    image: opt.image || '',
                                                                    stock: Number(opt.stock || 0),
                                                                };
                                                                setSelectedVariantChoice(sel);
                                                                setSelectedVariant(sel);
                                                            }}
                                                        >
                                                            {opt.image ? (
                                                                <img
                                                                    src={opt.image}
                                                                    alt={opt.optionName}
                                                                    style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6 }}
                                                                    onError={(e) => {
                                                                        e.currentTarget.onerror = null;
                                                                        e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"120\"><rect width=\"100%\" height=\"100%\" fill=\"%23eeeeee\"/><text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"%23999\" font-size=\"12\">No image</text></svg>';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div style={{ width: '100%', height: 80, background: '#f5f5f5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No image</div>
                                                            )}
                                                            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#333' }}>{opt.optionName}</p>
                                                            <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: '#f97316' }}>₱{Number(opt.price || 0).toFixed(2)}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    <style>{`
                                        .variant-card:hover { border-color: #007bff; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                                        @media (max-width: 600px) {
                                            .variant-grid { grid-template-columns: repeat(2, 1fr) !important; }
                                        }
                                    `}</style>
                                </Section>
                            )}

                            {/* Variant Selector (legacy mapping) */}
                            {Array.isArray(productData.variants) && productData.variants.length > 0 && (
                                <Section>
                                    <SectionTitle>Options</SectionTitle>
                                    <VariantSelector
                                        product={{
                                            ...productData,
                                            basePrice: productData.price,
                                            variants: (productData.variants || []).map(v => ({
                                                name: v.variantName || v.name,
                                                isRequired: true,
                                                allowMultiple: false,
                                                choices: (v.options || v.choices || []).map(o => ({
                                                    _id: o._id,
                                                    name: o.optionName || o.name,
                                                    image: o.image || '',
                                                    price: Number(o.price || 0),
                                                    stock: Number(o.stock || 0),
                                                    isAvailable: (o.stock || 0) > 0,
                                                }))
                                            }))
                                        }}
                                        onSelectionChange={(selections, isValid, price) => {
                                            setVariantSelections(selections);
                                            setIsSelectionsValid(isValid);
                                            setCalculatedPrice(price);
                                        }}
                                    />
                                </Section>
                            )}

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

                                    <AddToCartButton 
                                        onClick={() => {
                                            const hasVariantChoices = Array.isArray(productData?.variantChoices) && productData.variantChoices.length > 0;
                                            if (hasVariantChoices) {
                                                setModalAction('cart');
                                                setIsVariantModalOpen(true);
                                                setModalQuantity(1);
                                                setModalSelectedChoice(selectedVariantChoice || null);
                                            } else {
                                                handleAddToCart();
                                            }
                                        }}
                                        disabled={(() => {
                                            const hasVariants = Array.isArray(productData?.variants) && productData.variants.length > 0;
                                            const eff = getEffectiveStock();
                                            if (hasVariants && !isSelectionsValid) return true;
                                            if (eff === 0) return true;
                                            if (quantity > eff) return true;
                                            return false;
                                        })()}
                                        style={{ opacity: (() => {
                                            const hasVariants = Array.isArray(productData?.variants) && productData.variants.length > 0;
                                            const eff = getEffectiveStock();
                                            if (hasVariants && !isSelectionsValid) return 0.6;
                                            if (eff === 0) return 0.6;
                                            if (quantity > eff) return 0.6;
                                            return 1;
                                        })() }}
                                    >
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
                                                    <img src={displayImage} alt={displayName || 'Reviewer'} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', marginRight: 12, background: ' #eeeeee' }} loading="lazy" onError={e => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName || 'U'); }} />
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
                    {/* Related Products */}
                    {relatedProducts.length > 0 && (
                        <div style={{ marginTop: 24 }}>
                            <h3 style={{ color: '#333333', marginBottom: 12 }}>Related Products</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                                {relatedProducts.map((p) => (
                                    <button key={p._id} onClick={() => navigate(`/customer/product/${p._id}`)} style={{ border: '1px solid #eee', borderRadius: 10, padding: 10, textAlign: 'left', background: '#fff', cursor: 'pointer' }}>
                                        <img src={p.image} alt={p.name} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{p.name}</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f97316' }}>₱{Number(p.price || 0).toFixed(2)}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                </ContentContainer>
            </ScrollableContent>

            {/* Variant Picker Modal */}
            {isVariantModalOpen && (
                <ModalOverlay onClick={() => setIsVariantModalOpen(false)}>
                    <ModalPanel onClick={(e) => e.stopPropagation()}>
                        <ModalHeader>
                            <ModalTitle>{modalAction === 'cart' ? 'Select Variant & Quantity' : 'Select Variant'}</ModalTitle>
                            <ModalCloseBtn onClick={() => setIsVariantModalOpen(false)}>×</ModalCloseBtn>
                        </ModalHeader>

                        {Array.isArray(productData.variantChoices) && productData.variantChoices.length > 0 && (
                            <div>
                                {productData.variantChoices.map(variant => (
                                    <div key={variant.variantName} style={{ marginBottom: 10 }}>
                                        <p style={{ margin: '0 0 8px', color: '#333' }}><strong>{variant.variantName}</strong></p>
                                        <div className="variant-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                                            {(variant.options || []).map(opt => {
                                                const active = modalSelectedChoice && modalSelectedChoice.optionName === opt.optionName && modalSelectedChoice.variantName === variant.variantName;
                                                return (
                                                    <div
                                                        key={opt.optionName}
                                                        className={`variant-card${active ? ' active' : ''}`}
                                                        style={{
                                                            border: active ? '2px solid #007bff' : '1px solid #ccc',
                                                            borderRadius: 8,
                                                            textAlign: 'center',
                                                            padding: 10,
                                                            cursor: 'pointer',
                                                            transition: '0.3s',
                                                            background: active ? '#f0f8ff' : '#fff',
                                                            boxShadow: active ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'
                                                        }}
                                                        onClick={() => setModalSelectedChoice({
                                                            variantName: variant.variantName,
                                                            optionName: opt.optionName,
                                                            price: Number(opt.price || 0),
                                                            image: opt.image || '',
                                                            stock: Number(opt.stock || 0),
                                                        })}
                                                    >
                                                        {opt.image ? (
                                                            <img
                                                                src={opt.image}
                                                                alt={opt.optionName}
                                                                style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6 }}
                                                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"120\"><rect width=\"100%\" height=\"100%\" fill=\"%23eeeeee\"/><text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"%23999\" font-size=\"12\">No image</text></svg>'; }}
                                                            />
                                                        ) : (
                                                            <div style={{ width: '100%', height: 80, background: '#f5f5f5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No image</div>
                                                        )}
                                                        <p style={{ margin: '8px 0 0', fontSize: 13, color: '#333' }}>{opt.optionName}</p>
                                                        <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: '#f97316' }}>₱{Number(opt.price || 0).toFixed(2)}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                                <style>{`
                                    .variant-card:hover { border-color: #007bff; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                                    @media (max-width: 600px) {
                                        .variant-grid { grid-template-columns: repeat(2, 1fr) !important; }
                                    }
                                `}</style>
                            </div>
                        )}

                        {modalAction === 'cart' && (
                            <div style={{ marginTop: 10 }}>
                                <p style={{ margin: '0 0 6px', color: '#333' }}><strong>Quantity</strong></p>
                                <QuantitySelector>
                                    <QuantityButton onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}><MdRemove size={20} /></QuantityButton>
                                    <QuantityDisplay>{modalQuantity}</QuantityDisplay>
                                    <QuantityButton onClick={() => setModalQuantity(modalQuantity + 1)}><MdAdd size={20} /></QuantityButton>
                                </QuantitySelector>
                            </div>
                        )}

                        <ModalFooter>
                            <ConfirmBtn onClick={confirmVariantModal}>{modalAction === 'cart' ? 'Confirm and Add to Cart' : 'Confirm Favorite'}</ConfirmBtn>
                        </ModalFooter>
                    </ModalPanel>
                </ModalOverlay>
            )}
        </PageContainer>
    );
};

export default SingleProductPage;