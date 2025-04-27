import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cart, product, order } from '../api';
import {
    Container,
    Grid,
    Card,
    CardMedia,
    Typography,
    Button,
    Box,
    TextField,
    Snackbar,
    Alert,
    Chip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    RadioGroup,
    FormControlLabel,
    Radio
} from '@mui/material';
import { 
    ShoppingCart, 
    LocalShipping,
    AccessTime
} from '@mui/icons-material';

const ProductPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
    const [checkoutData, setCheckoutData] = useState({
        customerName: '',
        contactNumber: '',
        deliveryLocation: '',
        paymentMethod: 'COD'
    });
    const [orderId, setOrderId] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const fetchProduct = useCallback(async () => {
        if (!id) return;
        try {
            const productData = await product.getProductById(id);
            setSelectedProduct(productData);
        } catch (err) {
            setError(err.message || 'Failed to fetch product');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    const handleQuantityChange = (value) => {
        const newValue = Math.max(1, parseInt(value) || 1);
        setQuantity(newValue);
    };

    const handleAddToCart = async () => {
        try {
            await cart.addToCart(selectedProduct._id, quantity);
            setSnackbar({
                open: true,
                message: 'Added to cart successfully!',
                severity: 'success'
            });
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.message || 'Failed to add to cart',
                severity: 'error'
            });
        }
    };

    const handleOrderNow = async () => {
        try {
            const checkoutResult = await order.checkoutFromProduct(selectedProduct._id, quantity);
            setOrderId(checkoutResult.order._id);
            setCheckoutDialogOpen(true);
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.message || 'Failed to checkout',
                severity: 'error'
            });
        }
    };

    const handlePlaceOrder = async () => {
        try {
            await order.placeOrder(orderId, checkoutData);
            setCheckoutDialogOpen(false);
            setSnackbar({
                open: true,
                message: 'Order placed successfully!',
                severity: 'success'
            });
            navigate('/orders');
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.message || 'Failed to place order',
                severity: 'error'
            });
        }
    };

    if (loading) return (
        <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: 'calc(100vh - 64px)'
        }}>
            <CircularProgress sx={{ color: '#FF8C00' }} />
        </Box>
    );

    if (error) return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Alert severity="error">{error}</Alert>
        </Container>
    );

    if (!selectedProduct) return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Alert severity="info">Product not found</Alert>
        </Container>
    );

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Grid container spacing={4}>
                {/* Product Image */}
                <Grid item xs={12} md={6}>
                    <Card 
                        elevation={0}
                        sx={{ 
                            bgcolor: 'transparent',
                            height: '100%'
                        }}
                    >
                        <CardMedia
                            component="img"
                            image={selectedProduct.image}
                            alt={selectedProduct.name}
                            sx={{ 
                                borderRadius: 2,
                                maxHeight: 500,
                                width: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    </Card>
                </Grid>

                {/* Product Details */}
                <Grid item xs={12} md={6}>
                    <Box>
                        <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 'bold' }}>
                            {selectedProduct.name}
                        </Typography>
                        
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                color: '#FF8C00',
                                fontWeight: 'bold',
                                mb: 3
                            }}
                        >
                            ₱{selectedProduct.price.toFixed(2)}
                        </Typography>

                        <Chip
                            label={selectedProduct.availability}
                            color={selectedProduct.availability === 'Available' ? 'success' : 'error'}
                            sx={{ mb: 3 }}
                        />

                        <Typography 
                            variant="body1" 
                            sx={{ 
                                mb: 4,
                                color: 'text.secondary',
                                lineHeight: 1.8
                            }}
                        >
                            {selectedProduct.description}
                        </Typography>

                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Quantity:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <TextField
                                    type="number"
                                    size="small"
                                    value={quantity}
                                    onChange={(e) => handleQuantityChange(e.target.value)}
                                    inputProps={{ min: 1 }}
                                    sx={{ width: 100 }}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<ShoppingCart />}
                                    onClick={handleAddToCart}
                                    disabled={selectedProduct.availability === 'Out of Stock'}
                                    sx={{
                                        bgcolor: '#FF8C00',
                                        '&:hover': {
                                            bgcolor: '#FF6B00'
                                        },
                                        flexGrow: 1,
                                        py: 1.5
                                    }}
                                >
                                    Add to Cart
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleOrderNow}
                                    disabled={selectedProduct.availability === 'Out of Stock'}
                                    sx={{
                                        bgcolor: '#FF8C00',
                                        '&:hover': {
                                            bgcolor: '#FF6B00'
                                        },
                                        flexGrow: 1,
                                        py: 1.5
                                    }}
                                >
                                    Order Now
                                </Button>
                            </Box>
                        </Box>

                        {/* Delivery Info */}
                        <Box sx={{ bgcolor: '#f8f8f8', p: 3, borderRadius: 2 }}>
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                                Delivery Information:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                                <LocalShipping sx={{ color: '#FF8C00' }} />
                                <Typography variant="body2">
                                    Free Delivery within 5km
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <AccessTime sx={{ color: '#FF8C00' }} />
                                <Typography variant="body2">
                                    Delivery time: 30-45 minutes
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
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
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setCheckoutDialogOpen(false)}>Cancel</Button>
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
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            >
                <Alert 
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ProductPage;