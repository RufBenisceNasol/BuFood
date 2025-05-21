import React, { useState } from 'react';
import {
    Box,
    TextField,
    RadioGroup,
    FormControlLabel,
    Radio,
    Button,
    Typography,
    Paper,
    FormControl,
    FormLabel,
    Divider,
    Alert,
    CircularProgress,
    Stack
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { addMinutes } from 'date-fns';

const OrderDetailsForm = ({ onSubmit, isLoading, error, totalAmount }) => {
    const [orderType, setOrderType] = useState('Pickup');
    const [formData, setFormData] = useState({
        receiverName: '',
        contactNumber: '',
        building: '',
        roomNumber: '',
        additionalInstructions: '',
        pickupTime: addMinutes(new Date(), 30), // Default to 30 minutes from now
        paymentMethod: orderType === 'Pickup' ? 'Cash on Pickup' : 'Cash on Delivery'
    });

    const handleOrderTypeChange = (event) => {
        const newType = event.target.value;
        setOrderType(newType);
        setFormData(prev => ({
            ...prev,
            paymentMethod: newType === 'Pickup' ? 'Cash on Pickup' : 'Cash on Delivery'
        }));
    };

    const handleInputChange = (field) => (event) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handlePickupTimeChange = (newValue) => {
        setFormData(prev => ({
            ...prev,
            pickupTime: newValue
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const orderData = {
            orderType,
            deliveryDetails: {
                contactNumber: formData.contactNumber,
                ...(orderType === 'Delivery' && {
                    receiverName: formData.receiverName,
                    building: formData.building,
                    roomNumber: formData.roomNumber,
                    additionalInstructions: formData.additionalInstructions
                })
            },
            ...(orderType === 'Pickup' && {
                pickupTime: formData.pickupTime.toISOString()
            }),
            paymentMethod: formData.paymentMethod
        };
        onSubmit(orderData);
    };

    return (
        <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
            <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    <Typography variant="h6" gutterBottom>
                        Order Details
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <FormControl component="fieldset">
                        <FormLabel>Order Type</FormLabel>
                        <RadioGroup row value={orderType} onChange={handleOrderTypeChange}>
                            <FormControlLabel value="Pickup" control={<Radio />} label="Pickup" />
                            <FormControlLabel value="Delivery" control={<Radio />} label="Delivery" />
                        </RadioGroup>
                    </FormControl>

                    <TextField
                        required
                        label="Contact Number"
                        value={formData.contactNumber}
                        onChange={handleInputChange('contactNumber')}
                        fullWidth
                    />

                    {orderType === 'Delivery' ? (
                        <>
                            <TextField
                                required
                                label="Receiver Name"
                                value={formData.receiverName}
                                onChange={handleInputChange('receiverName')}
                                fullWidth
                            />
                            <TextField
                                required
                                label="Building"
                                value={formData.building}
                                onChange={handleInputChange('building')}
                                fullWidth
                            />
                            <TextField
                                required
                                label="Room Number"
                                value={formData.roomNumber}
                                onChange={handleInputChange('roomNumber')}
                                fullWidth
                            />
                            <TextField
                                label="Additional Instructions"
                                value={formData.additionalInstructions}
                                onChange={handleInputChange('additionalInstructions')}
                                multiline
                                rows={2}
                                fullWidth
                            />
                        </>
                    ) : (
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateTimePicker
                                label="Pickup Time"
                                value={formData.pickupTime}
                                onChange={handlePickupTimeChange}
                                minDateTime={addMinutes(new Date(), 30)}
                                slotProps={{
                                    textField: { fullWidth: true, required: true }
                                }}
                            />
                        </LocalizationProvider>
                    )}

                    <FormControl component="fieldset">
                        <FormLabel>Payment Method</FormLabel>
                        <RadioGroup
                            row
                            value={formData.paymentMethod}
                            onChange={handleInputChange('paymentMethod')}
                        >
                            <FormControlLabel
                                value={orderType === 'Pickup' ? 'Cash on Pickup' : 'Cash on Delivery'}
                                control={<Radio />}
                                label={orderType === 'Pickup' ? 'Cash on Pickup' : 'Cash on Delivery'}
                            />
                            <FormControlLabel value="GCash" control={<Radio />} label="GCash" />
                        </RadioGroup>
                    </FormControl>

                    <Divider />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                            Total Amount: ₱{totalAmount.toFixed(2)}
                        </Typography>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={isLoading}
                            sx={{ minWidth: 150 }}
                        >
                            {isLoading ? <CircularProgress size={24} /> : 'Place Order'}
                        </Button>
                    </Box>
                </Stack>
            </form>
        </Paper>
    );
};

export default OrderDetailsForm; 