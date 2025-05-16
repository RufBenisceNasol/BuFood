import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cart } from '../api';
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
} from '@mui/material';
import {
    Add,
    Remove,
    ArrowBack,
    LocationOn,
    DeleteOutline,
} from '@mui/icons-material';

const CartPage = () => {
    const navigate = useNavigate();
    const [cartData, setCartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [selectedItems, setSelectedItems] = useState({});
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

    const handleBulkDelete = async () => {
        try {
            setIsDeleting(true);
            setError(null);
            setSuccess(null);

            const selectedItemIds = Object.entries(selectedItems)
                .filter(([, isSelected]) => isSelected)
                .map(([productId]) => productId);

            if (selectedItemIds.length === 0) {
                setError('No items selected');
                return;
            }

            // Remove each selected item one by one
            for (const productId of selectedItemIds) {
                const response = await cart.removeFromCart(productId);
                if (!response) {
                    throw new Error('Failed to delete item from cart');
                }
            }

            setShowDeleteDialog(false);
            await fetchCart(); // This will refresh the cart state
            setSelectedItems({}); // Reset selections
            setSuccess('Selected items have been removed from your cart');

        } catch (err) {
            console.error('Delete error:', err);
            setError(err.message || 'Failed to delete items from cart');
        } finally {
            setIsDeleting(false);
        }
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

    const navigateToCheckout = () => {
        navigate('/customer/checkout');
    };

    const navigateToProduct = (productId) => {
        navigate(`/customer/product/${productId}`);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress sx={{ color: '#FF385C' }} />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ pb: 8 }}>
            {/* Header */}
            <Box sx={styles.header}>
                <IconButton onClick={handleGoBack}>
                    <ArrowBack />
                </IconButton>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Shopping Cart ({cartData?.items?.length || 0})
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="body2">Your Location</Typography>
                    </Box>
                </Box>
                {getSelectedCount() > 0 && (
                    <IconButton 
                        color="error"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isDeleting}
                        sx={{ 
                            '&:hover': { 
                                bgcolor: 'rgba(211, 47, 47, 0.04)' 
                            }
                        }}
                    >
                        <DeleteOutline />
                    </IconButton>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
            )}

            {/* Product List */}
            {cartData?.items?.map((item) => (
                <Card key={item.product._id} sx={styles.productCard}>
                    <CardContent>
                        <Box sx={styles.productContainer}>
                            <Checkbox 
                                checked={selectedItems[item.product._id]}
                                onChange={() => handleSelectItem(item.product._id)}
                            />
                            <Box component="img" 
                                src={item.product.image} 
                                alt={item.product.name}
                                sx={styles.productImage}
                                onClick={() => navigateToProduct(item.product._id)}
                            />
                            <Box sx={styles.productInfo}>
                                <Typography variant="subtitle1">{item.product.name}</Typography>
                                <Typography variant="h6" color="error">
                                    ₱{item.product.price.toFixed(2)}
                                </Typography>
                                <Box sx={styles.quantityControl}>
                                    <IconButton 
                                        size="small"
                                        onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                                    >
                                        <Remove />
                                    </IconButton>
                                    <Typography sx={{ px: 2 }}>{item.quantity}</Typography>
                                    <IconButton 
                                        size="small"
                                        onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                                    >
                                        <Add />
                                    </IconButton>
                                </Box>
                                <Typography variant="body1" color="text.secondary">
                                    Subtotal: ₱{(item.product.price * item.quantity).toFixed(2)}
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            ))}            {/* Delete Confirmation Dialog */}            <Dialog
                id="delete-confirmation-dialog"
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
                open={showDeleteDialog}
                onClose={() => !isDeleting && setShowDeleteDialog(false)}
                sx={{
                    '& .MuiDialog-paper': {
                        width: '100%',
                        maxWidth: '400px',
                        p: 2
                    }
                }}
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
                    <Button 
                        id="confirm-delete-button"
                        name="confirm-delete"
                        onClick={handleBulkDelete} 
                        color="error" 
                        variant="contained"
                        autoFocus 
                        disabled={isDeleting}
                        aria-label="Confirm delete items"
                    >
                        {isDeleting ? 'Removing...' : 'Remove'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Footer - Total Amount */}
            <Box sx={styles.footer}>
                <Box>
                    <Typography variant="body2" color="text.secondary">
                        Selected Items: {getSelectedCount()}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FF385C' }}>
                        Total: ₱{getSelectedTotal().toFixed(2)}
                    </Typography>
                </Box>
                <Box
                    component="button"
                    onClick={() => {
                        if (getSelectedCount() > 0) {
                            navigateToCheckout();
                        }
                    }}
                    sx={styles.checkoutButton}
                    disabled={getSelectedCount() === 0}
                >
                    Checkout ({getSelectedCount()})
                </Box>
            </Box>
        </Container>
    );
};

// Styles
const styles = {
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 2,
        position: 'sticky',
        top: 0,
        bgcolor: 'white',
        zIndex: 100
    },
    productCard: {
        mb: 2,
        borderRadius: 2,
        position: 'relative',
        '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }
    },
    productContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: 2
    },
    productImage: {
        width: 80,
        height: 80,
        objectFit: 'cover',
        borderRadius: 1,
        cursor: 'pointer'
    },
    productInfo: {
        flex: 1,
        '& > *': { mb: 1 }
    },
    quantityControl: {
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        width: 'fit-content'
    },
    footer: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: 'white',
        borderTop: '1px solid #e0e0e0',
        p: 2,
        px: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 100
    },
    checkoutButton: {
        bgcolor: '#FF385C',
        color: 'white',
        border: 'none',
        borderRadius: 2,
        py: 1.5,
        px: 4,
        fontSize: '1rem',
        cursor: 'pointer',
        '&:hover': {
            bgcolor: '#FF1744'
        },
        '&:disabled': {
            bgcolor: '#ccc',
            cursor: 'not-allowed'
        }
    },
    deleteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        color: 'text.secondary',
        '&:hover': {
            color: 'error.main'
        }
    }
};

export default CartPage;