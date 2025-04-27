import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { store, product } from '../api';
import { 
    Box, 
    Grid, 
    Card, 
    CardContent, 
    CardMedia, 
    Typography, 
    Container,
    Tabs,
    Tab,
    Button,
    CardActions,
    Rating
} from '@mui/material';

const HomePage = () => {
    const [stores, setStores] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [storesData, productsData] = await Promise.all([
                store.getAllStores(),
                product.getAllProducts()
            ]);
            setStores(storesData);
            setProducts(productsData);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    if (loading) return <Box sx={{ p: 3, textAlign: 'center' }}>Loading...</Box>;
    if (error) return <Box sx={{ p: 3, color: "error.main", textAlign: 'center' }}>{error}</Box>;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} centered>
                    <Tab label="Products" />
                    <Tab label="Stores" />
                </Tabs>
            </Box>

            {tabValue === 0 && (
                <>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Available Products
                    </Typography>
                    <Grid container spacing={3}>
                        {products.map((product) => (
                            <Grid item xs={12} sm={6} md={4} key={product._id}>
                                <Card sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: '0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        boxShadow: 3
                                    }
                                }}>
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={product.image || '/default-product.jpg'}
                                        alt={product.name}
                                    />
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography gutterBottom variant="h6" component="h2">
                                            {product.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {product.description}
                                        </Typography>
                                        <Typography variant="h6" color="primary">
                                            ${product.price.toFixed(2)}
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Button 
                                            component={Link} 
                                            to={`/product/${product._id}`}
                                            size="small" 
                                            color="primary"
                                            fullWidth
                                        >
                                            View Details
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}

            {tabValue === 1 && (
                <>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Food Stores
                    </Typography>
                    <Grid container spacing={3}>
                        {stores.map((store) => (
                            <Grid item xs={12} sm={6} md={4} key={store._id}>
                                <Card sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: '0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        boxShadow: 3
                                    }
                                }}>
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={store.image || '/default-store.jpg'}
                                        alt={store.storeName}
                                    />
                                    <CardContent>
                                        <Typography gutterBottom variant="h5" component="h2">
                                            {store.storeName}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Products: {store.products?.length || 0}
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Button 
                                            component={Link} 
                                            to={`/store/${store._id}`}
                                            size="small" 
                                            color="primary"
                                            fullWidth
                                        >
                                            Visit Store
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}
        </Container>
    );
};

export default HomePage;