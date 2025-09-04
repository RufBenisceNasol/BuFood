import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { order, store as storeApi } from '../api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';
import {
    Box,
    Typography,
    Radio,
    RadioGroup,
    FormControlLabel,
    TextField,
    Button,
    CircularProgress,
    Divider,
    IconButton
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { getUser } from '../utils/tokenUtils';

// Styled Components
const PageContainer = styled.div`
  background-color: rgb(5, 4, 4);
  height: 100vh;
  height: 100dvh;
  width: 100vw;
  max-width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overscroll-behavior-y: none;
`;

const Header = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #ff8c00e0;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 1100;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const BackButton = styled(IconButton)`
  color: white !important;
  margin-right: 16px;
`;

const HeaderTitle = styled(Typography)`
  font-size: 1.2rem;
  font-weight: 500;
  color: white;
`;

const ToolbarSpacer = styled.div`
  height: 60px;
`;

const ContentWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  padding: 16px 0 100px;
  background: #fff;
  
  /* Custom scrollbar for WebKit browsers */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
    transition: background 0.3s ease;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  
  /* Firefox scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #888 #f1f1f1;
`;

const Container = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 15px;
`;

const Section = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
`;

const SectionTitle = styled(Typography)`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const ItemImage = styled.img`
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 16px;
`;

const ItemInfo = styled.div`
  flex: 1;
`;

const ItemName = styled(Typography)`
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 4px;
`;

const ItemQuantity = styled(Typography)`
  font-size: 0.875rem;
  color: #666;
`;

const ItemPrice = styled(Typography)`
  font-size: 1rem;
  font-weight: 600;
  color: #ff8c00e0;
`;

const StyledTextField = styled(TextField)`
  margin-bottom: 16px !important;
  
  & .MuiOutlinedInput-root {
    border-radius: 8px;
  }
`;

const Footer = styled.footer`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  height: 80px; /* Fixed height for the footer */
`;

const FooterContent = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
background-color: #ffffff;
  padding: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

const TotalAmount = styled.div`
  display: flex;
  flex-direction: column;
`;

const TotalLabel = styled(Typography)`
  font-size: 0.875rem;
  color: #666;
`;

const TotalValue = styled(Typography)`
  font-size: 1.25rem;
  font-weight: 600;
  color: #ff8c00e0;
`;

const PlaceOrderButton = styled(Button)`
  background: linear-gradient(135deg, #fbaa39, #fc753b) !important;
  color: white !important;
  padding: 10px 24px !important;
  border-radius: 8px !important;
  text-transform: none !important;
  font-weight: 600 !important;
  min-width: 200px;
  
  &:disabled {
    background: #cccccc !important;
  }
  
  @media (max-width: 480px) {
    min-width: 150px;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
`;

const OrderSummaryPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { cartItems, totalAmount } = location.state || { cartItems: [], totalAmount: 0 };
    const [loading, setLoading] = useState(false);
    const [qrPreview, setQrPreview] = useState({ open: false, src: '' });
    
    // Get user data from localStorage
    const userData = getUser() || {};
    const customerName = userData.name || '';
    const customerContactNumber = userData.contactNumber || '';

    const getDefaultPickupTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 20);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const [formData, setFormData] = useState({
        orderType: 'Delivery',
        paymentMethod: 'Cash on Delivery',
        deliveryDetails: {
            receiverName: customerName,
            contactNumber: customerContactNumber,
            building: '',
            roomNumber: '',
            additionalInstructions: ''
        },
        pickupDetails: {
            contactNumber: customerContactNumber,
            pickupTime: getDefaultPickupTime()
        },
        notes: ''
    });

    // Store GCash details when manual GCash is selected
    const [gcashStoreDetails, setGcashStoreDetails] = useState({}); // { [storeId]: { storeName, gcashName, gcashNumber, gcashQrUrl } }

    // When payment method switches to GCash_Manual, fetch unique store details for items in cart
    useEffect(() => {
        const fetchGcashDetails = async () => {
            try {
                const uniqueStoreIds = Array.from(new Set((cartItems || []).map(ci => ci?.product?.storeId).filter(Boolean)));
                if (uniqueStoreIds.length === 0) return;
                const results = await Promise.all(uniqueStoreIds.map(async (sid) => {
                    try {
                        const data = await storeApi.getStoreById(sid);
                        return [sid, data];
                    } catch (err) {
                        console.error('Failed to fetch store', sid, err);
                        return [sid, null];
                    }
                }));
                const mapped = {};
                results.forEach(([sid, data]) => {
                    if (data) {
                        mapped[sid] = {
                            storeName: data.storeName || data.name || 'Store',
                            gcashName: data.gcashName || '',
                            gcashNumber: data.gcashNumber || '',
                            gcashQrUrl: data.gcashQrUrl || ''
                        };
                    }
                });
                setGcashStoreDetails(mapped);
            } catch (e) {
                console.error('Error fetching GCash details:', e);
            }
        };
        if (formData.paymentMethod === 'GCash_Manual') {
            fetchGcashDetails();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.paymentMethod]);

    const handleGoBack = () => {
        navigate('/customer/cart');
    };

    const openQrModal = (src) => {
        console.log('Opening QR modal with src:', src);
        setQrPreview({ open: true, src });
    };
    const closeQrModal = () => setQrPreview({ open: false, src: '' });

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
        toast.info('Place Order button clicked');
        console.log('Place Order button clicked', formData);
        try {
            setLoading(true);
            toast.info('Submitting order...');
            if (formData.paymentMethod === 'GCash') {
                // GCash payment flow
                // 1. Create a pending order for this store (reuse your order creation logic, but set paymentStatus to 'Pending')
                // 2. Call gcashCheckout to get the PayMongo checkout URL
                // 3. Redirect the user to the GCash payment page
                // For now, we'll assume one store per checkout (your backend already does this)
                // We'll create the order first, then call gcashCheckout
                // Step 1: Create the order (but don't mark as paid)
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
                    const [hours, minutes] = formData.pickupDetails.pickupTime.split(':').map(Number);
                    const pickupDate = new Date();
                    pickupDate.setHours(hours, minutes, 0, 0);
                    orderData.pickupDetails = {
                        contactNumber: formData.pickupDetails.contactNumber,
                        pickupTime: pickupDate.toISOString()
                    };
                }
                // Create the order
                const response = await order.createOrderFromCart(orderData);
                const createdOrder = response.data?.orders?.[0] || response.orders?.[0];
                if (!createdOrder) {
                    throw new Error('Order creation failed');
                }
                // Step 2: Call gcashCheckout
                const redirectUrl = window.location.origin + '/gcash-callback';
                const checkoutUrl = await order.gcashCheckout({
                    amount: createdOrder.totalAmount,
                    orderId: createdOrder._id,
                    redirectUrl
                });
                // Step 3: Redirect to GCash
                window.location.href = checkoutUrl;
                return;
            }
            if (formData.orderType === 'Pickup') {
                if (!formData.pickupDetails.contactNumber) {
                    toast.error('Contact number is required');
                    setLoading(false);
                    return;
                }
                if (!formData.pickupDetails.pickupTime) {
                    toast.error('Pickup time is required');
                    setLoading(false);
                    return;
                }
                const [hours, minutes] = formData.pickupDetails.pickupTime.split(':').map(Number);
                const pickupDateTime = new Date();
                pickupDateTime.setHours(hours, minutes, 0, 0);
                if (pickupDateTime <= new Date()) {
                    toast.error('Please select a future time for pickup (at least 20 minutes from now)');
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
                const [hours, minutes] = formData.pickupDetails.pickupTime.split(':').map(Number);
                const pickupDate = new Date();
                pickupDate.setHours(hours, minutes, 0, 0);
                orderData.pickupDetails = {
                    contactNumber: formData.pickupDetails.contactNumber,
                    pickupTime: pickupDate.toISOString()
                };
            }
            console.log('Submitting order data:', orderData);
            toast.info('Sending order to backend...');
            const response = await order.createOrderFromCart(orderData);
            console.log('Order response:', response);
            toast.success('Order placed successfully!');
            navigate('/customer/success-order');
        } catch (err) {
            // Enhanced error logging
            console.error('Order submission error:', err);
            toast.error('Order submission error: ' + (err?.message || JSON.stringify(err)));
            if (err && err.response) {
                console.error('Error response data:', err.response.data);
                if (err.response.data.errors) {
                    toast.error('Backend: ' + err.response.data.errors[0].msg);
                } else {
                    toast.error('Backend: ' + (err.response.data?.message || err.response.data?.error || 'Failed to create order'));
                }
            } else if (err && err.message) {
                toast.error('Frontend: ' + err.message);
            } else {
                toast.error('Unknown error during order creation');
            }
            setLoading(false);
        }
    };

    return (
        <PageContainer>
            <Header>
                <BackButton onClick={handleGoBack}>
                    <ArrowBack />
                </BackButton>
                <HeaderTitle>Order Summary</HeaderTitle>
            </Header>
            <ToolbarSpacer />

            <ContentWrapper>
                <Container>
                    {/* Order Items Summary */}
                    <Section>
                        <SectionTitle>Order Items</SectionTitle>
                        {cartItems.map((item) => (
                            <OrderItem key={item.product._id}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <ItemImage 
                                        src={item.product.image} 
                                        alt={item.product.name}
                                    />
                                    <ItemInfo>
                                        <ItemName>{item.product.name}</ItemName>
                                        <ItemQuantity>Quantity: {item.quantity}</ItemQuantity>
                                    </ItemInfo>
                                </div>
                                <ItemPrice>₱{(item.product.price * item.quantity).toFixed(2)}</ItemPrice>
                            </OrderItem>
                        ))}
                        <Divider sx={{ my: 2 }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <TotalLabel>Total Amount:</TotalLabel>
                            <TotalValue>₱{totalAmount.toFixed(2)}</TotalValue>
                        </div>
                    </Section>

                    {/* Order Type & Payment Method */}
                    <Section>
                        <SectionTitle>Order Type</SectionTitle>
                        <RadioGroup
                            name="orderType"
                            value={formData.orderType}
                            onChange={handleInputChange}
                            style={{ marginBottom: '16px' }}
                        >
                            <FormControlLabel 
                                value="Delivery" 
                                control={<Radio />} 
                                label="Delivery" 
                            />
                            <FormControlLabel 
                                value="Pickup" 
                                control={<Radio />} 
                                label="Pickup" 
                            />
                        </RadioGroup>

                        <SectionTitle>Payment Method</SectionTitle>
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
                            <FormControlLabel 
                                value="GCash_Manual" 
                                control={<Radio />} 
                                label="GCash (Manual)"
                            />
                        </RadioGroup>
                    </Section>

                    {/* Seller GCash Details (visible when manual GCash is selected) */}
                    {formData.paymentMethod === 'GCash_Manual' && (
                        <Section>
                            <SectionTitle>Pay via GCash (Manual)</SectionTitle>
                            <Typography variant="body2" color="text.secondary" style={{ marginBottom: 12 }}>
                                Please pay to the seller(s) using the details below. After placing the order, upload your payment screenshot and/or reference number in the orders page.
                            </Typography>
                            {(() => {
                                const uniqueStoreIds = Array.from(new Set((cartItems || []).map(ci => ci?.product?.storeId).filter(Boolean)));
                                if (uniqueStoreIds.length === 0) {
                                    return <Typography variant="body2">No store information available.</Typography>;
                                }
                                return uniqueStoreIds.map((sid) => {
                                    const info = gcashStoreDetails[sid] || {};
                                    return (
                                        <div key={sid} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                                            <Typography variant="subtitle1" style={{ fontWeight: 600 }}>{info.storeName || 'Store'}</Typography>
                                            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                                                <div style={{ minWidth: 220 }}>
                                                    <Typography variant="body2">GCash Name: <b>{info.gcashName || '—'}</b></Typography>
                                                    <Typography variant="body2">GCash Number: <b style={{ cursor: info.gcashNumber ? 'pointer' : 'default' }} onClick={() => { if (info.gcashNumber) { navigator.clipboard.writeText(info.gcashNumber); toast.info('GCash number copied'); } }}>{info.gcashNumber || '—'}</b></Typography>
                                                </div>
                                                {info.gcashQrUrl ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <img
                                                            src={info.gcashQrUrl}
                                                            alt="GCash QR"
                                                            onClick={() => openQrModal(info.gcashQrUrl)}
                                                            title="Click to view QR"
                                                            style={{ width: 140, height: 140, objectFit: 'contain', borderRadius: 8, background: '#fafafa', border: '1px solid #eee', cursor: 'pointer' }}
                                                        />
                                                        <Button variant="outlined" size="small" onClick={() => openQrModal(info.gcashQrUrl)}>
                                                            View QR
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div style={{ width: 140, height: 140, border: '1px dashed #ddd', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
                                                        No QR Provided
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </Section>
                    )}

                    {/* Delivery Details */}
                    {formData.orderType === 'Delivery' && (
                        <Section>
                            <SectionTitle>Delivery Details</SectionTitle>
                            <FormGroup>
                                <StyledTextField
                                    label="Receiver Name"
                                    name="deliveryDetails.receiverName"
                                    value={formData.deliveryDetails.receiverName}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                />
                                <StyledTextField
                                    label="Contact Number"
                                    name="deliveryDetails.contactNumber"
                                    value={formData.deliveryDetails.contactNumber}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                    placeholder="e.g., +639123456789"
                                />
                                <StyledTextField
                                    label="Building"
                                    name="deliveryDetails.building"
                                    value={formData.deliveryDetails.building}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                />
                                <StyledTextField
                                    label="Room Number"
                                    name="deliveryDetails.roomNumber"
                                    value={formData.deliveryDetails.roomNumber}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                />
                                <StyledTextField
                                    label="Additional Instructions"
                                    name="deliveryDetails.additionalInstructions"
                                    value={formData.deliveryDetails.additionalInstructions}
                                    onChange={handleInputChange}
                                    fullWidth
                                    multiline
                                    rows={2}
                                />
                            </FormGroup>
                        </Section>
                    )}

                    {/* Pickup Details */}
                    {formData.orderType === 'Pickup' && (
                        <Section>
                            <SectionTitle>Pickup Details</SectionTitle>
                            <FormGroup>
                                <StyledTextField
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
                                <Typography variant="body2" color="text.secondary">
                                    Pickup Date: {new Date().toLocaleDateString()}
                                </Typography>
                                <StyledTextField
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
                                        min: getDefaultPickupTime()
                                    }}
                                    helperText="Please select a pickup time at least 20 minutes from now"
                                />
                            </FormGroup>
                        </Section>
                    )}

                    {/* Additional Notes */}
                    <Section>
                        <SectionTitle>Additional Notes</SectionTitle>
                        <StyledTextField
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Any special requests or notes?"
                        />
                    </Section>
                </Container>
            </ContentWrapper>

            {/* QR Preview Overlay (custom) */}
            {qrPreview.open && (
                <div
                    onClick={closeQrModal}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        zIndex: 20000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
                    >
                        {qrPreview.src && (
                            <img
                                src={qrPreview.src}
                                alt="GCash QR Preview"
                                style={{ maxWidth: '90vw', maxHeight: '85vh', width: '100%', height: 'auto', display: 'block', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                            />
                        )}
                        <Button
                            onClick={closeQrModal}
                            variant="contained"
                            color="primary"
                            size="small"
                            style={{ position: 'absolute', top: -8, right: -8 }}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            )}

            {/* Fixed Footer */}
            <Footer>
                <FooterContent>
                    <TotalAmount>
                        <TotalLabel>Total Amount</TotalLabel>
                        <TotalValue>₱{totalAmount.toFixed(2)}</TotalValue>
                    </TotalAmount>
                    <PlaceOrderButton
                        variant="contained"
                        size="large"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            'Place Order'
                        )}
                    </PlaceOrderButton>
                </FooterContent>
            </Footer>
        </PageContainer>
    );
};

export default OrderSummaryPage;
