import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Button,
    Paper,
} from '@mui/material';
import { CheckCircleOutline, ShoppingBag } from '@mui/icons-material';

const SuccessOrderMessagePage = () => {
    const navigate = useNavigate();

    const handleViewOrders = () => {
        navigate('/customer/orders');
    };

    const handleContinueShopping = () => {
        navigate('/customer/home');
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f5f5f5',
                py: 4
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        borderRadius: 2,
                        bgcolor: 'white'
                    }}
                >
                    <CheckCircleOutline
                        sx={{
                            fontSize: 100,
                            color: 'success.main',
                            mb: 3
                        }}
                    />
                    
                    <Typography variant="h4" gutterBottom sx={{ 
                        color: 'success.main', 
                        fontWeight: 'bold',
                        mb: 2
                    }}>
                        Order Successfully Submitted!
                    </Typography>
                    
                    <Typography variant="h6" sx={{ 
                        color: '#666',
                        mb: 4,
                        fontWeight: 'normal'
                    }}>
                        Please wait for the seller to confirm your order
                    </Typography>

                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        justifyContent: 'center',
                        mt: 4
                    }}>
                        <Button
                            variant="contained"
                            onClick={handleViewOrders}
                            startIcon={<ShoppingBag />}
                            sx={{
                                bgcolor: '#FF385C',
                                '&:hover': {
                                    bgcolor: '#FF1744'
                                },
                                px: 4,
                                py: 1.5,
                                flex: { xs: '1', sm: 'initial' }
                            }}
                        >
                            View My Orders
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={handleContinueShopping}
                            sx={{
                                color: '#FF385C',
                                borderColor: '#FF385C',
                                '&:hover': {
                                    borderColor: '#FF1744',
                                    bgcolor: 'rgba(255, 56, 92, 0.04)'
                                },
                                px: 4,
                                py: 1.5,
                                flex: { xs: '1', sm: 'initial' }
                            }}
                        >
                            Continue Shopping
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default SuccessOrderMessagePage; 