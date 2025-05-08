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
    CircularProgress,
    Paper,
    Stepper,
    Step,
    StepLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
} from '@mui/material';
import {
    Add,
    Remove,
    Delete,
    ShoppingCart,
    LocalShipping,
    Payment,
    CheckCircle
} from '@mui/icons-material';

const steps = ['Cart Review', 'Delivery Details', 'Payment Method'];

const CartPage = () => {
    const navigate = useNavigate();
    const [cartData, setCartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
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
            setCheckoutDialogOpen(false);
            navigate('/orders');
        } catch (err) {
            setError(err.message || 'Failed to place order');
        }
    };

    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress sx={{ color: '#FF8C00' }} />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
                Shopping Cart
            </Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
            )}

            {(!cartData?.items || cartData.items.length === 0) ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <ShoppingCart sx={{ fontSize: 60, color: '#FF8C00', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>Your cart is empty</Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/customer/home')}
                        sx={{
                            mt: 2,
                            bgcolor: '#FF8C00',
                            '&:hover': { bgcolor: '#FF6B00' }
                        }}
                    >
                        Browse Products
                    </Button>
                </Paper>
            ) : (
                <>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={8}>
                            {cartData.items.map((item) => (
                                <Card key={item.product._id} sx={{ 
                                    mb: 2,
                                    transition: 'transform 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }
                                }}>
                                    <CardContent>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item xs={12} sm={3}>
                                                <Box
                                                    component="img"
                                                    src={item.product.image}
                                                    alt={item.product.name}
                                                    sx={{
                                                        width: '100%',
                                                        height: 'auto',
                                                        borderRadius: 2,
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={9}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <Box>
                                                        <Typography variant="h6">{item.product.name}</Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                            Price: ₱{item.product.price.toFixed(2)}
                                                        </Typography>
                                                    </Box>
                                                    <IconButton 
                                                        color="error" 
                                                        onClick={() => handleRemoveItem(item.product._id)}
                                                        sx={{ '&:hover': { transform: 'scale(1.1)' } }}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 1 }}>
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                                                        sx={{ bgcolor: '#f5f5f5' }}
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
                                                        sx={{ bgcolor: '#f5f5f5' }}
                                                    >
                                                        <Add />
                                                    </IconButton>
                                                    <Typography variant="body1" sx={{ ml: 2, fontWeight: 'bold' }}>
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
                            <Card sx={{ position: 'sticky', top: 80 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                        Order Summary
                                    </Typography>
                                    <Divider sx={{ my: 2 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography>Total Items:</Typography>
                                        <Typography>{cartData.items.reduce((acc, item) => acc + item.quantity, 0)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total Amount:</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FF8C00' }}>
                                            ₱{cartData.total.toFixed(2)}
                                        </Typography>
                                    </Box>
                                    <Button 
                                        variant="contained" 
                                        fullWidth
                                        onClick={handleCheckout}
                                        sx={{
                                            mt: 2,
                                            bgcolor: '#FF8C00',
                                            '&:hover': { bgcolor: '#FF6B00' }
                                        }}
                                    >
                                        Proceed to Checkout
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Checkout Dialog */}
                    <Dialog 
                        open={checkoutDialogOpen} 
                        onClose={() => setCheckoutDialogOpen(false)}
                        maxWidth="sm"
                        fullWidth
                    >
                        <DialogTitle sx={{ pb: 0 }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                Complete Your Order
                            </Typography>
                        </DialogTitle>
                        <DialogContent>
                            <Stepper activeStep={activeStep} sx={{ py: 4 }}>
                                {steps.map((label) => (
                                    <Step key={label}>
                                        <StepLabel>{label}</StepLabel>
                                    </Step>
                                ))}
                            </Stepper>

                            {activeStep === 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="h6" gutterBottom>Order Details</Typography>
                                    {cartData.items.map((item) => (
                                        <Box key={item.product._id} sx={{ mb: 2 }}>
                                            <Typography>{item.product.name} x {item.quantity}</Typography>
                                            <Typography color="text.secondary">
                                                ₱{item.subtotal.toFixed(2)}
                                            </Typography>
                                        </Box>
                                    ))}
                                    <Divider sx={{ my: 2 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="h6">Total:</Typography>
                                        <Typography variant="h6" color="primary">
                                            ₱{cartData.total.toFixed(2)}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                            {activeStep === 1 && (
                                <Box sx={{ mt: 2 }}>
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
                                        multiline
                                        rows={3}
                                    />
                                </Box>
                            )}

                            {activeStep === 2 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="h6" gutterBottom>Payment Method</Typography>
                                    <RadioGroup
                                        value={checkoutData.paymentMethod}
                                        onChange={(e) => setCheckoutData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                    >
                                        <FormControlLabel 
                                            value="COD" 
                                            control={<Radio />} 
                                            label="Cash on Delivery"
                                        />
                                        <FormControlLabel 
                                            value="GCASH" 
                                            control={<Radio />} 
                                            label="GCash"
                                            disabled
                                        />
                                    </RadioGroup>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 3 }}>
                            {activeStep > 0 && (
                                <Button onClick={handleBack}>
                                    Back
                                </Button>
                            )}
                            {activeStep === steps.length - 1 ? (
                                <Button
                                    variant="contained"
                                    onClick={handlePlaceOrder}
                                    disabled={!checkoutData.customerName || !checkoutData.contactNumber || !checkoutData.deliveryLocation}
                                    sx={{
                                        bgcolor: '#FF8C00',
                                        '&:hover': { bgcolor: '#FF6B00' }
                                    }}
                                >
                                    Place Order
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    onClick={handleNext}
                                    sx={{
                                        bgcolor: '#FF8C00',
                                        '&:hover': { bgcolor: '#FF6B00' }
                                    }}
                                >
                                    Next
                                </Button>
                            )}
                        </DialogActions>
                    </Dialog>
                </>
            )}
        </Container>
    );
};

export default CartPage;