import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cart, order } from '../api';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    IconButton,
    Divider,
    Alert,
    CircularProgress,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    AppBar,
    Toolbar,
} from '@mui/material';
import {
    Add,
    Remove,
    ArrowBack,
    LocationOn,
    DeleteOutline,
    Close as CloseIcon
} from '@mui/icons-material';
import OrderDetailsForm from '../components/OrderDetailsForm';

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

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            setError(null);
            setSuccess(null);
            const response = await cart.viewCart();
            console.log('Cart response:', response); // Debug log
            setCartData(response);
            const initialSelected = {};
            if (response?.items) {
                response.items.forEach(item => {
                    initialSelected[item.product._id] = false;
                });
            }
            setSelectedItems(initialSelected);
        } catch (err) {
            console.error('Cart fetch error:', err);
            setError(err.message || 'Failed to fetch cart');
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = async (productId, newQuantity) => {
        try {
            if (newQuantity < 1) return;
            await cart.updateCartItem(productId, newQuantity);
            fetchCart();
            setSuccess('Quantity updated successfully');
        } catch (err) {
            setError(err.message || 'Failed to update quantity');
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
            await fetchCart(); // Refresh cart after removal
            setSuccess('Item removed from cart');
        } catch (err) {
            console.error('Remove item error:', err);
            setError(err.message || 'Failed to remove item from cart');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress sx={{ color: '#FF385C' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <AppBar 
                position="fixed" 
                color="inherit" 
                elevation={1}
                sx={{
                    top: 0,
                    bgcolor: 'white'
                }}
            >
                <Toolbar sx={{ px: { xs: 1, sm: 2, md: 4 }, minHeight: { xs: '56px', sm: '64px' } }}>
                    <IconButton 
                        edge="start" 
                        onClick={handleGoBack}
                        sx={styles.backButton}
                    >
                        <ArrowBack />
                    </IconButton>
                    <Box sx={{ flex: 1 }}>
                        <Typography 
                            variant="h6" 
                            sx={styles.headerTitle}
                        >
                            Shopping Cart ({cartData?.items?.length || 0})
                        </Typography>
                        <Box sx={styles.locationText}>
                            <LocationOn sx={{ fontSize: { xs: 14, sm: 16 }, mr: 0.5 }} />
                            <Typography 
                                variant="body2"
                                sx={styles.locationText}
                            >
                                Your Location
                            </Typography>
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>
            <Toolbar sx={{ minHeight: { xs: '56px', sm: '64px' } }} />

            {/* Scrollable Content Area */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    px: { xs: 1, sm: 2, md: 4 },
                    pb: { xs: '100px', sm: '80px' },
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    justifyContent: 'center'
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: '800px', // Maximum width for better readability
                        py: { xs: 1, sm: 2 }
                    }}
                >
                    {error && (
                        <Alert 
                            severity="error" 
                            sx={{ 
                                mb: 2,
                                fontSize: { xs: '0.875rem', sm: '1rem' } 
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert 
                            severity="success" 
                            sx={{ 
                                mb: 2,
                                fontSize: { xs: '0.875rem', sm: '1rem' } 
                            }}
                        >
                            {success}
                        </Alert>
                    )}

                    {/* Empty Cart Message */}
                    {(!cartData?.items || cartData.items.length === 0) && (
                        <Box
                            sx={{
                                textAlign: 'center',
                                py: 4,
                                bgcolor: 'white',
                                borderRadius: 2,
                                boxShadow: 1
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    color: 'text.secondary',
                                    mb: 2
                                }}
                            >
                                Your cart is empty
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => navigate('/customer/home')}
                                sx={{
                                    bgcolor: '#FF385C',
                                    '&:hover': {
                                        bgcolor: '#FF1744'
                                    }
                                }}
                            >
                                Continue Shopping
                            </Button>
                        </Box>
                    )}

                    {/* Product List */}
                    <Box sx={styles.productList}>
                        {cartData?.items?.map((item) => (
                            <Card key={item.product._id} sx={styles.productCard}>
                                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                                    <Box sx={styles.productContainer}>
                                        <Checkbox 
                                            checked={selectedItems[item.product._id]}
                                            onChange={() => handleSelectItem(item.product._id)}
                                            sx={{ p: { xs: 0.5, sm: 1 } }}
                                        />
                                        <Box 
                                            component="img" 
                                            src={item.product.image} 
                                            alt={item.product.name}
                                            sx={styles.productImage}
                                            onClick={() => navigateToProduct(item.product._id)}
                                        />
                                        <Box sx={styles.productInfo}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Box>
                                                    <Typography 
                                                        variant="subtitle1"
                                                        sx={styles.productName}
                                                    >
                                                        {item.product.name}
                                                    </Typography>
                                                    <Typography 
                                                        variant="h6" 
                                                        color="error"
                                                        sx={styles.productPrice}
                                                    >
                                                        ₱{item.product.price.toFixed(2)}
                                                    </Typography>
                                                </Box>
                                                <IconButton
                                                    onClick={() => handleRemoveItem(item.product._id)}
                                                    sx={styles.removeItemButton}
                                                >
                                                    <CloseIcon sx={{ 
                                                        fontSize: { xs: '1.1rem', sm: '1.25rem' },
                                                        color: 'text.secondary'
                                                    }} />
                                                </IconButton>
                                            </Box>
                                            <Box sx={styles.quantityControl}>
                                                <IconButton 
                                                    size={window.innerWidth < 600 ? "small" : "medium"}
                                                    onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                                                    sx={styles.quantityButton}
                                                >
                                                    <Remove sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />
                                                </IconButton>
                                                <Typography sx={{ px: { xs: 1, sm: 2 } }}>
                                                    {item.quantity}
                                                </Typography>
                                                <IconButton 
                                                    size={window.innerWidth < 600 ? "small" : "medium"}
                                                    onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                                                    sx={styles.quantityButton}
                                                >
                                                    <Add sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />
                                                </IconButton>
                                            </Box>
                                            <Typography 
                                                variant="body2" 
                                                color="text.secondary"
                                                sx={styles.subtotalText}
                                            >
                                                Subtotal: ₱{(item.product.price * item.quantity).toFixed(2)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* Fixed Footer */}
            <Box sx={styles.footer}>
                <Box>
                    <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                        Selected Items: {getSelectedCount()}
                    </Typography>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            fontWeight: 'bold', 
                            color: '#FF385C',
                            fontSize: { xs: '1.1rem', sm: '1.25rem' }
                        }}
                    >
                        Total: ₱{getSelectedTotal().toFixed(2)}
                    </Typography>
                </Box>
                <Button
                    onClick={handleCheckout}
                    disabled={getSelectedCount() === 0}
                    sx={{
                        ...styles.checkoutButton,
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    Checkout
                </Button>
            </Box>

            {/* Dialogs */}
            <Dialog
                id="delete-confirmation-dialog"
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
                open={showDeleteDialog}
                onClose={() => !isDeleting && setShowDeleteDialog(false)}
                sx={styles.deleteDialog}
            ><DialogTitle id="delete-dialog-title" sx={{ pb: 2 }}>
                    Remove Items from Cart
                </DialogTitle>
                <DialogContent sx={{ py: 2 }}>
                    <Typography id="delete-dialog-description">
                        Are you sure you want to remove {getSelectedCount()} selected item(s) from your cart?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ pt: 2 }}>
                    <Button 
                        id="cancel-delete-button"
                        name="cancel-delete"
                        onClick={() => setShowDeleteDialog(false)} 
                        disabled={isDeleting}
                        sx={{ color: 'text.secondary' }}
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
                sx={{
                    '& .MuiDialog-paper': {
                        m: 2,
                        maxHeight: 'calc(100% - 32px)'
                    }
                }}
                aria-labelledby="checkout-dialog-title"
            >
                <DialogTitle id="checkout-dialog-title">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Checkout</Typography>
                        <IconButton 
                            onClick={() => setShowCheckoutForm(false)}
                            aria-label="close dialog"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <OrderDetailsForm
                        onSubmit={handlePlaceOrder}
                        loading={loading}
                        totalAmount={getSelectedTotal()}
                        selectedItems={cartData?.items?.filter(item => selectedItems[item.product._id])}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

// Styles
const styles = {
    productList: {
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 1, sm: 2 },
        width: '100vw',
    },
    productCard: {
        width: '100%',
        mb: 0, // Remove margin bottom since we're using gap
        borderRadius: { xs: 1, sm: 2 },
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }
    },
    productContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 2 },
        width: '100%'
    },
    productImage: {
        width: { xs: 60, sm: 80 },
        height: { xs: 60, sm: 80 },
        objectFit: 'cover',
        borderRadius: 1,
        cursor: 'pointer'
    },
    productInfo: {
        flex: 1,
        '& > *': { mb: { xs: 0.5, sm: 1 } }
    },
    quantityControl: {
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        width: 'fit-content',
        mt: { xs: 0.5, sm: 1 }
    },
    footer: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: 'white',
        borderTop: '1px solid #e0e0e0',
        p: { xs: 1.5, sm: 2 },
        px: { xs: 2, sm: 3, md: 4 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1300,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
    },
    checkoutButton: {
        bgcolor: '#FF385C',
        color: 'white',
        border: 'none',
        borderRadius: { xs: 1.5, sm: 2 },
        py: { xs: 1, sm: 1.5 },
        px: { xs: 3, sm: 4 },
        fontSize: { xs: '0.875rem', sm: '1rem' },
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
            bgcolor: '#FF1744',
            transform: 'translateY(-1px)'
        },
        '&:disabled': {
            bgcolor: '#ccc',
            cursor: 'not-allowed',
            transform: 'none'
        }
    },
    // New button styles
    backButton: {
        mr: { xs: 1, sm: 2 },
        color: 'text.primary',
        '&:hover': {
            bgcolor: 'action.hover'
        }
    },
    removeItemButton: {
        p: { xs: 0.5, sm: 1 },
        transition: 'all 0.2s ease',
        '&:hover': {
            color: 'error.main',
            bgcolor: 'error.lighter',
            transform: 'scale(1.1)'
        }
    },
    quantityButton: {
        transition: 'all 0.2s ease',
        '&:hover': {
            bgcolor: 'primary.lighter'
        },
        '& .MuiSvgIcon-root': {
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }
    },
    // Dialog styles
    deleteDialog: {
        '& .MuiDialog-paper': {
            width: '100%',
            maxWidth: { xs: '90%', sm: '400px' },
            p: { xs: 1.5, sm: 2 },
            m: { xs: 2, sm: 'auto' }
        }
    },
    // Typography styles
    productName: {
        fontSize: { xs: '0.9rem', sm: '1rem' },
        fontWeight: 'medium',
        mb: 1
    },
    productPrice: {
        fontSize: { xs: '1.1rem', sm: '1.25rem' },
        fontWeight: 'bold',
        color: 'error.main'
    },
    subtotalText: {
        fontSize: { xs: '0.8rem', sm: '0.875rem' },
        color: 'text.secondary',
        mt: { xs: 0.5, sm: 1 }
    },
    headerTitle: {
        fontWeight: 'bold',
        fontSize: { xs: '1.1rem', sm: '1.25rem' }
    },
    locationText: {
        fontSize: { xs: '0.75rem', sm: '0.875rem' },
        color: 'text.secondary',
        display: 'flex',
        alignItems: 'center',
        mt: 0.5,
        '& .MuiSvgIcon-root': {
            fontSize: { xs: 14, sm: 16 },
            mr: 0.5
        }
    }
};

export default CartPage;