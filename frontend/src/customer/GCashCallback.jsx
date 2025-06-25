import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { order } from '../api';
import { CircularProgress, Typography, Button, Box } from '@mui/material';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const GCashCallback = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const orderId = query.get('orderId');
  const status = query.get('status');
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'failed') {
      setError('Payment failed or was cancelled.');
      setLoading(false);
      return;
    }
    if (!orderId) {
      setError('Order ID not found.');
      setLoading(false);
      return;
    }
    let interval;
    const pollPayment = async () => {
      try {
        const res = await order.getOrderDetails(orderId);
        if (res.data?.order?.paymentStatus === 'Paid' || res.order?.paymentStatus === 'Paid') {
          setPaid(true);
          setLoading(false);
          clearInterval(interval);
        }
      } catch (err) {
        setError('Could not verify payment.');
        setLoading(false);
        clearInterval(interval);
      }
    };
    interval = setInterval(pollPayment, 2000);
    pollPayment();
    return () => clearInterval(interval);
  }, [orderId, status]);

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
        <CircularProgress />
        <Typography variant="h6" mt={2}>Processing your payment...</Typography>
      </Box>
    );
  }
  if (error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
        <Typography variant="h6" color="error">{error}</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>Go Home</Button>
      </Box>
    );
  }
  if (paid) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
        <Typography variant="h5" color="success.main">Payment successful!</Typography>
        <Typography variant="body1" mt={2}>Thank you for your order. Your payment has been confirmed.</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/customer/orders')}>View My Orders</Button>
      </Box>
    );
  }
  return null;
};

export default GCashCallback; 