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
    Close,
} from '@mui/icons-material';

const CartPage = () => {
    const navigate = useNavigate();
    const [cartData, setCartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItems, setSelectedItems] = useState({});
    const [deleteItemId, setDeleteItemId] = useState(null);

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const data = await cart.viewCart();
            setCartData(data);
            const initialSelected = {};
            data.items.forEach(item => {
                initialSelected[item.product._id] = false;
            });
            setSelectedItems(initialSelected);
        } catch (err) {
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

    const handleDeleteItem = async () => {
        try {
            if (!deleteItemId) return;
            await cart.removeFromCart(deleteItemId);
            setDeleteItemId(null);
            fetchCart();
        } catch (err) {
            setError(err.message || 'Failed to delete item from cart');
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
                <IconButton onClick={() => navigate(-1)}>
                    <ArrowBack />
                </IconButton>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Shopping Cart ({cartData?.items?.length || 0})
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="body2">Your Location</Typography>
                    </Box>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}

            {/* Product List */}
            {cartData?.items?.map((item) => (
                <Card key={item.product._id} sx={styles.productCard}>
                    <CardContent>
                        <Box sx={styles.productContainer}>
                            <IconButton 
                                size="small" 
                                onClick={() => setDeleteItemId(item.product._id)}
                                sx={styles.deleteButton}
                            >
                                <Close />
                            </IconButton>
                            <Checkbox 
                                checked={selectedItems[item.product._id]}
                                onChange={() => handleSelectItem(item.product._id)}
                            />
                            <Box component="img" 
                                src={item.product.image} 
                                alt={item.product.name}
                                sx={styles.productImage}
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
            ))}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={Boolean(deleteItemId)}
                onClose={() => setDeleteItemId(null)}
            >
                <DialogTitle>Remove Item</DialogTitle>
                <DialogContent>
                    Are you sure you want to remove this item from your cart?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteItemId(null)}>Cancel</Button>
                    <Button onClick={handleDeleteItem} color="error" autoFocus>
                        Remove
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
                            // Handle checkout
                            console.log('Proceeding to checkout with selected items');
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
        borderRadius: 1
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