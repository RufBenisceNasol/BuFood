import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { product } from '../api';
import {
    Container,
    Typography,
    Box,
    Card,
    CardMedia,
    CardContent,
    Grid,
    Chip,
    CircularProgress,
    Alert,
    Button
} from '@mui/material';
import { ShoppingCart, Star } from '@mui/icons-material';

const HomePage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const productsData = await product.getAllProducts();
            setProducts(productsData);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const getFeaturedProducts = () => {
        return products.slice(0, 3); // Get first 3 products as featured
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        navigate('/login');
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
            {/* Welcome Section */}
            <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" component="h1" 
                        sx={{ 
                            fontWeight: 'bold',
                            background: 'linear-gradient(45deg, #FF8C00 30%, #FF6B00 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        Welcome to BuFood{user?.name ? `, ${user.name}` : ''}! 🍽️
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                        Discover delicious food from local sellers
                    </Typography>
                </Box>
                <Button 
                    variant="contained"
                    onClick={handleLogout}
                    sx={{
                        bgcolor: '#FF8C00',
                        '&:hover': { bgcolor: '#FF6B00' },
                        height: 'fit-content'
                    }}
                >
                    Logout
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
            )}

            {/* Featured Products Section */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                    Featured Items
                </Typography>
                <Grid container spacing={3}>
                    {getFeaturedProducts().map((product) => (
                        <Grid item xs={12} sm={6} md={4} key={product._id}>
                            <Card 
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.3s, box-shadow 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: '0 8px 20px rgba(255, 140, 0, 0.2)'
                                    }
                                }}
                            >
                                <Box sx={{ position: 'relative' }}>
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={product.image}
                                        alt={product.name}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 16,
                                            left: 16,
                                            display: 'flex',
                                            gap: 1
                                        }}
                                    >
                                        <Chip
                                            icon={<Star sx={{ color: '#FFD700 !important' }} />}
                                            label="Featured"
                                            sx={{
                                                bgcolor: 'rgba(0, 0, 0, 0.7)',
                                                color: '#fff',
                                                '& .MuiChip-icon': { color: '#fff' }
                                            }}
                                        />
                                    </Box>
                                </Box>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography gutterBottom variant="h6" component="h2">
                                        {product.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {product.description?.substring(0, 100)}...
                                    </Typography>
                                    <Typography variant="h6" color="primary" gutterBottom>
                                        ₱{product.price.toFixed(2)}
                                    </Typography>
                                </CardContent>
                                <Button
                                    variant="contained"
                                    component={Link}
                                    to={`/product/${product._id}`}
                                    sx={{
                                        m: 2,
                                        bgcolor: '#FF8C00',
                                        '&:hover': {
                                            bgcolor: '#FF6B00'
                                        }
                                    }}
                                    startIcon={<ShoppingCart />}
                                >
                                    View Details
                                </Button>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* All Products Section */}
            <Box>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                    All Products
                </Typography>
                <Grid container spacing={3}>
                    {products.map((product) => (
                        <Grid item xs={12} sm={6} md={3} key={product._id}>
                            <Card 
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.3s, box-shadow 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: '0 8px 20px rgba(255, 140, 0, 0.2)'
                                    }
                                }}
                            >
                                <CardMedia
                                    component="img"
                                    height="160"
                                    image={product.image}
                                    alt={product.name}
                                />
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography gutterBottom variant="h6" component="h2">
                                        {product.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {product.description?.substring(0, 60)}...
                                    </Typography>
                                    <Typography variant="h6" color="primary" gutterBottom>
                                        ₱{product.price.toFixed(2)}
                                    </Typography>
                                    <Chip
                                        label={product.availability}
                                        color={product.availability === 'Available' ? 'success' : 'error'}
                                        size="small"
                                        sx={{ mb: 1 }}
                                    />
                                </CardContent>
                                <Button
                                    variant="contained"
                                    component={Link}
                                    to={`/product/${product._id}`}
                                    sx={{
                                        m: 2,
                                        bgcolor: '#FF8C00',
                                        '&:hover': {
                                            bgcolor: '#FF6B00'
                                        }
                                    }}
                                    startIcon={<ShoppingCart />}
                                >
                                    View Details
                                </Button>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Container>
    );
};

export default HomePage;