import React, { useState, useEffect } from 'react';
import useDebouncedRefresh from '../hooks/useDebouncedRefresh';
import { useNavigate } from 'react-router-dom';
import { cart, order } from '../api';
import { SkeletonRow } from '../components/Skeletons';
import styled, { keyframes } from 'styled-components';
import {
    Container,
    Typography,
    Card,
    CardContent,
    IconButton,
    Divider,
    Alert,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from '@mui/material';
import { PrimaryButton } from '../components/Buttons';
import {
    Add,
    Remove,
    ArrowBack,
    LocationOn,
    DeleteOutline,
    Close as CloseIcon
} from '@mui/icons-material';
import OrderDetailsForm from '../components/OrderDetailsForm';
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

const SubtotalText = styled.span`
  font-size: 0.875rem;
  color: #666;
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

const CartContainer = styled.div`
  background-color:rgba(255, 255, 255, 0.58);
  height: 100vh;
  height: 100dvh; /* Use dynamic viewport height for mobile browsers */
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
  padding-bottom: 120px; /* Space for the fixed footer */
  
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
  padding: 8px 15px; /* Reduced top padding to bring first card closer to header */
  background: #ffffff;
  position: relative;
  min-height: 100%;
`;

const FormContainer = styled.div`
  width: 100%;
  padding: 8px 0; /* tighter vertical rhythm */
`;

const CartHeader = styled.div`
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

const ProductList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px; /* consistent 12–16px spacing between cards */
  margin-top: 8px;
`;

const ProductCard = styled(Card)`
  border-radius: 12px !important;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
  }
`;

const ProductCardContent = styled(CardContent)`
  display: flex;
  padding: 10px 12px !important; /* tighter padding */
  align-items: flex-start;
  background:rgba(37, 20, 20, 0.08);
  flex-wrap: wrap;
  gap: 8px;
  
  @media (max-width: 480px) {
    padding: 10px 12px !important;
    gap: 10px;
  }
`;

const ImageContainer = styled.div`
  width: 72px;
  height: 72px;
  min-width: 72px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    width: 64px;
    height: 64px;
    min-width: 64px;
    margin-right: 10px;
  }
`;

const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
`;

const ProductInfo = styled.div`
  flex: 1;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-right: 8px;
  
  @media (max-width: 480px) {
    min-width: 0;
    flex: 1 1 150px;
  }
`;

const ProductName = styled.span`
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px; /* tighter gap above subtotal */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  
  @media (max-width: 480px) {
    font-size: 0.95rem;
    -webkit-line-clamp: 2;
  }
`;

const ProductRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: auto;
  gap: 6px;
  min-width: 100px;
  
  @media (max-width: 480px) {
    flex-direction: row;
    align-items: center;
    width: 100%;
    justify-content: space-between;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #f0f0f0;
  }
`;

const ProductPrice = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  color: #ff8c00e0;
  white-space: nowrap;
  
  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 2px 6px;
  min-width: 100px;
  justify-content: space-between;
  min-height: 44px; /* ensure tap target */
  
  @media (max-width: 480px) {
    padding: 2px 6px;
    min-width: 96px;
  }
`;

const QuantityButton = styled(IconButton)`
  padding: 0 !important;
  color: #ff8c00e0 !important;
  width: 40px !important;  /* 44px tap area including parent padding */
  height: 40px !important;
  
  @media (max-width: 480px) {
    width: 36px !important;
    height: 36px !important;
  }
  
  .MuiSvgIcon-root {
    font-size: 1.1rem;
  }
`;

const QuantityValue = styled.span`
  min-width: 28px;
  text-align: center;
  font-weight: 500;
  font-size: 0.95rem;
  
  @media (max-width: 480px) {
    min-width: 24px;
  }
`;

const RemoveItemButton = styled(IconButton)`
  color: #999 !important;
  padding: 4px !important;
  margin-left: 8px !important;
  
  &:hover {
    color: #ff8c00e0 !important;
  }
`;

const Footer = styled.footer`
  position: fixed;
  bottom: 62px;
  left: 0;
  right: 0;
  background-color: #ffffff;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-height: 76px; /* sticky bar height */
`;

// Using shared PrimaryButton for consistent styling across app

const EmptyCartBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  text-align: center;
`;

const EmptyCartText = styled(Typography)`
  margin-bottom: 16px !important;
  color: #666;
