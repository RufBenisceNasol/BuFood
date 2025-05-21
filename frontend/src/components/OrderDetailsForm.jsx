import React, { useState } from 'react';
import {
    Box,
    TextField,
    RadioGroup,
    FormControlLabel,
    Radio,
    FormControl,
    FormLabel,
    Button,
    Typography,
    Alert,
    Paper,
    Grid,
    MenuItem,
    Select,
    InputLabel,
    Divider,
    Card,
    CardContent,
} from '@mui/material';
import { LocalShipping, Store, Payment } from '@mui/icons-material';

const OrderDetailsForm = ({ onSubmit, loading = false, totalAmount = 0, selectedItems = [] }) => {
    const [formData, setFormData] = useState({
        orderType: 'Pickup', // Default to Pickup
        contactNumber: '',
        // Delivery specific fields
        receiverName: '',
        building: '',
        roomNumber: '',
        notes: '',
        paymentMethod: 'Cash on Delivery'
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        // Common validations
        if (!formData.contactNumber.trim()) {
            newErrors.contactNumber = 'Contact number is required';
        } else if (!/^[0-9+\-\s()]+$/.test(formData.contactNumber)) {
            newErrors.contactNumber = 'Invalid contact number format';
        }

        // Delivery-specific validations
        if (formData.orderType === 'Delivery') {
            if (!formData.receiverName?.trim()) {
                newErrors.receiverName = 'Receiver name is required';
            }
            if (!formData.building?.trim()) {
                newErrors.building = 'Building name is required';
            }
            if (!formData.roomNumber?.trim()) {
                newErrors.roomNumber = 'Room number is required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            const orderDetails = {
                orderType: formData.orderType,
                deliveryDetails: {
                    contactNumber: formData.contactNumber,
                    ...(formData.orderType === 'Delivery' && {
                        receiverName: formData.receiverName,
                        building: formData.building,
                        roomNumber: formData.roomNumber,
                        deliveryLocation: `${formData.building} - Room ${formData.roomNumber}`
                    })
                },
                paymentMethod: formData.paymentMethod,
                notes: formData.notes || ''
            };

            onSubmit(orderDetails);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when field is modified
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const deliveryFee = formData.orderType === 'Delivery' ? 50 : 0;
    const finalTotal = totalAmount + deliveryFee;

    return (
        <Box component="form" onSubmit={handleSubmit}>
            {/* Order Type Selection */}
            <Box sx={{ mb: 4 }}>
                <FormControl component="fieldset" fullWidth>
                    <FormLabel id="order-type-label" component="legend">Order Type</FormLabel>
                    <RadioGroup
                        row
                        name="orderType"
                        value={formData.orderType}
                        onChange={handleChange}
                        aria-labelledby="order-type-label"
                    >
                        <FormControlLabel 
                            value="Pickup" 
                            control={<Radio />} 
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Store aria-hidden="true" />
                                    <span>Pickup</span>
                                </Box>
                            }
                        />
                        <FormControlLabel 
                            value="Delivery" 
                            control={<Radio />} 
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LocalShipping aria-hidden="true" />
                                    <span>Delivery</span>
                                </Box>
                            }
                        />
                    </RadioGroup>
                </FormControl>
            </Box>

            {/* Order Items Summary */}
            <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom id="order-summary-title">
                        Order Summary
                    </Typography>
                    <Box role="region" aria-labelledby="order-summary-title">
                        {selectedItems.map((item, index) => (
                            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography>
                                    {item.product.name} x {item.quantity}
                                </Typography>
                                <Typography>
                                    ₱{(item.product.price * item.quantity).toFixed(2)}
                                </Typography>
                            </Box>
                        ))}
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>Subtotal:</Typography>
                            <Typography>₱{totalAmount.toFixed(2)}</Typography>
                        </Box>
                        {formData.orderType === 'Delivery' && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography>Delivery Fee:</Typography>
                                <Typography>₱{deliveryFee.toFixed(2)}</Typography>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                            <Typography variant="h6">Total:</Typography>
                            <Typography variant="h6" color="primary">
                                ₱{finalTotal.toFixed(2)}
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <Grid container spacing={3}>
                {/* Common Fields */}
                <Grid xs={12}>
                    <TextField
                        fullWidth
                        label="Contact Number"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        error={!!errors.contactNumber}
                        helperText={errors.contactNumber}
                        required
                        inputProps={{
                            'aria-label': 'Contact Number',
                            'aria-required': 'true',
                            'aria-invalid': !!errors.contactNumber
                        }}
                    />
                </Grid>

                {/* Delivery-specific Fields */}
                {formData.orderType === 'Delivery' && (
                    <>
                        <Grid xs={12}>
                            <TextField
                                fullWidth
                                label="Receiver Name"
                                name="receiverName"
                                value={formData.receiverName}
                                onChange={handleChange}
                                error={!!errors.receiverName}
                                helperText={errors.receiverName}
                                required
                                inputProps={{
                                    'aria-label': 'Receiver Name',
                                    'aria-required': 'true',
                                    'aria-invalid': !!errors.receiverName
                                }}
                            />
                        </Grid>
                        <Grid xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Building"
                                name="building"
                                value={formData.building}
                                onChange={handleChange}
                                error={!!errors.building}
                                helperText={errors.building}
                                required
                                inputProps={{
                                    'aria-label': 'Building',
                                    'aria-required': 'true',
                                    'aria-invalid': !!errors.building
                                }}
                            />
                        </Grid>
                        <Grid xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Room Number"
                                name="roomNumber"
                                value={formData.roomNumber}
                                onChange={handleChange}
                                error={!!errors.roomNumber}
                                helperText={errors.roomNumber}
                                required
                                inputProps={{
                                    'aria-label': 'Room Number',
                                    'aria-required': 'true',
                                    'aria-invalid': !!errors.roomNumber
                                }}
                            />
                        </Grid>
                    </>
                )}

                {/* Payment Method */}
                <Grid xs={12}>
                    <FormControl component="fieldset" fullWidth>
                        <FormLabel id="payment-method-label" component="legend">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Payment aria-hidden="true" />
                                <span>Payment Method</span>
                            </Box>
                        </FormLabel>
                        <RadioGroup
                            row
                            name="paymentMethod"
                            value={formData.paymentMethod}
                            onChange={handleChange}
                            aria-labelledby="payment-method-label"
                        >
                            <FormControlLabel 
                                value="Cash on Delivery" 
                                control={<Radio />} 
                                label={formData.orderType === 'Pickup' ? 'Cash on Pickup' : 'Cash on Delivery'} 
                            />
                            <FormControlLabel 
                                value="GCash" 
                                control={<Radio />} 
                                label="GCash" 
                            />
                        </RadioGroup>
                    </FormControl>
                </Grid>

                {/* Notes */}
                <Grid xs={12}>
                    <TextField
                        fullWidth
                        label="Additional Notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        multiline
                        rows={3}
                        placeholder="Any special instructions for your order..."
                        inputProps={{
                            'aria-label': 'Additional Notes'
                        }}
                    />
                </Grid>
            </Grid>

            {/* Fixed Footer with Total and Submit Button */}
            <Box
                component="footer"
                sx={{
                    position: 'sticky',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'background.paper',
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    mt: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                        Total Amount
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        ₱{finalTotal.toFixed(2)}
                    </Typography>
                </Box>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    aria-label={loading ? 'Processing order...' : 'Place Order'}
                    sx={{
                        bgcolor: '#FF8C00',
                        '&:hover': { bgcolor: '#FF6B00' },
                        '&:disabled': { bgcolor: '#FFB74D' },
                        minWidth: 200
                    }}
                >
                    {loading ? 'Processing...' : 'Place Order'}
                </Button>
            </Box>
        </Box>
    );
};

export default OrderDetailsForm; 