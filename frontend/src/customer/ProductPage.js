import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { store, cart } from '../api';
import {
    Container,
    Grid,
    Card,
    CardMedia,
    CardContent,
    Typography,
    Button,
    Box,
    TextField,
    Snackbar,
    Alert,
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';

const ProductPage = () => {
    const { id } = useParams();
    const [storeData, setStoreData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantities, setQuantities] = useState({});
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const fetchStoreData = useCallback(async () => {
        try {
            const data = await store.getStoreById(id);
            setStoreData(data);
            // Initialize quantities for each product
            const initialQuantities = {};
            data.products.forEach(product => {
                initialQuantities[product._id] = 1;
            });
            setQuantities(initialQuantities);
        } catch (err) {
            setError(err.message || 'Failed to fetch store data');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchStoreData();
    }, [fetchStoreData]);

    const handleQuantityChange = (productId, value) => {
        const newValue = Math.max(1, parseInt(value) || 1);
        setQuantities(prev => ({
            ...prev,
            [productId]: newValue
        }));
    };

    const handleAddToCart = async (product) => {
        try {
            await cart.addToCart(product._id, quantities[product._id]);
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

    if (loading) return <Box>Loading store details...</Box>;
    if (error) return <Box color="error.main">{error}</Box>;
    if (!storeData) return <Box>Store not found</Box>;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Store Header */}
            <Box sx={{ mb: 4 }}>
                <CardMedia
                    component="img"
                    height="200"
                    image={storeData.bannerImage || storeData.image}
                    alt={storeData.storeName}
                    sx={{ borderRadius: 2, mb: 2 }}
                />
                <Typography variant="h4" component="h1" gutterBottom>
                    {storeData.storeName}
                </Typography>
            </Box>

            {/* Products Grid */}
            <Grid container spacing={3}>
                {storeData.products.map((product) => (
                    <Grid item xs={12} sm={6} md={4} key={product._id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardMedia
                                component="img"
                                height="200"
                                image={product.image}
                                alt={product.name}
                            />
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography gutterBottom variant="h6" component="h2">
                                    {product.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    {product.description}
                                </Typography>
                                <Typography variant="h6" color="primary" gutterBottom>
                                    ₱{product.price.toFixed(2)}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                                    <TextField
                                        type="number"
                                        size="small"
                                        value={quantities[product._id]}
                                        onChange={(e) => handleQuantityChange(product._id, e.target.value)}
                                        inputProps={{ min: 1 }}
                                        sx={{ width: 100 }}
                                    />
                                    <Button
                                        variant="contained"
                                        startIcon={<ShoppingCart />}
                                        onClick={() => handleAddToCart(product)}
                                        disabled={product.availability === 'Out of Stock'}
                                        fullWidth
                                    >
                                        Add to Cart
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            >
                <Alert 
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ProductPage;