import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cart, order } from '../api';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Grid,
    IconButton,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Alert,
} from '@mui/material';
import { Add, Remove, Delete } from '@mui/icons-material';

const CartPage = () => {
    const navigate = useNavigate();
    const [cartData, setCartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
    const [checkoutData, setCheckoutData] = useState({
        customerName: '',
        contactNumber: '',
        deliveryLocation: '',
        paymentMethod: 'COD'
    });
    const [orderId, setOrderId] = useState(null);

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const data = await cart.viewCart();
            setCartData(data);
        } catch (err) {
            setError(err.message || 'Failed to fetch cart');
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = async (productId, newQuantity) => {
        try {
            if (newQuantity < 1) {
                await cart.removeFromCart(productId);
            } else {
                await cart.updateCartItem(productId, newQuantity);
            }
            fetchCart();
        } catch (err) {
            setError(err.message || 'Failed to update quantity');
        }
    };

    const handleRemoveItem = async (productId) => {
        try {
            await cart.removeFromCart(productId);
            fetchCart();
        } catch (err) {
            setError(err.message || 'Failed to remove item');
        }
    };

    const handleCheckout = async () => {
        try {
            const checkoutResult = await order.checkoutFromCart();
            setOrderId(checkoutResult.order._id);
            setCheckoutDialogOpen(true);
        } catch (err) {
            setError(err.message || 'Failed to checkout');
        }
    };

    const handlePlaceOrder = async () => {
        try {
            await order.placeOrder(orderId, checkoutData);
            navigate('/orders');
        } catch (err) {
            setError(err.message || 'Failed to place order');
        }
    };

    if (loading) return <Box>Loading cart...</Box>;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>Shopping Cart</Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}

            {(!cartData?.items || cartData.items.length === 0) ? (
                <Typography>Your cart is empty</Typography>
            ) : (
                <>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                            {cartData.items.map((item) => (
                                <Card key={item.product._id} sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item xs={12} sm={3}>
                                                <img 
                                                    src={item.product.image} 
                                                    alt={item.product.name}
                                                    style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={9}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <div>
                                                        <Typography variant="h6">{item.product.name}</Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Price: ₱{item.product.price.toFixed(2)}
                                                        </Typography>
                                                    </div>
                                                    <IconButton 
                                                        color="error" 
                                                        onClick={() => handleRemoveItem(item.product._id)}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 1 }}>
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                                                    >
                                                        <Remove />
                                                    </IconButton>
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleQuantityChange(item.product._id, parseInt(e.target.value))}
                                                        sx={{ width: 60 }}
                                                        inputProps={{ min: 1 }}
                                                    />
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                                                    >
                                                        <Add />
                                                    </IconButton>
                                                    <Typography variant="body1" sx={{ ml: 2 }}>
                                                        Subtotal: ₱{item.subtotal.toFixed(2)}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            ))}
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Order Summary</Typography>
                                    <Divider sx={{ my: 2 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography>Total Items:</Typography>
                                        <Typography>{cartData.items.reduce((acc, item) => acc + item.quantity, 0)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6">Total Amount:</Typography>
                                        <Typography variant="h6">₱{cartData.total.toFixed(2)}</Typography>
                                    </Box>
                                    <Button 
                                        variant="contained" 
                                        color="primary" 
                                        fullWidth
                                        onClick={handleCheckout}
                                    >
                                        Proceed to Checkout
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Dialog open={checkoutDialogOpen} onClose={() => setCheckoutDialogOpen(false)}>
                        <DialogTitle>Complete Your Order</DialogTitle>
                        <DialogContent>
                            <TextField
                                label="Full Name"
                                fullWidth
                                margin="normal"
                                value={checkoutData.customerName}
                                onChange={(e) => setCheckoutData(prev => ({ ...prev, customerName: e.target.value }))}
                                required
                            />
                            <TextField
                                label="Contact Number"
                                fullWidth
                                margin="normal"
                                value={checkoutData.contactNumber}
                                onChange={(e) => setCheckoutData(prev => ({ ...prev, contactNumber: e.target.value }))}
                                required
                            />
                            <TextField
                                label="Delivery Location"
                                fullWidth
                                margin="normal"
                                value={checkoutData.deliveryLocation}
                                onChange={(e) => setCheckoutData(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                                required
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setCheckoutDialogOpen(false)}>Cancel</Button>
                            <Button 
                                onClick={handlePlaceOrder} 
                                variant="contained"
                                disabled={!checkoutData.customerName || !checkoutData.contactNumber || !checkoutData.deliveryLocation}
                            >
                                Place Order
                            </Button>
                        </DialogActions>
                    </Dialog>
                </>
            )}
        </Container>
    );
};

export default CartPage;