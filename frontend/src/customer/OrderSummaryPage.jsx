import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { order } from '../api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    Box,
    Container,
    Typography,
    Paper,
    Radio,
    RadioGroup,
    FormControlLabel,
    TextField,
    Button,
    CircularProgress,
    Divider,
    Card,
    CardContent,
    AppBar,
    Toolbar,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { ArrowBack, CheckCircleOutline } from '@mui/icons-material';

const OrderSummaryPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { cartItems, totalAmount } = location.state || { cartItems: [], totalAmount: 0 };
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        orderType: 'Delivery',
        paymentMethod: 'Cash on Delivery',
        deliveryDetails: {
            receiverName: '',
            contactNumber: '',
            building: '',
            roomNumber: '',
            additionalInstructions: ''
        },
        pickupDetails: {
            contactNumber: '',
            pickupTime: new Date().toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        },
        notes: ''
    });

    const handleGoBack = () => {
        navigate('/customer/cart');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('deliveryDetails.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                deliveryDetails: {
                    ...prev.deliveryDetails,
                    [field]: value
                }
            }));
        } else if (name.includes('pickupDetails.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                pickupDetails: {
                    ...prev.pickupDetails,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            
            if (formData.orderType === 'Pickup') {
                const [hours, minutes] = formData.pickupDetails.pickupTime.split(':').map(Number);
                const pickupDateTime = new Date();
                pickupDateTime.setHours(hours, minutes, 0);

                if (pickupDateTime <= new Date()) {
                    toast.error('Please select a future time for pickup');
                    setLoading(false);
                    return;
                }

                if (!formData.pickupDetails.contactNumber) {
                    toast.error('Contact number is required');
                    setLoading(false);
                    return;
                }
            }

            const orderData = {
                orderType: formData.orderType,
                paymentMethod: formData.paymentMethod,
                selectedItems: cartItems.map(item => item.product._id),
                notes: formData.notes
            };

            if (formData.orderType === 'Delivery') {
                orderData.deliveryDetails = {
                    receiverName: formData.deliveryDetails.receiverName,
                    contactNumber: formData.deliveryDetails.contactNumber,
                    building: formData.deliveryDetails.building,
                    roomNumber: formData.deliveryDetails.roomNumber,
                    additionalInstructions: formData.deliveryDetails.additionalInstructions
                };
            } else {
                // For pickup orders
                const [hours, minutes] = formData.pickupDetails.pickupTime.split(':');
                const pickupDate = new Date();
                pickupDate.setHours(hours, minutes, 0, 0);
                
                orderData.pickupDetails = {
                    contactNumber: formData.pickupDetails.contactNumber,
                    pickupTime: pickupDate.toISOString()
                };
            }

            console.log('Submitting order data:', orderData);
            await order.createOrderFromCart(orderData);
            toast.success('Order placed successfully!');
            navigate('/customer/success-order');
        } catch (err) {
            console.error('Order submission error:', err);
            toast.error(err.message || 'Failed to create order');
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f5f5f5' }}>
            <ToastContainer />
            
            {/* Header */}
            <AppBar position="fixed" color="inherit" elevation={1}>
                <Toolbar>
                    <IconButton edge="start" onClick={handleGoBack} sx={{ mr: 2 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6">Order Summary</Typography>
                </Toolbar>
            </AppBar>
            <Toolbar /> {/* Spacer */}

            {/* Scrollable Content */}
            <Box sx={{ flex: 1, overflow: 'auto', pb: '80px' }}>
                <Container maxWidth="md" sx={{ py: 3 }}>
                    {/* Order Items Summary */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Order Items</Typography>
                            {cartItems.map((item) => (
                                <Box key={item.product._id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <img 
                                            src={item.product.image} 
                                            alt={item.product.name}
                                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                                        />
                                        <Box>
                                            <Typography variant="subtitle1">{item.product.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Quantity: {item.quantity}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="subtitle1">₱{(item.product.price * item.quantity).toFixed(2)}</Typography>
                                </Box>
                            ))}
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle1">Total Amount:</Typography>
                                <Typography variant="h6" color="primary">₱{totalAmount.toFixed(2)}</Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Order Type Selection */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>Order Type</Typography>
                        <RadioGroup
                            name="orderType"
                            value={formData.orderType}
                            onChange={handleInputChange}
                            sx={{ mb: 2 }}
                        >
                            <FormControlLabel value="Delivery" control={<Radio />} label="Delivery" />
                            <FormControlLabel value="Pickup" control={<Radio />} label="Pickup" />
                        </RadioGroup>

                        {/* Payment Method */}
                        <Typography variant="subtitle1" gutterBottom>Payment Method</Typography>
                        <RadioGroup
                            name="paymentMethod"
                            value={formData.paymentMethod}
                            onChange={handleInputChange}
                        >
                            <FormControlLabel 
                                value="Cash on Delivery" 
                                control={<Radio />} 
                                label="Cash on Delivery"
                                disabled={formData.orderType === 'Pickup'}
                            />
                            <FormControlLabel 
                                value="Cash on Pickup" 
                                control={<Radio />} 
                                label="Cash on Pickup"
                                disabled={formData.orderType === 'Delivery'}
                            />
                            <FormControlLabel value="GCash" control={<Radio />} label="GCash" />
                        </RadioGroup>
                    </Paper>

                    {/* Delivery Details */}
                    {formData.orderType === 'Delivery' && (
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Delivery Details</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Receiver Name"
                                    name="deliveryDetails.receiverName"
                                    value={formData.deliveryDetails.receiverName}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                />
                                <TextField
                                    label="Contact Number"
                                    name="deliveryDetails.contactNumber"
                                    value={formData.deliveryDetails.contactNumber}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                    placeholder="e.g., +639123456789"
                                />
                                <TextField
                                    label="Building"
                                    name="deliveryDetails.building"
                                    value={formData.deliveryDetails.building}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                />
                                <TextField
                                    label="Room Number"
                                    name="deliveryDetails.roomNumber"
                                    value={formData.deliveryDetails.roomNumber}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                />
                                <TextField
                                    label="Additional Instructions"
                                    name="deliveryDetails.additionalInstructions"
                                    value={formData.deliveryDetails.additionalInstructions}
                                    onChange={handleInputChange}
                                    fullWidth
                                    multiline
                                    rows={2}
                                />
                            </Box>
                        </Paper>
                    )}

                    {/* Pickup Details */}
                    {formData.orderType === 'Pickup' && (
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Pickup Details</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Contact Number"
                                    name="pickupDetails.contactNumber"
                                    value={formData.pickupDetails.contactNumber}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                    placeholder="e.g., 09123456789"
                                    error={!formData.pickupDetails.contactNumber}
                                    helperText={!formData.pickupDetails.contactNumber ? "Contact number is required" : ""}
                                />
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Pickup Date: {new Date().toLocaleDateString()}
                                </Typography>
                                <TextField
                                    label="Pickup Time"
                                    name="pickupDetails.pickupTime"
                                    type="time"
                                    value={formData.pickupDetails.pickupTime}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{
                                        step: 60,
                                        min: new Date().toLocaleTimeString('en-US', { 
                                            hour12: false, 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })
                                    }}
                                    helperText="Please select a pickup time for today"
                                />
                            </Box>
                        </Paper>
                    )}

                    {/* Additional Notes */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>Additional Notes</Typography>
                        <TextField
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Any special requests or notes?"
                        />
                    </Paper>
                </Container>
            </Box>

            {/* Fixed Footer */}
            <Paper 
                elevation={3} 
                sx={{ 
                    position: 'fixed', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    p: 2,
                    bgcolor: 'white',
                    zIndex: 1000
                }}
            >
                <Container maxWidth="md">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="subtitle1">Total Amount</Typography>
                            <Typography variant="h6" color="primary">₱{totalAmount.toFixed(2)}</Typography>
                        </Box>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleSubmit}
                            disabled={loading}
                            sx={{ 
                                minWidth: 200,
                                bgcolor: '#FF385C',
                                '&:hover': {
                                    bgcolor: '#FF1744'
                                }
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Place Order'
                            )}
                        </Button>
                    </Box>
                </Container>
            </Paper>
        </Box>
    );
};

export default OrderSummaryPage;