`;

const AlertMessage = styled(Alert)`
  margin-bottom: 16px !important;
  border-radius: 8px !important;
`;

const CheckoutDialogTitleBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 8px;
`;

const CartPage = () => {
    const navigate = useNavigate();
    const [cartData, setCartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [selectedItems, setSelectedItems] = useState({});
    const [isDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showCheckoutForm, setShowCheckoutForm] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [cartCount, setCartCount] = useState(0);
    const CART_CACHE_KEY = 'bufood:cart';
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [updating, setUpdating] = useState({}); // productId -> boolean for in-flight quantity updates

    useEffect(() => {
        // Cache-first render
        let hadCache = false;
        try {
            const cached = JSON.parse(localStorage.getItem(CART_CACHE_KEY) || 'null');
            if (cached && typeof cached === 'object') {
                hadCache = true;
                setCartData(cached);
                const count = Array.isArray(cached?.items)
                    ? cached.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
                    : 0;
                setCartCount(count);
                const initialSelected = {};
                if (cached?.items) {
                    cached.items.forEach(item => {
                        if (item?.product?._id) initialSelected[item.product._id] = false;
                    });
                }
                setSelectedItems(initialSelected);
                setLoading(false);
            }
        } catch (_) {}

        fetchCart({ showLoader: !hadCache });
    }, []);

    const fetchCart = async ({ showLoader = true } = {}) => {
        try {
            setError(null);
            setSuccess(null);
            if (showLoader) setLoading(true);
            const response = await cart.viewCart();
            console.log('Cart response:', response); // Debug log
            setCartData(response);
            const count = Array.isArray(response?.items)
                ? response.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
                : 0;
            setCartCount(count);
            const initialSelected = {};
            if (response?.items) {
                response.items.forEach(item => {
                    initialSelected[item.product._id] = false;
                });
            }
            setSelectedItems(initialSelected);
            try { localStorage.setItem(CART_CACHE_KEY, JSON.stringify(response)); } catch (_) {}
        } catch (err) {
            console.error('Cart fetch error:', err);
            setError(err.message || 'Failed to fetch cart');
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    // Debounced background refresh on focus/visibility/interval
    const { doRefresh } = useDebouncedRefresh(async () => {
        setIsRefreshing(true);
        try {
            await fetchCart({ showLoader: false });
        } finally {
            setIsRefreshing(false);
        }
    }, { delayMs: 600, intervalMs: 30000 });

    const handleQuantityChange = async (productId, newQuantity) => {
        if (newQuantity < 1) return;
        // Optimistic update: update UI immediately to remove perceived delay
        try {
            if (cartData && Array.isArray(cartData.items)) {
                const newItems = cartData.items.map(it =>
                    it?.product?._id === productId ? { ...it, quantity: newQuantity } : it
                );
                const newCart = { ...cartData, items: newItems };
                setCartData(newCart);
                // Recompute and update cart count
                const count = newItems.reduce((sum, it) => sum + (it.quantity || 0), 0);
                setCartCount(count);
                try { localStorage.setItem(CART_CACHE_KEY, JSON.stringify(newCart)); } catch (_) {}
            }
            setUpdating(prev => ({ ...prev, [productId]: true }));
            // Sync with server in background
            await cart.updateCartItem(productId, newQuantity);
            // Silent refresh without loader to reconcile any server-side changes like pricing, promos, etc.
            await fetchCart({ showLoader: false });
            setSuccess('Quantity updated successfully');
        } catch (err) {
            // Re-sync cart to correct any optimistic mismatch
            await fetchCart({ showLoader: false });
            setError(err?.message || 'Failed to update quantity');
        } finally {
            setUpdating(prev => ({ ...prev, [productId]: false }));
        }
    };

    const handleSelectItem = (productId) => {
        setSelectedItems(prev => ({
            ...prev,
            [productId]: !prev[productId]
        }));
    };

    const getSelectedTotal = () => {
        if (!cartData?.items) return 0;
        return cartData.items.reduce((total, item) => {
            if (selectedItems[item.product._id]) {
                return total + (item.product.price * item.quantity);
            }
            return total;
        }, 0);
    };

    const getSelectedCount = () => {
        return Object.values(selectedItems).filter(Boolean).length;
    };

    const handleGoBack = () => {
        navigate('/customer/home');
    };

    const handleCheckout = () => {
        const selectedItemIds = Object.entries(selectedItems)
            .filter(([, isSelected]) => isSelected)
            .map(([productId]) => productId);

        if (selectedItemIds.length === 0) {
            setError('No items selected');
            return;
        }

        // Get selected items with their details
        const selectedCartItems = cartData.items.filter(item => selectedItems[item.product._id]);
        const selectedTotal = getSelectedTotal();

        // Navigate to order summary page with selected items data
        navigate('/customer/order-summary', {
            state: {
                cartItems: selectedCartItems,
                totalAmount: selectedTotal
            }
        });
    };

    const handlePlaceOrder = async (orderDetails) => {
        try {
            setLoading(true);
            setError(null);

            // Create the order first if we don't have an orderId
            if (!orderId) {
                const checkoutResult = await order.checkoutFromCart(orderDetails.orderType);
                if (checkoutResult.orders && checkoutResult.orders.length > 0) {
                    setOrderId(checkoutResult.orders[0]._id);
                } else {
                    throw new Error('Failed to create order');
                }
            }

            // Place the order with the details
            await order.placeOrder(orderId, orderDetails);
            navigate('/customer/orders', { 
                state: { 
                    success: true, 
                    message: 'Order placed successfully!' 
                }
            });
        } catch (err) {
            console.error('Order error:', err);
            setError(err.message || 'Failed to place order');
        } finally {
            setLoading(false);
            setShowCheckoutForm(false);
        }
    };

    const navigateToProduct = (productId) => {
        navigate(`/customer/product/${productId}`);
    };

    const handleRemoveItem = async (productId) => {
        try {
            setError(null);
            await cart.removeFromCart(productId);
            await fetchCart({ showLoader: false }); // background refresh to avoid flicker
            setSuccess('Item removed from cart');
        } catch (err) {
            console.error('Remove item error:', err);
            setError(err.message || 'Failed to remove item from cart');
        }
    };


    return (
        <CartContainer>
            {/* Custom Header */}
            <CartHeader>
                <BackButton onClick={handleGoBack}>
                    <ArrowBack />
                </BackButton>
                <HeaderTitle>
                    Shopping Cart ({cartData?.items?.length || 0})
                </HeaderTitle>
                <RefreshButton
                    aria-label="Refresh"
                    onClick={fetchCart}
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
            </CartHeader>
            <ToolbarSpacer />

            <ScrollableContent>
                <ContentWrapper>
                    <FormContainer>
                        {error && (
                            <AlertMessage severity="error">
                                {error}
                            </AlertMessage>
                        )}

                        {success && (
                            <AlertMessage severity="success">
                                {success}
                            </AlertMessage>
                        )}

                        {!loading && (!cartData?.items || cartData.items.length === 0) && (
                            <EmptyCartBox>
                                <EmptyCartText variant="h6">
                                    Your cart is empty
                                </EmptyCartText>
                                <PrimaryButton onClick={() => navigate('/customer/home')}>
                                    Continue Shopping
                                </PrimaryButton>
                            </EmptyCartBox>
                        )}

                        <ProductList>
                            {loading && (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <SkeletonRow key={`cart-skeleton-initial-${i}`} height={96} />
                                ))
                            )}
                            {isRefreshing && cartData?.items && cartData.items.length > 0 && (
                                Array.from({ length: Math.min(3, cartData.items.length) }).map((_, i) => (
                                    <SkeletonRow key={`cart-skeleton-${i}`} height={96} />
                                ))
                            )}
                            {cartData?.items && cartData.items.length > 0 ? (
                                cartData.items.map((item) => (
                                    <ProductCard key={item.product._id}>
                                        <ProductCardContent>
                                            <Checkbox 
                                                checked={selectedItems[item.product._id]}
                                                onChange={() => handleSelectItem(item.product._id)}
                                                style={{ marginRight: 1 }}
                                            />
                                            <ImageContainer>
                                                <ProductImage 
                                                    src={item.product.image} 
                                                    alt={item.product.name}
                                                    onClick={() => navigateToProduct(item.product._id)}
                                                    loading="lazy"
                                                />
                                            </ImageContainer>
                                            <ProductInfo>
                                                <ProductName>{item.product.name}</ProductName>
                                                <SubtotalText>
                                                    ₱{Number(item.product.price).toFixed(0)} × {item.quantity} = ₱{(item.product.price * item.quantity).toFixed(0)}
                                                </SubtotalText>
                                            </ProductInfo>
                                            <ProductRight>
                                                <ProductPrice>₱{(item.product.price * item.quantity).toFixed(0)}</ProductPrice>
                                                <QuantityControl aria-busy={!!updating[item.product._id]}>
                                                    <QuantityButton 
                                                        size={window.innerWidth < 600 ? "small" : "medium"}
                                                        onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                                                        disabled={!!updating[item.product._id]}
                                                    >
                                                        <Remove />
                                                    </QuantityButton>
                                                    <QuantityValue>{item.quantity}</QuantityValue>
                                                    <QuantityButton 
                                                        size={window.innerWidth < 600 ? "small" : "medium"}
                                                        onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                                                        disabled={!!updating[item.product._id]}
                                                    >
                                                        <Add />
                                                    </QuantityButton>
                                                </QuantityControl>
                                                <RemoveItemButton
                                                    onClick={() => handleRemoveItem(item.product._id)}
                                                >
                                                    <CloseIcon />
                                                </RemoveItemButton>
                                            </ProductRight>
                                        </ProductCardContent>
                                    </ProductCard>
                                ))
                            ) : null}
                        </ProductList>
                    </FormContainer>
                </ContentWrapper>
            </ScrollableContent>

            <Footer>
                <div>
                    <Typography variant="body2" color="text.secondary">
                        Selected Items: {getSelectedCount()}
                    </Typography>
                    <Typography variant="h5" style={{ fontWeight: 800, color: '#ff8c00' }}>
                        Total: ₱{getSelectedTotal().toFixed(2)}
                    </Typography>
                </div>
                <PrimaryButton onClick={handleCheckout} disabled={getSelectedCount() === 0}>
                    Checkout
                </PrimaryButton>
            </Footer>

            {/* Dialogs */}
            <Dialog
                id="delete-confirmation-dialog"
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
                open={showDeleteDialog}
                onClose={() => !isDeleting && setShowDeleteDialog(false)}
                sx={{
                    '& .MuiDialog-paper': {
                        borderRadius: '12px',
                        padding: '16px',
                        maxWidth: '500px',
                        width: '90%',
                        margin: '16px',
                    },
                }}
            >
                <DialogTitle id="delete-dialog-title" sx={{ p: 0, mb: 2, fontSize: '1.25rem', fontWeight: 600 }}>
                    Remove Items from Cart
                </DialogTitle>
                <DialogContent sx={{ p: 0, mb: 2 }}>
                    <Typography id="delete-dialog-description">
                        Are you sure you want to remove {getSelectedCount()} selected item(s) from your cart?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 0, justifyContent: 'flex-end' }}>
                    <Button 
                        id="cancel-delete-button"
                        name="cancel-delete"
                        onClick={() => setShowDeleteDialog(false)} 
                        disabled={isDeleting}
                        sx={{ 
                            color: 'gray',
                            textTransform: 'none',
                            fontWeight: 500,
                            '&:hover': {
                                backgroundColor: 'transparent',
                            }
                        }}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Checkout Form Dialog */}
            <Dialog
                open={showCheckoutForm}
                onClose={() => setShowCheckoutForm(false)}
                maxWidth="md"
                fullWidth
                disablePortal
                keepMounted={false}
                aria-labelledby="checkout-dialog-title"
                sx={{
                    '& .MuiDialog-paper': {
                        borderRadius: '12px',
                        maxWidth: '800px',
                        width: '90%',
                        margin: '16px',
                    },
                }}
            >
                <DialogTitle id="checkout-dialog-title" sx={{ p: 0 }}>
                    <CheckoutDialogTitleBar>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Checkout</Typography>
                        <IconButton 
                            onClick={() => setShowCheckoutForm(false)}
                            aria-label="close dialog"
                            size="small"
                            sx={{
                                color: 'text.secondary',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                }
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </CheckoutDialogTitleBar>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <OrderDetailsForm
                        onSubmit={handlePlaceOrder}
                        loading={loading}
                        totalAmount={getSelectedTotal()}
                        selectedItems={cartData?.items?.filter(item => selectedItems[item.product._id])}
                    />
                </DialogContent>
            </Dialog>
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
              <div className="navItem activeNavItem" onClick={() => navigate('/customer/cart')} style={{ position: 'relative' }}>
                <MdShoppingCart size={24} className="activeNavIcon" />
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
        </CartContainer>
    );
};

export default CartPage;