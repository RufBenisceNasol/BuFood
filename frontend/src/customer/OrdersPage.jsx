import React, { useState, useEffect } from 'react';
import { order } from '../api';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Grid,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    StepConnector,
    styled,
    Tabs,
    Tab
} from '@mui/material';
import {
    LocalShipping,
    CheckCircle,
    Cancel,
    AccessTime,
    Receipt,
    ArrowBack
} from '@mui/icons-material';

const ColorlibConnector = styled(StepConnector)(() => ({
    [`&.MuiStepConnector-alternativeLabel`]: {
        top: 22,
    },
    [`&.MuiStepConnector-active`]: {
        [`& .MuiStepConnector-line`]: {
            backgroundImage: 'linear-gradient(95deg, #FF8C00 0%, #FF6B00 100%)',
        },
    },
    [`&.MuiStepConnector-completed`]: {
        [`& .MuiStepConnector-line`]: {
            backgroundImage: 'linear-gradient(95deg, #FF8C00 0%, #FF6B00 100%)',
        },
    },
    [`& .MuiStepConnector-line`]: {
        height: 3,
        border: 0,
        backgroundColor: '#eaeaf0',
        borderRadius: 1,
    },
}));

const ColorlibStepIconRoot = styled('div')(({ ownerState }) => ({
    backgroundColor: '#ccc',
    zIndex: 1,
    color: '#fff',
    width: 50,
    height: 50,
    display: 'flex',
    borderRadius: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    ...(ownerState.active && {
        backgroundImage: 'linear-gradient(136deg, #FF8C00 0%, #FF6B00 100%)',
        boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
    }),
    ...(ownerState.completed && {
        backgroundImage: 'linear-gradient(136deg, #FF8C00 0%, #FF6B00 100%)',
    }),
}));

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [currentTab, setCurrentTab] = useState(0);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const result = await order.getCustomerOrders();
            setOrders(result.data.orders);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            setError(error.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (orderId) => {
        try {
            await order.cancelOrderByCustomer(orderId);
            fetchOrders();
        } catch (err) {
            setError(err.message || 'Failed to cancel order');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending': return <AccessTime />;
            case 'Placed': return <Receipt />;
            case 'Shipped': return <LocalShipping />;
            case 'Delivered': return <CheckCircle />;
            case 'Canceled': return <Cancel />;
            default: return <AccessTime />;
        }
    };

    const getStatusStep = (status) => {
        switch (status) {
            case 'Pending': return 0;
            case 'Placed': return 1;
            case 'Shipped': return 2;
            case 'Delivered': return 3;
            case 'Canceled': return -1;
            default: return 0;
        }
    };

    const orderSteps = ['Pending', 'Placed', 'Shipped', 'Delivered'];

    const filterOrdersByStatus = (status) => {
        return orders.filter(order => {
            if (status === 0) return order.status === 'Pending';
            if (status === 1) return order.status === 'Placed';
            if (status === 2) return order.status === 'Shipped';
            if (status === 3) return order.status === 'Delivered';
            if (status === 4) return order.status === 'Canceled';
            return true;
        });
    };

    const getTabLabel = (status, count) => {
        return `${status} (${count})`;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress sx={{ color: '#FF8C00' }} />
            </Box>
        );
    }

    const pendingOrders = filterOrdersByStatus(0);
    const placedOrders = filterOrdersByStatus(1);
    const shippedOrders = filterOrdersByStatus(2);
    const deliveredOrders = filterOrdersByStatus(3);
    const canceledOrders = filterOrdersByStatus(4);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Button 
                    startIcon={<ArrowBack />} 
                    onClick={() => window.history.back()}
                    sx={{ mr: 2 }}
                >
                    Back
                </Button>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    My Orders
                </Typography>
            </Box>
            
            {error && (
                <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
            )}

            <Paper sx={{ mb: 4 }}>
                <Tabs 
                    value={currentTab} 
                    onChange={(e, newValue) => setCurrentTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': {
                            minWidth: 'auto',
                            px: 3,
                            py: 2
                        }
                    }}
                >
                    <Tab label={getTabLabel('Pending', pendingOrders.length)} />
                    <Tab label={getTabLabel('Placed', placedOrders.length)} />
                    <Tab label={getTabLabel('Shipped', shippedOrders.length)} />
                    <Tab label={getTabLabel('Delivered', deliveredOrders.length)} />
                    <Tab label={getTabLabel('Canceled', canceledOrders.length)} />
                </Tabs>
            </Paper>

            <Box>
                {filterOrdersByStatus(currentTab).length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Receipt sx={{ fontSize: 60, color: '#FF8C00', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>No orders found</Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            You don't have any {['pending', 'placed', 'shipped', 'delivered', 'canceled'][currentTab]} orders
                        </Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={2}>
                        {filterOrdersByStatus(currentTab).map((order) => (
                            <Grid item xs={12} key={order._id}>
                                <Card sx={{
                                    transition: 'transform 0.3s, box-shadow 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }
                                }}>
                                    <CardContent>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={8}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="h6">
                                                        Order #{order._id.slice(-6)}
                                                    </Typography>
                                                    <Box>
                                                        <Chip 
                                                            icon={getStatusIcon(order.status)}
                                                            label={order.status}
                                                            color={order.status === 'Canceled' ? 'error' : 'primary'}
                                                            sx={{
                                                                mr: 1,
                                                                bgcolor: order.status === 'Canceled' ? '#f44336' : '#FF8C00'
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>

                                                {order.status !== 'Canceled' && (
                                                    <Box sx={{ width: '100%', mb: 3 }}>
                                                        <Stepper 
                                                            alternativeLabel 
                                                            activeStep={getStatusStep(order.status)}
                                                            connector={<ColorlibConnector />}
                                                        >
                                                            {orderSteps.map((label) => (
                                                                <Step key={label}>
                                                                    <StepLabel
                                                                        StepIconComponent={(props) => (
                                                                            <ColorlibStepIconRoot {...props}>
                                                                                {getStatusIcon(label)}
                                                                            </ColorlibStepIconRoot>
                                                                        )}
                                                                    >
                                                                        {label}
                                                                    </StepLabel>
                                                                </Step>
                                                            ))}
                                                        </Stepper>
                                                    </Box>
                                                )}
                                                
                                                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                                    <Button
                                                        variant="outlined"
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setDetailsOpen(true);
                                                        }}
                                                        sx={{
                                                            borderColor: '#FF8C00',
                                                            color: '#FF8C00',
                                                            '&:hover': {
                                                                borderColor: '#FF6B00',
                                                                backgroundColor: 'rgba(255, 140, 0, 0.1)'
                                                            }
                                                        }}
                                                    >
                                                        View Details
                                                    </Button>
                                                    {['Pending', 'Placed'].includes(order.status) && (
                                                        <Button
                                                            variant="outlined"
                                                            color="error"
                                                            onClick={() => {
                                                                if (window.confirm('Are you sure you want to cancel this order?')) {
                                                                    handleCancel(order._id);
                                                                }
                                                            }}
                                                        >
                                                            Cancel Order
                                                        </Button>
                                                    )}
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Paper sx={{ p: 2, bgcolor: '#f8f8f8' }}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Order Summary
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Payment Status:
                                                        </Typography>
                                                        <Chip 
                                                            label={order.paymentStatus}
                                                            size="small"
                                                            color={order.paymentStatus === 'Paid' ? 'success' : 'warning'}
                                                        />
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                                        <Typography variant="subtitle2">
                                                            Total Amount:
                                                        </Typography>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#FF8C00' }}>
                                                            ₱{order.totalAmount.toFixed(2)}
                                                        </Typography>
                                                    </Box>
                                                </Paper>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>

            {/* Order Details Dialog */}
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Order Details
                    <IconButton
                        aria-label="close"
                        onClick={() => setDetailsOpen(false)}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedOrder && (
                        <>
                            <Box sx={{ mb: 4, mt: 2 }}>
                                <Typography variant="h6" gutterBottom sx={{ color: '#FF8C00' }}>
                                    Delivery Information
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Name
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {selectedOrder.customerName}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Contact
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {selectedOrder.contactNumber}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Delivery Address
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {selectedOrder.deliveryLocation}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>

                            <Typography variant="h6" gutterBottom sx={{ color: '#FF8C00', mb: 2 }}>
                                Order Items
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Item</TableCell>
                                            <TableCell align="right">Price</TableCell>
                                            <TableCell align="right">Quantity</TableCell>
                                            <TableCell align="right">Subtotal</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedOrder.items.map((item) => (
                                            <TableRow key={item._id}>
                                                <TableCell>{item.product.name}</TableCell>
                                                <TableCell align="right">₱{item.price.toFixed(2)}</TableCell>
                                                <TableCell align="right">{item.quantity}</TableCell>
                                                <TableCell align="right">₱{(item.price * item.quantity).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                                                Total Amount:
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: '#FF8C00' }}>
                                                ₱{selectedOrder.totalAmount.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default OrdersPage;