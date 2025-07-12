import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdArrowBack } from 'react-icons/md';
import { order, auth } from '../api';
import './OrdersPage.css';
import defPic from '../assets/delibup.png';
import { FiRefreshCw } from 'react-icons/fi';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [userRole, setUserRole] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  useEffect(() => {
    fetchOrders();
    // Fetch user role on mount
    const fetchUserRole = async () => {
      try {
        const user = await auth.getMe();
        setUserRole(user.role);
      } catch (err) {
        setUserRole(null);
      }
    };
    fetchUserRole();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const result = await order.getSellerOrders(params);
      const orders = result.data?.orders || result.orders || [];
      setOrders(orders);
      setError(null);
    } catch (err) {
      setError('Failed to fetch orders. Please try again later.');
      toast.error('Failed to fetch orders. Please try again later.');
      console.error('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await order.updateOrderStatus(orderId, { status: newStatus });
      fetchOrders(); // Refresh orders after update
      toast.success(`Order marked as ${newStatus}`);
      setError(null);
    } catch (err) {
      setError('Failed to update order status. Please try again.');
      toast.error('Failed to update order status. Please try again.');
      console.error('Error updating order status:', err);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await order.cancelOrder(orderId, { cancellationReason: 'Canceled by customer' });
        fetchOrders(); // Refresh orders after cancellation
        toast.success('Order cancelled successfully');
        setError(null);
      } catch (err) {
        setError('Failed to cancel order. Please try again.');
        toast.error('Failed to cancel order. Please try again.');
        console.error('Error canceling order:', err);
      }
    }
  };

  const handleMarkPaid = async (orderId) => {
    try {
      await order.updateOrderStatus(orderId, { paymentStatus: 'Paid' });
      fetchOrders();
      toast.success('Order marked as Paid');
      setError(null);
    } catch (err) {
      setError('Failed to mark as paid. Please try again.');
      toast.error('Failed to mark as paid. Please try again.');
      console.error('Error marking as paid:', err);
    }
  };

  const handleToggleDetails = async (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      setOrderDetails(null);
      setDetailsError(null);
      return;
    }
    setExpandedOrderId(orderId);
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const res = await order.getOrderDetails(orderId);
      setOrderDetails(res.data?.order || res.order || null);
    } catch (err) {
      setDetailsError(err.message || 'Failed to load order details.');
      setOrderDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => 
    statusFilter === 'all' ? true : order.status === statusFilter
  );

  const statusBadgeColor = (status) => {
    switch(status) {
      case 'Pending': return '#f39c12';
      case 'Accepted': return '#3498db';
      case 'Preparing': return '#8e44ad';
      case 'Ready': return '#2980b9';
      case 'Out for Delivery': return '#2ecc71';
      case 'Ready for Pickup': return '#16a085';
      case 'Delivered': return '#27ae60';
      case 'Rejected': return '#e67e22';
      case 'Canceled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="orders-main-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="orders-header">
        <div className="orders-back-button" onClick={() => navigate('/seller/dashboard')}>
          <span className="orders-back-arrow">←</span>
          <span className="orders-header-text">Manage Orders</span>
        </div>
        <button
          className="orders-refresh-btn"
          aria-label="Refresh"
          onClick={fetchOrders}
          disabled={loading}
          tabIndex={0}
          style={{
            position: 'absolute',
            right: 16,
            top: 10,
            background: 'none',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            width: 40,
            height: 40,
            zIndex: 2
          }}
        >
          <FiRefreshCw
            size={24}
            color={loading ? '#ff9800' : '#fff'}
            className={loading ? 'spin' : ''}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="orders-content-container">
        <div className="orders-filter-container">
          <div className="orders-filter-label">Filter by Status:</div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="order-filter-select"
          >
            <option value="all">All Orders</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready">Ready</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Ready for Pickup">Ready for Pickup</option>
            <option value="Delivered">Delivered</option>
            <option value="Canceled">Canceled</option>
          </select>
        </div>

        {loading ? (
          <div className="orders-loading-container">
            <div className="orders-loading-spinner"></div>
            <p className="orders-loading-text">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="orders-error">{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-no-orders">
            <p>No orders found.</p>
          </div>
        ) : (
          <div className="orders-responsive-wrapper">
            {/* Desktop Table */}
            <table className="orders-table desktop-only">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <React.Fragment key={order._id}>
                    <tr>
                    <td>{order._id.slice(-8)}</td>
                    <td>{order.customer?.name || order.customerName || 'N/A'}</td>
                    <td><span className="order-amount">₱{order.totalAmount.toFixed(2)}</span></td>
                    <td><span className="status-badge" style={{ backgroundColor: statusBadgeColor(order.status) }}>{order.status}</span></td>
                    <td><span className={`payment-status ${order.paymentStatus === 'Paid' ? 'paid' : 'unpaid'}`}>{order.paymentStatus}</span></td>
                    <td>
                      <div className="action-buttons">
                        {order.status !== 'Canceled' && order.status !== 'Delivered' && order.status !== 'Rejected' && (
                          <div>
                            {order.status === 'Pending' && (
                              <button
                                onClick={() => handleStatusUpdate(order._id, 'Accepted')}
                                className="accept-button"
                              >
                                Accept
                              </button>
                            )}
                            {order.status === 'Accepted' && (
                              <button
                                onClick={() => handleStatusUpdate(order._id, 'Preparing')}
                                className="prepare-button"
                              >
                                Start Preparing
                              </button>
                            )}
                            {order.status === 'Preparing' && order.orderType === 'Delivery' && (
                              <button
                                onClick={() => handleStatusUpdate(order._id, 'Out for Delivery')}
                                className="outfordelivery-button"
                              >
                                Out for Delivery
                              </button>
                            )}
                            {order.status === 'Preparing' && order.orderType === 'Pickup' && (
                              <button
                                onClick={() => handleStatusUpdate(order._id, 'Ready')}
                                className="ready-button"
                              >
                                Mark Ready
                              </button>
                            )}
                            {order.status === 'Ready' && order.orderType === 'Pickup' && (
                              <button
                                onClick={() => handleStatusUpdate(order._id, 'Ready for Pickup')}
                                className="readyforpickup-button"
                              >
                                Ready for Pickup
                              </button>
                            )}
                            {order.status === 'Out for Delivery' && (
                              <button
                                onClick={() => handleStatusUpdate(order._id, 'Delivered')}
                                className="deliver-button"
                              >
                                Mark Delivered
                              </button>
                            )}
                            {order.status === 'Ready for Pickup' && (
                              <button
                                onClick={() => handleStatusUpdate(order._id, 'Delivered')}
                                className="deliver-button"
                              >
                                Mark Picked Up
                              </button>
                            )}
                            {['Pending', 'Accepted'].includes(order.status) && (
                              <button
                                onClick={() => {
                                  if (userRole === 'Seller') {
                                    handleStatusUpdate(order._id, 'Rejected');
                                  } else {
                                    handleCancelOrder(order._id);
                                  }
                                }}
                                className="cancel-button"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        )}
                        {order.status === 'Delivered' && order.paymentStatus !== 'Paid' && (
                          <button
                            onClick={() => handleMarkPaid(order._id)}
                            className="action-button"
                          >
                            Mark Paid
                          </button>
                        )}
                          <button
                            className="details-button"
                            onClick={() => handleToggleDetails(order._id)}
                            style={{ marginTop: 4 }}
                          >
                            {expandedOrderId === order._id ? 'Hide Details' : 'View Details'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expandable details row */}
                    {expandedOrderId === order._id && (
                      <tr>
                        <td colSpan={6} style={{ background: '#fafafa', padding: 0 }}>
                          <div className="order-details-container">
                            {detailsLoading ? (
                              <div className="orders-loading-spinner" style={{ margin: '16px 0' }} />
                            ) : detailsError ? (
                              <div className="orders-error">{detailsError}</div>
                            ) : orderDetails ? (
                              <div style={{ padding: 16 }}>
                                <div className="order-details-row"><b>Customer:</b> {orderDetails.customer?.name} ({orderDetails.customer?.email})</div>
                                <div className="order-details-row"><b>Order Type:</b> {orderDetails.orderType}</div>
                                <div className="order-details-row"><b>Payment:</b> {orderDetails.paymentMethod} ({orderDetails.paymentStatus})</div>
                                {orderDetails.orderType === 'Delivery' && orderDetails.deliveryDetails && (
                                  <div className="order-details-row"><b>Delivery:</b> {orderDetails.deliveryDetails.receiverName}, {orderDetails.deliveryDetails.contactNumber}, {orderDetails.deliveryDetails.building} {orderDetails.deliveryDetails.roomNumber}</div>
                                )}
                                {orderDetails.orderType === 'Pickup' && orderDetails.pickupDetails && (
                                  <div className="order-details-row"><b>Pickup:</b> {orderDetails.pickupDetails.contactNumber}, {orderDetails.pickupDetails.pickupTime ? new Date(orderDetails.pickupDetails.pickupTime).toLocaleString() : ''}</div>
                                )}
                                <div className="order-details-row"><b>Items:</b></div>
                                <ul style={{ margin: '4px 0 8px 16px' }}>
                                  {orderDetails.items.map((item, idx) => {
                                    const imageUrl = item.product?.image || defPic;
                                    const productName = item.product?.name || 'Product';
                                    return (
                                      <li key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                        <img src={imageUrl} alt={productName} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, marginRight: 8, background: '#f0f0f0' }} onError={e => { e.target.onerror = null; e.target.src = defPic; }} />
                                        <span>{productName} x{item.quantity} @ ₱{item.price.toFixed(2)}</span>
                                      </li>
                                    );
                                  })}
                                </ul>
                                <div className="order-details-row"><b>Notes:</b> {orderDetails.notes || 'None'}</div>
                                <div className="order-details-row"><b>Status History:</b></div>
                                <ul className="order-details-timeline" style={{ margin: '4px 0 0 16px' }}>
                                  {orderDetails.statusHistory && orderDetails.statusHistory.length > 0 ? orderDetails.statusHistory.map((h, idx) => (
                                    <li key={idx} style={{ marginBottom: 4 }}>
                                      <b>{h.status}</b> <span style={{ color: '#888', fontSize: 12 }}>({h.timestamp ? new Date(h.timestamp).toLocaleString() : ''})</span>
                                      {h.note && <div style={{ fontSize: 12, color: '#666' }}>{h.note}</div>}
                                    </li>
                                  )) : <li style={{ color: '#888', fontSize: 13 }}>No status history available.</li>}
                                </ul>
                              </div>
                            ) : null}
                      </div>
                    </td>
                  </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            {/* Mobile Card Layout */}
            <div className="mobile-only">
              {filteredOrders.map((order) => (
                <div className="order-card" key={order._id}>
                  <div className="order-row"><span className="order-label">Order ID:</span> <span className="order-value">{order._id.slice(-8)}</span></div>
                  <div className="order-row"><span className="order-label">Customer:</span> <span className="order-value">{order.customer?.name || order.customerName || 'N/A'}</span></div>
                  <div className="order-row"><span className="order-label">Amount:</span> <span className="order-value order-amount">₱{order.totalAmount.toFixed(2)}</span></div>
                  <div className="order-row"><span className="order-label">Status:</span> <span className="order-value status-badge" style={{ backgroundColor: statusBadgeColor(order.status) }}>{order.status}</span></div>
                  <div className="order-row"><span className="order-label">Payment:</span> <span className={`order-value payment-status ${order.paymentStatus === 'Paid' ? 'paid' : 'unpaid'}`}>{order.paymentStatus}</span></div>
                  <div className="order-row">
                    <div className="action-buttons">
                      {order.status !== 'Canceled' && order.status !== 'Delivered' && order.status !== 'Rejected' && (
                        <>
                          {order.status === 'Pending' && (
                            <button
                              onClick={() => handleStatusUpdate(order._id, 'Accepted')}
                              className="accept-button"
                            >
                              Accept
                            </button>
                          )}
                          {order.status === 'Accepted' && (
                            <button
                              onClick={() => handleStatusUpdate(order._id, 'Preparing')}
                              className="prepare-button"
                            >
                              Start Preparing
                            </button>
                          )}
                          {order.status === 'Preparing' && order.orderType === 'Delivery' && (
                            <button
                              onClick={() => handleStatusUpdate(order._id, 'Out for Delivery')}
                              className="outfordelivery-button"
                            >
                              Out for Delivery
                            </button>
                          )}
                          {order.status === 'Preparing' && order.orderType === 'Pickup' && (
                            <button
                              onClick={() => handleStatusUpdate(order._id, 'Ready')}
                              className="ready-button"
                            >
                              Mark Ready
                            </button>
                          )}
                          {order.status === 'Ready' && order.orderType === 'Pickup' && (
                            <button
                              onClick={() => handleStatusUpdate(order._id, 'Ready for Pickup')}
                              className="readyforpickup-button"
                            >
                              Ready for Pickup
                            </button>
                          )}
                          {order.status === 'Out for Delivery' && (
                            <button
                              onClick={() => handleStatusUpdate(order._id, 'Delivered')}
                              className="deliver-button"
                            >
                              Mark Delivered
                            </button>
                          )}
                          {order.status === 'Ready for Pickup' && (
                            <button
                              onClick={() => handleStatusUpdate(order._id, 'Delivered')}
                              className="deliver-button"
                            >
                              Mark Picked Up
                            </button>
                          )}
                          {['Pending', 'Accepted'].includes(order.status) && (
                            <button
                              onClick={() => {
                                if (userRole === 'Seller') {
                                  handleStatusUpdate(order._id, 'Rejected');
                                } else {
                                  handleCancelOrder(order._id);
                                }
                              }}
                              className="cancel-button"
                            >
                              Cancel
                            </button>
                          )}
                        </>
                      )}
                      {order.status === 'Delivered' && order.paymentStatus !== 'Paid' && (
                        <button
                          onClick={() => handleMarkPaid(order._id)}
                          className="action-button"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        className="details-button"
                        onClick={() => handleToggleDetails(order._id)}
                        style={{ marginTop: 4 }}
                      >
                        {expandedOrderId === order._id ? 'Hide Details' : 'View Details'}
                      </button>
                    </div>
                  </div>
                  {/* Expandable details section */}
                  {expandedOrderId === order._id && (
                    <div className="order-details-container" style={{ background: '#fafafa', margin: '8px 0', borderRadius: 8, padding: 8 }}>
                      {detailsLoading ? (
                        <div className="orders-loading-spinner" style={{ margin: '16px 0' }} />
                      ) : detailsError ? (
                        <div className="orders-error">{detailsError}</div>
                      ) : orderDetails ? (
                        <div>
                          <div className="order-details-row"><b>Customer:</b> {orderDetails.customer?.name} ({orderDetails.customer?.email})</div>
                          <div className="order-details-row"><b>Order Type:</b> {orderDetails.orderType}</div>
                          <div className="order-details-row"><b>Payment:</b> {orderDetails.paymentMethod} ({orderDetails.paymentStatus})</div>
                          {orderDetails.orderType === 'Delivery' && orderDetails.deliveryDetails && (
                            <div className="order-details-row"><b>Delivery:</b> {orderDetails.deliveryDetails.receiverName}, {orderDetails.deliveryDetails.contactNumber}, {orderDetails.deliveryDetails.building} {orderDetails.deliveryDetails.roomNumber}</div>
                          )}
                          {orderDetails.orderType === 'Pickup' && orderDetails.pickupDetails && (
                            <div className="order-details-row"><b>Pickup:</b> {orderDetails.pickupDetails.contactNumber}, {orderDetails.pickupDetails.pickupTime ? new Date(orderDetails.pickupDetails.pickupTime).toLocaleString() : ''}</div>
                          )}
                          <div className="order-details-row"><b>Items:</b></div>
                          <ul style={{ margin: '4px 0 8px 16px' }}>
                            {orderDetails.items.map((item, idx) => {
                              const imageUrl = item.product?.image || defPic;
                              const productName = item.product?.name || 'Product';
                              return (
                                <li key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                  <img src={imageUrl} alt={productName} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, marginRight: 8, background: '#f0f0f0' }} onError={e => { e.target.onerror = null; e.target.src = defPic; }} />
                                  <span>{productName} x{item.quantity} @ ₱{item.price.toFixed(2)}</span>
                                </li>
                              );
                            })}
                          </ul>
                          <div className="order-details-row"><b>Notes:</b> {orderDetails.notes || 'None'}</div>
                          <div className="order-details-row"><b>Status History:</b></div>
                          <ul className="order-details-timeline" style={{ margin: '4px 0 0 16px' }}>
                            {orderDetails.statusHistory && orderDetails.statusHistory.length > 0 ? orderDetails.statusHistory.map((h, idx) => (
                              <li key={idx} style={{ marginBottom: 4 }}>
                                <b>{h.status}</b> <span style={{ color: '#888', fontSize: 12 }}>({h.timestamp ? new Date(h.timestamp).toLocaleString() : ''})</span>
                                {h.note && <div style={{ fontSize: 12, color: '#666' }}>{h.note}</div>}
                              </li>
                            )) : <li style={{ color: '#888', fontSize: 13 }}>No status history available.</li>}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;