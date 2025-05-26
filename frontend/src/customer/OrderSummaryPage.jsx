import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    TextField,
    Button,
    Divider,
    Alert,
    CircularProgress,
    Stack,
    Breadcrumbs,
    Link,
    useTheme,
    useMediaQuery,
    Paper,
    IconButton
} from '@mui/material';
import { DateTimePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { order } from '../api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const DELIVERY_FEE = 50; // Set your delivery fee here

const OrderSummaryPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItems = [], totalAmount = 0 } = location.state || {};

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [orderType, setOrderType] = useState('Pickup');
    const [formData, setFormData] = useState({
        orderType: 'Pickup',
        deliveryDetails: {
            receiverName: '',
            contactNumber: '',
            building: '',
            roomNumber: '',
            additionalInstructions: ''
        },
        pickupTime: dayjs().add(30, 'minute').set('second', 0).set('millisecond', 0),
        paymentMethod: 'Cash on Pickup',
        notes: ''
    });

    const handleOrderTypeChange = (event) => {
        const newType = event.target.value;
        setOrderType(newType);
        setFormData(prev => ({
            ...prev,
            orderType: newType,
            paymentMethod: newType === 'Pickup' ? 'Cash on Pickup' : 'Cash on Delivery'
        }));
    };

    const handleInputChange = (field) => (event) => {
        const value = event.target.value;
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handlePickupTimeChange = (newValue) => {
        if (!newValue || !newValue.isValid()) return;

        // Get current date
        const today = dayjs();
        
        // Set the selected time to today's date
        const timeOnly = newValue.set({
            year: today.year(),
            month: today.month(),
            date: today.date(),
            second: 0,
            millisecond: 0
        });

        // Check if selected time is at least 15 minutes from now
        const minTime = dayjs().add(15, 'minute');
        if (timeOnly.isBefore(minTime)) {
            setError('Pickup time must be at least 15 minutes from now');
            return;
        }

        setError(null);
        setFormData(prev => ({
            ...prev,
            pickupTime: timeOnly
        }));
    };

    const validatePickupTime = (time) => {
        const now = dayjs();
        const minTime = now.add(15, 'minute');
        const timeToCheck = dayjs(time);

        // Set both times to same date for proper comparison
        const normalizedTime = timeToCheck.set({
            year: now.year(),
            month: now.month(),
            date: now.date()
        });

        return normalizedTime.isAfter(minTime);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Validate required fields based on order type
            if (orderType === 'Delivery') {
                if (!formData.deliveryDetails.contactNumber) throw new Error('Contact number is required');
                if (!formData.deliveryDetails.receiverName) throw new Error('Receiver name is required');
                if (!formData.deliveryDetails.building) throw new Error('Building is required');
                if (!formData.deliveryDetails.roomNumber) throw new Error('Room number is required');
            } else {
                if (!formData.deliveryDetails.contactNumber) throw new Error('Contact number is required');
                if (!formData.pickupTime) throw new Error('Pickup time is required');
                
                // Validate pickup time is at least 15 minutes from now
                if (!validatePickupTime(formData.pickupTime)) {
                    throw new Error('Pickup time must be at least 15 minutes from now');
                }
            }

            // Group items by store
            const itemsByStore = cartItems.reduce((acc, item) => {
                const storeId = item.product.storeId;
                if (!acc[storeId]) {
                    acc[storeId] = [];
                }
                acc[storeId].push({
                    _id: item.product._id,
                    quantity: item.quantity,
                    price: item.product.price,
                    subtotal: item.subtotal
                });
                return acc;
            }, {});

            // First, create the order from cart items
            const checkoutResponse = await order.checkoutFromCart(
                Object.entries(itemsByStore).map(([storeId, items]) => ({
                    storeId,
                    items: items.map(item => item._id)
                })),
                orderType
            );

            if (!checkoutResponse || !checkoutResponse.orders || checkoutResponse.orders.length === 0) {
                throw new Error('Failed to create order');
            }

            // For each order created (one per store)
            for (const order of checkoutResponse.orders) {
                const orderId = order._id;

                // Prepare order data according to the API requirements
                const orderData = {
                    orderType,
                    deliveryDetails: {
                        contactNumber: formData.deliveryDetails.contactNumber,
                        ...(orderType === 'Delivery' && {
                            receiverName: formData.deliveryDetails.receiverName,
                            building: formData.deliveryDetails.building,
                            roomNumber: formData.deliveryDetails.roomNumber,
                            additionalInstructions: formData.deliveryDetails.additionalInstructions || ''
                        })
                    },
                    ...(orderType === 'Pickup' && {
                        pickupTime: formData.pickupTime.toISOString()
                    }),
                    paymentMethod: formData.paymentMethod,
                    notes: formData.notes || ''
                };

                // Place the order with complete details
                await order.placeOrder(orderId, orderData);
            }

            // Navigate to orders page with success message
            navigate('/customer/orders', {
                state: {
                    success: true,
                    message: 'Order placed successfully!'
                }
            });
        } catch (err) {
            console.error('Order error:', err);
            setError(err.message || 'Failed to place order. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getFinalTotal = () => {
        return orderType === 'Delivery' ? totalAmount + DELIVERY_FEE : totalAmount;
    };

    if (!cartItems.length) {
        return (
            <Container maxWidth={false} sx={styles.emptyCartContainer}>
                <Alert severity="error">
                    No items selected for checkout. Please select items from your cart first.
                </Alert>
                <Button
                    variant="contained"
                    onClick={() => navigate('/customer/cart')}
                    sx={styles.returnButton}
                >
                    Return to Cart
                </Button>
            </Container>
        );
    }

    return (
        <Box sx={styles.mainContainer}>
            <Box component="header" sx={styles.header}>
                <Container maxWidth={false} sx={styles.headerContainer}>
                    <IconButton 
                        onClick={() => navigate('/customer/cart')}
                        sx={styles.backButton}
                        aria-label="back to cart"
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6">Order Summary</Typography>
                </Container>
            </Box>

            <Box component="main" sx={styles.mainContent}>
                <Container maxWidth={false} sx={styles.pageContainer}>
                    {error && (
                        <Alert severity="error" sx={styles.errorAlert}>
                            {error}
                        </Alert>
                    )}

                    {/* Order Summary Card */}
                    <Card elevation={3} sx={styles.summaryCard}>
                        <CardContent sx={styles.cardContent}>
                            <Typography variant="subtitle1" gutterBottom>
                                Selected Items
                            </Typography>
                            <Stack spacing={1} sx={styles.itemsStack}>
                                {cartItems.map((item, index) => (
                                    <Box 
                                        key={index} 
                                        sx={styles.itemRow}
                                    >
                                        <Typography sx={styles.itemName}>
                                            {item.quantity}x {item.product.name}
                                        </Typography>
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary"
                                            sx={styles.itemPrice}
                                        >
                                            ₱{item.subtotal?.toFixed(2)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Order Details Form */}
                    <Card elevation={3} sx={styles.formCard}>
                        <CardContent sx={styles.cardContent}>
                            <Typography variant="h6" gutterBottom>
                                Order Details
                            </Typography>
                            <form onSubmit={handleSubmit} id="orderForm" style={styles.form}>
                                <Stack spacing={{ xs: 2, md: 3 }} sx={styles.formStack}>
                                    <FormControl component="fieldset" sx={styles.formControl}>
                                        <FormLabel>Order Type</FormLabel>
                                        <RadioGroup 
                                            row={!isMobile} 
                                            value={orderType} 
                                            onChange={handleOrderTypeChange}
                                            sx={styles.radioGroup}
                                        >
                                            <FormControlLabel value="Pickup" control={<Radio />} label="Pickup" />
                                            <FormControlLabel value="Delivery" control={<Radio />} label="Delivery" />
                                        </RadioGroup>
                                    </FormControl>

                                    <TextField
                                        required
                                        label="Contact Number"
                                        value={formData.deliveryDetails.contactNumber}
                                        onChange={handleInputChange('deliveryDetails.contactNumber')}
                                        fullWidth
                                        size={isMobile ? "small" : "medium"}
                                        error={!formData.deliveryDetails.contactNumber}
                                        helperText={!formData.deliveryDetails.contactNumber ? "Contact number is required" : ""}
                                    />

                                    {orderType === 'Delivery' ? (
                                        <>
                                            <TextField
                                                required
                                                label="Receiver Name"
                                                value={formData.deliveryDetails.receiverName}
                                                onChange={handleInputChange('deliveryDetails.receiverName')}
                                                fullWidth
                                                size={isMobile ? "small" : "medium"}
                                                error={!formData.deliveryDetails.receiverName}
                                                helperText={!formData.deliveryDetails.receiverName ? "Receiver name is required" : ""}
                                            />
                                            <TextField
                                                required
                                                label="Building"
                                                value={formData.deliveryDetails.building}
                                                onChange={handleInputChange('deliveryDetails.building')}
                                                fullWidth
                                                size={isMobile ? "small" : "medium"}
                                                error={!formData.deliveryDetails.building}
                                                helperText={!formData.deliveryDetails.building ? "Building is required" : ""}
                                            />
                                            <TextField
                                                required
                                                label="Room Number"
                                                value={formData.deliveryDetails.roomNumber}
                                                onChange={handleInputChange('deliveryDetails.roomNumber')}
                                                fullWidth
                                                size={isMobile ? "small" : "medium"}
                                                error={!formData.deliveryDetails.roomNumber}
                                                helperText={!formData.deliveryDetails.roomNumber ? "Room number is required" : ""}
                                            />
                                            <TextField
                                                label="Additional Instructions"
                                                value={formData.deliveryDetails.additionalInstructions}
                                                onChange={handleInputChange('deliveryDetails.additionalInstructions')}
                                                multiline
                                                rows={isMobile ? 2 : 3}
                                                fullWidth
                                                size={isMobile ? "small" : "medium"}
                                                helperText="Optional: Any special instructions for delivery"
                                            />
                                        </>
                                    ) : (
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <TimePicker
                                                label="Pickup Time"
                                                value={formData.pickupTime}
                                                onChange={handlePickupTimeChange}
                                                minTime={dayjs().add(15, 'minute')}
                                                views={['hours', 'minutes']}
                                                ampm={true}
                                                format="hh:mm A"
                                                viewRenderers={{
                                                    hours: null,
                                                    minutes: null,
                                                    seconds: null,
                                                }}
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        required: true,
                                                        size: isMobile ? "small" : "medium",
                                                        helperText: error || "Must be at least 15 minutes from now",
                                                        error: !!error,
                                                        inputProps: {
                                                            placeholder: "hh:mm AM/PM"
                                                        }
                                                    },
                                                    actionBar: {
                                                        actions: ['accept', 'cancel']
                                                    },
                                                    popper: {
                                                        sx: { zIndex: 1300 }
                                                    },
                                                    layout: {
                                                        sx: {
                                                            '.MuiPickersLayout-contentWrapper': {
                                                                '& [aria-hidden="true"]': {
                                                                    visibility: 'hidden'
                                                                }
                                                            }
                                                        }
                                                    },
                                                    field: {
                                                        readOnly: false
                                                    },
                                                    digitLayout: {
                                                        sx: {
                                                            width: '100%',
                                                            justifyContent: 'center',
                                                            '& .MuiPickersLayout-root': {
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center'
                                                            }
                                                        }
                                                    }
                                                }}
                                                closeOnSelect={true}
                                                shouldDisableTime={(timeValue) => {
                                                    if (!timeValue) return false;
                                                    const now = dayjs();
                                                    const minTime = now.add(15, 'minute');
                                                    const timeToCheck = timeValue.set({
                                                        year: now.year(),
                                                        month: now.month(),
                                                        date: now.date()
                                                    });
                                                    return timeToCheck.isBefore(minTime);
                                                }}
                                                sx={{
                                                    width: '100%',
                                                    '& .MuiInputBase-root': {
                                                        width: '100%'
                                                    }
                                                }}
                                            />
                                        </LocalizationProvider>
                                    )}

                                    <FormControl component="fieldset">
                                        <FormLabel>Payment Method</FormLabel>
                                        <RadioGroup
                                            row={!isMobile}
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

                                    <TextField
                                        label="Additional Notes"
                                        value={formData.notes}
                                        onChange={handleInputChange('notes')}
                                        multiline
                                        rows={isMobile ? 2 : 3}
                                        fullWidth
                                        size={isMobile ? "small" : "medium"}
                                    />
                                </Stack>
                            </form>
                        </CardContent>
                    </Card>
                </Container>
            </Box>

            {/* Fixed Footer */}
            <Paper elevation={4} sx={styles.footer}>
                <Container maxWidth={false}>
                    <Box sx={styles.footerContent}>
                        <Stack spacing={0.5} sx={styles.totalStack}>
                            <Typography variant="subtitle2">
                                Subtotal: ₱{totalAmount.toFixed(2)}
                            </Typography>
                            {orderType === 'Delivery' && (
                                <Typography variant="subtitle2">
                                    Delivery Fee: ₱{DELIVERY_FEE.toFixed(2)}
                                </Typography>
                            )}
                            <Typography variant="h6" sx={styles.totalAmount}>
                                Total: ₱{getFinalTotal().toFixed(2)}
                            </Typography>
                        </Stack>

                        <Button
                            type="submit"
                            form="orderForm"
                            variant="contained"
                            color="primary"
                            disabled={isLoading}
                            sx={styles.placeOrderButton}
                        >
                            {isLoading ? <CircularProgress size={24} /> : 'Place Order'}
                        </Button>
                    </Box>
                </Container>
            </Paper>
        </Box>
    );
};

const styles = {
    mainContainer: {
        pb: { xs: '120px', sm: '100px' },
        width: '100vw',
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column'
    },
    header: {
        width: '100%',
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        zIndex: 1000
    },
    headerContainer: {
        display: 'flex',
        alignItems: 'center',
        minHeight: 56,
        px: { xs: 1, sm: 2 }
    },
    mainContent: {
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
    },
    pageContainer: {
        py: { xs: 2, md: 4 },
        px: { xs: 1, sm: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        maxWidth: '100% !important',
        width: '100%'
    },
    backButton: {
        mr: 1
    },
    errorAlert: {
        mb: 2,
        width: '100%'
    },
    summaryCard: {
        mb: 3,
        width: '100%',
        '& .MuiCardContent-root': {
            width: '100%'
        }
    },
    formCard: {
        width: '100%',
        '& .MuiCardContent-root': {
            width: '100%'
        }
    },
    cardContent: {
        p: { xs: 2, md: 3 },
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
    },
    itemsStack: {
        width: '100%'
    },
    itemRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        py: 1
    },
    itemName: {
        fontSize: { xs: '0.9rem', md: '1rem' },
        flex: 1,
        mr: 2
    },
    itemPrice: {
        ml: 2,
        whiteSpace: 'nowrap'
    },
    form: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
    },
    formStack: {
        width: '100%'
    },
    formControl: {
        width: '100%',
        '& .MuiFormGroup-root': {
            width: '100%'
        }
    },
    radioGroup: {
        width: '100%'
    },
    footer: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        bgcolor: 'background.paper',
        width: '100vw',
        boxSizing: 'border-box'
    },
    footerContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: { xs: 1.5, sm: 2 },
        px: { xs: 1, sm: 2, md: 3 },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 },
        width: '100%',
        maxWidth: '100%'
    },
    totalStack: {
        width: { xs: '100%', sm: 'auto' }
    },
    totalAmount: {
        fontWeight: 'bold',
        fontSize: { xs: '1.1rem', md: '1.25rem' }
    },
    placeOrderButton: {
        minWidth: { xs: '100%', sm: 150 }
    },
    emptyCartContainer: {
        py: 4,
        width: '100%'
    },
    returnButton: {
        mt: 2
    }
};

export default OrderSummaryPage; 