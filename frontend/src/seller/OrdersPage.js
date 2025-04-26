import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/orders/seller/placed', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data.orders)) {
        setOrders(response.data.orders);
      } else {
        setOrders([]);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch orders. Please try again later.');
      console.error('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/orders/seller/manage/${orderId}`,
        { action: 'updateStatus', status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders(); // Refresh orders after update
      setError(null);
    } catch (err) {
      setError('Failed to update order status. Please try again.');
      console.error('Error updating order status:', err);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.patch(
          `/api/orders/seller/manage/${orderId}`,
          { action: 'cancel' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchOrders(); // Refresh orders after cancellation
        setError(null);
      } catch (err) {
        setError('Failed to cancel order. Please try again.');
        console.error('Error canceling order:', err);
      }
    }
  };

  const filteredOrders = orders.filter(order => 
    statusFilter === 'all' ? true : order.status === statusFilter
  );

  if (loading) return <Typography>Loading orders...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Manage Orders
      </Typography>

      <FormControl sx={{ minWidth: 200, mb: 3 }}>
        <InputLabel>Filter by Status</InputLabel>
        <Select
          value={statusFilter}
          label="Filter by Status"
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <MenuItem value="all">All Orders</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="Placed">Placed</MenuItem>
          <MenuItem value="Shipped">Shipped</MenuItem>
          <MenuItem value="Delivered">Delivered</MenuItem>
          <MenuItem value="Canceled">Canceled</MenuItem>
        </Select>
      </FormControl>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer Name</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order._id}>
                <TableCell>{order._id}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>₱{order.totalAmount.toFixed(2)}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>{order.paymentStatus}</TableCell>
                <TableCell>
                  {order.status !== 'Canceled' && order.status !== 'Delivered' && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {order.status === 'Placed' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleStatusUpdate(order._id, 'Shipped')}
                        >
                          Mark as Shipped
                        </Button>
                      )}
                      {order.status === 'Shipped' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleStatusUpdate(order._id, 'Delivered')}
                        >
                          Mark as Delivered
                        </Button>
                      )}
                      {['Pending', 'Placed'].includes(order.status) && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleCancelOrder(order._id)}
                        >
                          Cancel Order
                        </Button>
                      )}
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default OrdersPage;