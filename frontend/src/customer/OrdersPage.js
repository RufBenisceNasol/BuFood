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
} from '@mui/material';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await order.getCustomerOrders();
            setOrders(data.orders);
        } catch (err) {
            setError(err.message || 'Failed to fetch orders');
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'warning';
            case 'Placed': return 'info';
            case 'Shipped': return 'primary';
            case 'Delivered': return 'success';
            case 'Canceled': return 'error';
            default: return 'default';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'Paid': return 'success';
            case 'Unpaid': return 'error';
            case 'Pending': return 'warning';
            default: return 'default';
        }
    };

    if (loading) return <Box>Loading orders...</Box>;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>My Orders</Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}

            {orders.length === 0 ? (
                <Typography>No orders found</Typography>
            ) : (
                <Grid container spacing={2}>
                    {orders.map((order) => (
                        <Grid item xs={12} key={order._id}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6">
                                            Order #{order._id.slice(-6)}
                                        </Typography>
                                        <Box>
                                            <Chip 
                                                label={order.status} 
                                                color={getStatusColor(order.status)}
                                                sx={{ mr: 1 }}
                                            />
                                            <Chip 
                                                label={order.paymentStatus}
                                                color={getPaymentStatusColor(order.paymentStatus)}
                                            />
                                        </Box>
                                    </Box>
                                    
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Total Amount: ₱{order.totalAmount.toFixed(2)}
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setDetailsOpen(true);
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
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Order Details Dialog */}
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Order Details #{selectedOrder?._id.slice(-6)}
                </DialogTitle>
                <DialogContent>
                    {selectedOrder && (
                        <>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1">Delivery Information</Typography>
                                <Typography variant="body2">Name: {selectedOrder.customerName}</Typography>
                                <Typography variant="body2">Contact: {selectedOrder.contactNumber}</Typography>
                                <Typography variant="body2">Address: {selectedOrder.deliveryLocation}</Typography>
                                <Typography variant="body2">Payment Method: {selectedOrder.paymentMethod}</Typography>
                            </Box>

                            <TableContainer component={Paper}>
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
                                                <TableCell align="right">₱{item.priceAtPurchase.toFixed(2)}</TableCell>
                                                <TableCell align="right">{item.quantity}</TableCell>
                                                <TableCell align="right">₱{item.subtotal.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell colSpan={3} align="right">
                                                <strong>Total:</strong>
                                            </TableCell>
                                            <TableCell align="right">
                                                <strong>₱{selectedOrder.totalAmount.toFixed(2)}</strong>
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