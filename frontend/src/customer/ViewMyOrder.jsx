/*
  * ViewMyOrder
  * -------------------------------------------------------------
  * Customer orders history and tracking page. It supports:
  *  - Fetching the authenticated user's orders and auto-refreshing them
  *  - Expandable order cards to view items and cost breakdown
  *  - Status timeline with visual indicators per order state
  *  - Reorder button to quickly add items back to cart
  *  - Add review flow targeting any item in the order
  *  - Manual GCash proof upload for orders using GCash_Manual
  *  - Success notifications via lightweight modal and inline toasts
  *
  * Data flow:
  *  - Initial load from /orders/my-orders
  *  - Periodic refresh every 15s to keep statuses up to date
  *  - Mutations (cancel, reorder, upload proof, review) call API
  *
  * Navigation:
  *  - Back button returns to the home page
  */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  ArrowBack, 
  CheckCircle, 
  Pending, 
  LocalShipping, 
  Restaurant,
  Refresh,
  Timeline as TimelineIcon,
  FiberManualRecord
} from '@mui/icons-material';
import api from '../api'; // Assumes you have an api instance for requests
import { customer, review, order as orderApi, cart } from '../api';
import { MdCheckCircle } from 'react-icons/md';
import { PrimaryButton, SecondaryButton, DestructiveButton, ButtonRow } from '../components/Buttons';

import defPic from '../assets/delibup.png';
import { getUser } from '../utils/tokenUtils';

// Styled Components
const PageContainer = styled.div`
  background-color: #ffffff;
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
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: #ff8c00;
  color: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  &:active {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const Content = styled.main`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
  padding-bottom: 80px;
`;

const OrderCard = styled.div`
  background: #fff;
  border-radius: 14px;
  margin-bottom: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const OrderHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f4f4f4;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const OrderBody = styled.div`
  padding: 16px;
`;

const OrderFooter = styled.div`
  padding: 12px 16px;
  background: #f9f9f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f0f0f0;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background: ${props => props.$bg || '#FFF3E0'};
  color: ${props => props.$fg || '#E65100'};
  text-transform: capitalize;
`;

// Using shared Buttons components

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  padding: 0 20px;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
`;

const TimelineContainer = styled.div`
  margin-top: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 10px;
  border: 1px dashed #eee;
`;
const TimelineTitle = styled.p`
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 6px;
`;
const TimelineList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;
const TimelineItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
`;
const TimelineDot = styled.span`
  color: #ff8c00;
  margin-top: 2px;
`;
const TimelineContent = styled.div`
  flex: 1;
`;
const TimelineStatus = styled.span`
  font-weight: 500;
  font-size: 13px;
`;
const TimelineTime = styled.span`
  font-size: 12px;
  color: #888;
  margin-left: 8px;
`;
const TimelineNote = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 2px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const ModalBox = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  padding: 28px 24px 20px 24px;
  min-width: 320px;
  max-width: 90vw;
  text-align: center;
`;
const ModalTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
`;
const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 18px;
`;

const ProductImage = styled.img`
  width: 66px;
  height: 66px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 12px;
  background: #f0f0f0;
`;

const Notification = styled.div`
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #323232;
  color: #fff;
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 2px 12px rgba(0,0,0,0.12);
  z-index: 2000;
  opacity: 0.97;
  animation: fadeInOut 3s forwards;

  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(-50%) translateY(-16px); }
    10% { opacity: 0.97; transform: translateX(-50%) translateY(0); }
    90% { opacity: 0.97; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-16px); }
  }
`;

const ViewMyOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [reviewingOrder, setReviewingOrder] = useState(null); // orderId being reviewed
  const [reviewComment, setReviewComment] = useState('');
  const [cancelingOrderId, setCancelingOrderId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [successModal, setSuccessModal] = useState({ open: false, message: '' });
  const [selectedProductId, setSelectedProductId] = useState('');
  // Manual GCash proof modal state
  const [proofOrderId, setProofOrderId] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofRef, setProofRef] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const navigate = useNavigate();

  const statusStyles = (status) => {
    const s = (status || '').toString().toLowerCase();
    switch (s) {
      case 'pending':
        return { bg: '#FFF3E0', fg: '#E65100' }; // Orange
      case 'preparing':
        return { bg: '#FFFDE7', fg: '#F9A825' }; // Yellow
      case 'ready':
        return { bg: '#E3F2FD', fg: '#1565C0' }; // Blue
      case 'delivered':
        return { bg: '#E8F5E9', fg: '#2E7D32' }; // Green
      case 'accepted':
        return { bg: '#E0F2F1', fg: '#00796B' }; // Teal
      case 'rejected':
        return { bg: '#FFEBEE', fg: '#C62828' }; // Red
      case 'canceled':
      case 'cancelled':
        return { bg: '#EEEEEE', fg: '#616161' }; // Gray
      default:
        return { bg: '#FFF3E0', fg: '#E65100' };
    }
  };

  // Helpers for action visibility
  const normalizeStatus = (s = '') => String(s || '').toLowerCase();
  const isDelivered = (order) => normalizeStatus(order.status) === 'delivered';
  const isPendingOrProcessing = (order) => {
    const s = normalizeStatus(order.status);
    return s === 'pending' || s === 'preparing' || s === 'processing' || s === 'accepted';
  };
  const isManualPayment = (order) => {
    const m = String(order.paymentMethod || '').toLowerCase();
    // Covers values like 'gcash_manual', 'gcash/manual', 'manual gcash', etc.
    return m.includes('gcash') && (m.includes('manual') || m.includes('_manual') || m.includes('/manual'));
  };

  const shortId = (id) => {
    if (!id) return '';
    const s = String(id);
    if (s.length <= 10) return `#${s}`;
    return `#${s.slice(0, 5)}…${s.slice(-5)}`;
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Fetch real orders from API
    api.get('/orders/my-orders')
      .then(res => {
        // Fix: extract orders from res.data.data.orders if present
        setOrders(res.data.data?.orders || res.data.orders || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load orders.');
      setLoading(false);
      });
  }, []);

  // Periodically refresh orders while page is open so payment status updates (e.g., after seller approves proof)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get('/orders/my-orders');
        setOrders(res.data.data?.orders || res.data.orders || []);
      } catch {
        // silent refresh failure
      }
    }, 15000); // every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const handleGoBack = () => {
    navigate('/customer/home');
  };

  const toggleOrderDetails = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    setExpandedOrder(orderId);
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <CheckCircle style={{ fontSize: '16px', marginRight: '4px' }} />;
      case 'shipped':
      case 'on-the-way':
        return <LocalShipping style={{ fontSize: '16px', marginRight: '4px' }} />;
      case 'preparing':
        return <Restaurant style={{ fontSize: '16px', marginRight: '4px' }} />;
      case 'canceled':
        return <span style={{ color: '#f44336', marginRight: '4px' }}>✕</span>;
      case 'pending':
      default:
        return <Pending style={{ fontSize: '16px', marginRight: '4px' }} />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleCancelOrder = async (orderId) => {
    setCancelingOrderId(orderId);
    try {
      await api.post(`/orders/${orderId}/cancel`, { cancellationReason: 'Canceled by customer' });
      // Refresh orders after cancellation
      const res = await api.get('/orders/my-orders');
      setOrders(res.data.data?.orders || res.data.orders || []);
      setShowCancelModal(false);
      setOrderToCancel(null);
      setSuccessModal({ open: true, message: 'Order canceled successfully' });
      setTimeout(() => setSuccessModal({ open: false, message: '' }), 1200);
    } catch (err) {
      alert('Failed to cancel order. Please try again.');
    } finally {
      setCancelingOrderId(null);
    }
  };

  return (
    <PageContainer>
      {successModal.open && (
        <ModalOverlay onClick={() => setSuccessModal({ open: false, message: '' })}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <MdCheckCircle size={44} color="#2E7D32" />
            <div style={{ fontSize: 16, fontWeight: 600, color: '#2E7D32', marginTop: 6 }}>
              {successModal.message || 'Success'}
            </div>
          </ModalBox>
        </ModalOverlay>
      )}
      <Header>
        <BackButton onClick={handleGoBack}>
          <ArrowBack />
          <span>Back</span>
        </BackButton>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>My Orders</h2>
        <div style={{ width: '48px' }}></div> {/* For alignment */}
      </Header>

      <Content>
        {notificationMessage && (
          <Notification>{notificationMessage}</Notification>
        )}
        {loading ? (
          <LoadingState>
            <Refresh style={{ fontSize: 40, color: '#ff8c00', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '16px', color: '#666' }}>Loading your orders...</p>
          </LoadingState>
        ) : error ? (
          <EmptyState>
            <p style={{ color: '#d32f2f', marginBottom: '16px' }}>{error}</p>
            <PrimaryButton onClick={() => window.location.reload()}>
              Try Again
            </PrimaryButton>
          </EmptyState>
        ) : orders.length === 0 ? (
          <EmptyState>
            <p style={{ color: '#666', marginBottom: '24px' }}>You haven't placed any orders yet</p>
            <PrimaryButton onClick={() => navigate('/customer/home')}>
              Start Ordering
            </PrimaryButton>
          </EmptyState>
        ) : (
          <div>
            {orders.map((order) => (
              <OrderCard key={order._id || order.id}>
                <OrderHeader>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}> {shortId(order.orderNumber || order._id || order.id)} </div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{new Date(order.createdAt).toLocaleString()}</div>
                  </div>
                  {(() => { const { bg, fg } = statusStyles(order.status); return (
                    <StatusBadge $bg={bg} $fg={fg}>
                      {order.status}
                    </StatusBadge>
                  ); })()}
                </OrderHeader>
                <OrderBody>
                  {order.items && order.items.slice(0, expandedOrder === (order._id || order.id) ? order.items.length : 2).map((item, index) => {
                    // Get product image and name
                    const product = item.product || {};
                    const imageUrl = product.image || defPic;
                    const productName = product.name || item.name || 'Product';
                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
                          <ProductImage src={imageUrl} alt={productName} onError={e => { e.target.onerror = null; e.target.src = defPic; }} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{productName}</div>
                            <div style={{ fontSize: 12, color: '#777' }}>{formatCurrency(item.price || product.price || 0)} × {item.quantity}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>
                          {formatCurrency((item.price || product.price || 0) * item.quantity)}
                        </span>
                    </div>
                    );
                  })}
                  {order.items && order.items.length > 2 && expandedOrder !== (order._id || order.id) && (
                    <p style={{ fontSize: '13px', color: '#666', margin: '8px 0 0 0' }}>
                      +{order.items.length - 2} more items
                    </p>
                  )}
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px dashed #eaeaea' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#777' }}>
                      <span style={{ fontSize: 14 }}>Subtotal</span>
                      <span style={{ fontSize: 14 }}>{formatCurrency((order.totalAmount || order.total || 0) - (order.shippingFee || order.deliveryFee || 0))}</span>
                    </div>
                    {(order.shippingFee || order.deliveryFee) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#777' }}>
                        <span style={{ fontSize: 14 }}>Delivery Fee</span>
                        <span style={{ fontSize: 14 }}>{formatCurrency(order.shippingFee || order.deliveryFee)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '10px 12px', background: '#fff7ec', borderRadius: 8 }}>
                      <span style={{ fontWeight: 800 }}>Total</span>
                      <span style={{ fontWeight: 800, color: '#ff8c00' }}>{formatCurrency(order.totalAmount || order.total || 0)}</span>
                    </div>
                  </div>
                  {expandedOrder === (order._id || order.id) && (
                    <>
                    <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0' }}>Order Details</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Payment Method</p>
                          <p style={{ fontSize: '14px', margin: 0 }}>{order.paymentMethod}</p>
                        </div>
                        <div style={{ borderLeft: '1px solid #f0f0f0', paddingLeft: 12 }}>
                          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Payment Status</p>
                          <p style={{ fontSize: '14px', margin: 0 }}>
                            {order.paymentStatus || 'Pending'}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Status</p>
                          <p style={{ 
                            fontSize: '14px', 
                            margin: 0,
                            color: statusStyles(order.status).fg,
                            fontWeight: 500
                          }}>
                              {order.status}
                            {order.cancelReason && (
                              <span style={{ display: 'block', fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                Reason: {order.cancelReason}
                              </span>
                            )}
                          </p>
                        </div>
                        <div style={{ borderLeft: '1px solid #f0f0f0', paddingLeft: 12 }}>
                          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Estimated Delivery</p>
                          <p style={{ fontSize: '14px', margin: 0 }}>
                              {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleString() : 'N/A'}
                          </p>
                          </div>
                        </div>
                      </div>
                      <TimelineContainer>
                        <TimelineTitle><TimelineIcon style={{ fontSize: 18, color: '#ff8c00' }} /> Order Status History</TimelineTitle>
                        {(() => {
                          const steps = ['Pending','Preparing','Ready','Delivered'];
                          const current = (order.status || '').toString().toLowerCase();
                          const { fg } = statusStyles(order.status);
                          return (
                            <TimelineList>
                              {steps.map((s, idx) => {
                                const done = steps.findIndex(x => x.toLowerCase() === current) >= idx;
                                const isCurrent = s.toLowerCase() === current;
                                return (
                                  <TimelineItem key={s}>
                                    <TimelineDot>
                                      <FiberManualRecord fontSize="small" style={{ color: isCurrent ? fg : '#bdbdbd' }} />
                                    </TimelineDot>
                                    <TimelineContent>
                                      <TimelineStatus style={{ color: isCurrent ? fg : '#757575', fontWeight: isCurrent ? 700 : 500 }}>{s}</TimelineStatus>
                                      {isCurrent && <TimelineTime>Current</TimelineTime>}
                                    </TimelineContent>
                                  </TimelineItem>
                                );
                              })}
                            </TimelineList>
                          );
                        })()}
                      </TimelineContainer>

                      {/* Secondary actions under dropdown to keep layout tidy */}
                      {(() => {
                        // Build eligible actions, then we'll subtract primaries in the footer
                        const actions = [];
                        const id = order._id || order.id;
                        // Eligible rules
                        const manual = isManualPayment(order);
                        const pendingProc = isPendingOrProcessing(order);
                        const delivered = isDelivered(order);

                        // Reorder is generally available
                        actions.push({ key: 'reorder', type: 'primary' });
                        if (delivered) actions.push({ key: 'review', type: 'secondary' });
                        if (manual && pendingProc) actions.push({ key: 'upload', type: 'accent' });
                        if (normalizeStatus(order.status) === 'pending') actions.push({ key: 'cancel', type: 'danger' });

                        // Determine primaries based on spec
                        let primaries = [];
                        if (pendingProc) {
                          primaries = [
                            { key: 'cancel', type: 'danger' },
                            ...(manual ? [{ key: 'upload', type: 'accent' }] : [])
                          ].slice(0, 2);
                        } else if (delivered) {
                          primaries = [
                            { key: 'reorder', type: 'primary' },
                            { key: 'review', type: 'secondary' }
                          ];
                        }
                        const primaryKeys = new Set(primaries.map(a => a.key));
                        const secondary = actions.filter(a => !primaryKeys.has(a.key));

                        if (secondary.length === 0) return null;
                        return (
                          <div style={{ marginTop: 12 }}>
                            <p style={{ fontSize: 13, color: '#666', margin: '0 0 8px 0' }}>More actions</p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {secondary.map(a => {
                                if (a.key === 'reorder') {
                                  return (
                                    <SecondaryButton
                                      key={a.key}
                                      onClick={async () => {
                                        try {
                                          const items = Array.isArray(order.items) ? order.items : [];
                                          if (items.length === 0) return;
                                          await Promise.all(
                                            items.map(async (it) => {
                                              const pid = it.product?._id || it.product || it._id;
                                              const qty = it.quantity || 1;
                                              if (pid) {
                                                try { await cart.addToCart(pid, qty); } catch {}
                                              }
                                            })
                                          );
                                          setSuccessModal({ open: true, message: 'Items added to cart' });
                                          setTimeout(() => setSuccessModal({ open: false, message: '' }), 1200);
                                        } catch {
                                          setNotificationMessage('Failed to reorder');
                                          setTimeout(() => setNotificationMessage(''), 3000);
                                        }
                                      }}
                                      style={{ fontSize: 12 }}
                                    >
                                      Reorder
                                    </SecondaryButton>
                                  );
                                }
                                if (a.key === 'review') {
                                  return (
                                    <SecondaryButton
                                      key={a.key}
                                      onClick={() => {
                                        setReviewingOrder(order._id || order.id);
                                        setReviewComment('');
                                        const firstProductId = order.items && order.items[0] && (order.items[0].product?._id || order.items[0].product || order.items[0]._id);
                                        setSelectedProductId(firstProductId || '');
                                      }}
                                      style={{ fontSize: 12 }}
                                    >
                                      Add Review
                                    </SecondaryButton>
                                  );
                                }
                                if (a.key === 'upload') {
                                  return (
                                    <SecondaryButton
                                      key={a.key}
                                      $accent
                                      onClick={() => {
                                        setProofOrderId(order._id || order.id);
                                        setProofFile(null);
                                        setProofRef('');
                                      }}
                                      style={{ fontSize: 12 }}
                                    >
                                      Upload Proof
                                    </SecondaryButton>
                                  );
                                }
                                if (a.key === 'cancel') {
                                  return (
                                    <SecondaryButton
                                      key={a.key}
                                      onClick={() => {
                                        setOrderToCancel(order._id || order.id);
                                        setShowCancelModal(true);
                                      }}
                                      style={{ fontSize: 12 }}
                                    >
                                      Cancel
                                    </SecondaryButton>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </OrderBody>
                <OrderFooter>
                  <SecondaryButton
                    onClick={() => toggleOrderDetails(order._id || order.id)}
                    style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {expandedOrder === (order._id || order.id) ? 'Hide Details' : 'Click to View'}
                    <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: expandedOrder === (order._id || order.id) ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                  </SecondaryButton>
                  <ButtonRow style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {(() => {
                      // Build primary actions based on status rules, max 2 buttons
                      const primary = [];
                      const manual = isManualPayment(order);
                      if (isPendingOrProcessing(order)) {
                        // Pending/Processing: Cancel (red) + Upload Proof (orange if manual)
                        primary.push({ key: 'cancel' });
                        if (manual) primary.push({ key: 'upload' });
                      } else if (isDelivered(order)) {
                        // Delivered: Reorder (orange) + Add Review (gray)
                        primary.push({ key: 'reorder' }, { key: 'review' });
                      }
                      const limited = primary.slice(0, 2);
                      return limited.map(({ key }) => {
                        if (key === 'reorder') {
                          return (
                            <PrimaryButton
                              key={key}
                              onClick={async () => {
                                try {
                                  const items = Array.isArray(order.items) ? order.items : [];
                                  if (items.length === 0) return;
                                  await Promise.all(
                                    items.map(async (it) => {
                                      const pid = it.product?._id || it.product || it._id;
                                      const qty = it.quantity || 1;
                                      if (pid) {
                                        try { await cart.addToCart(pid, qty); } catch {}
                                      }
                                    })
                                  );
                                  setSuccessModal({ open: true, message: 'Items added to cart' });
                                  setTimeout(() => setSuccessModal({ open: false, message: '' }), 1200);
                                } catch {
                                  setNotificationMessage('Failed to reorder');
                                  setTimeout(() => setNotificationMessage(''), 3000);
                                }
                              }}
                              style={{ fontSize: 12 }}
                            >
                              Reorder
                            </PrimaryButton>
                          );
                        }
                        if (key === 'review') {
                          return (
                            <SecondaryButton
                              key={key}
                              onClick={() => {
                                setReviewingOrder(order._id || order.id);
                                setReviewComment('');
                                const firstProductId = order.items && order.items[0] && (order.items[0].product?._id || order.items[0].product || order.items[0]._id);
                                setSelectedProductId(firstProductId || '');
                              }}
                              style={{ fontSize: 12 }}
                            >
                              Add Review
                            </SecondaryButton>
                          );
                        }
                        if (key === 'upload') {
                          return (
                            <PrimaryButton
                              key={key}
                              onClick={() => {
                                setProofOrderId(order._id || order.id);
                                setProofFile(null);
                                setProofRef('');
                              }}
                              style={{ fontSize: 12 }}
                            >
                              Upload Proof
                            </PrimaryButton>
                          );
                        }
                        if (key === 'cancel') {
                          return (
                            <DestructiveButton
                              key={key}
                              onClick={() => {
                                setOrderToCancel(order._id || order.id);
                                setShowCancelModal(true);
                              }}
                              style={{ fontSize: 12 }}
                              disabled={cancelingOrderId === (order._id || order.id)}
                            >
                              {cancelingOrderId === (order._id || order.id) ? 'Canceling...' : 'Cancel'}
                            </DestructiveButton>
                          );
                        }
                        return null;
                      });
                    })()}
                  </ButtonRow>
                </OrderFooter>
              </OrderCard>
            ))}
          </div>
        )}
      </Content>
      {/* Modal: Upload Manual GCash Proof */}
      {proofOrderId && (
        <ModalOverlay>
          <ModalBox>
            <ModalTitle>Upload GCash Payment Proof</ModalTitle>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 14, margin: '6px 0' }}>Screenshot/Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  setProofFile(file || null);
                }}
              />
              {proofFile && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={URL.createObjectURL(proofFile)}
                    alt="Preview"
                    style={{ width: 160, height: 160, objectFit: 'contain', borderRadius: 8, background: '#fafafa', border: '1px solid #eee' }}
                  />
                </div>
              )}
              <label style={{ display: 'block', fontWeight: 600, fontSize: 14, margin: '12px 0 6px' }}>GCash Reference No. (optional)</label>
              <input
                type="text"
                value={proofRef}
                onChange={(e) => setProofRef(e.target.value)}
                placeholder="e.g., 1234-5678-9012"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
              />
            </div>
            <ModalActions>
              <PrimaryButton
                style={{ padding: '10px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, minWidth: 110, opacity: uploadingProof ? 0.7 : 1 }}
                disabled={uploadingProof || !proofFile}
                onClick={async () => {
                  if (!proofFile) return;
                  setUploadingProof(true);
                  try {
                    await orderApi.uploadManualGcashProof(proofOrderId, { file: proofFile, gcashRef: proofRef });
                    // Refresh orders
                    const res = await api.get('/orders/my-orders');
                    setOrders(res.data.data?.orders || res.data.orders || []);
                    setNotificationMessage('Proof uploaded. Awaiting seller confirmation.');
                    setTimeout(() => setNotificationMessage(''), 3000);
                    setProofOrderId(null);
                    setProofFile(null);
                    setProofRef('');
                  } catch (e) {
                    const msg = (e && (e.message || e.error || e.details)) || 'Upload failed';
                    setNotificationMessage(msg);
                    setTimeout(() => setNotificationMessage(''), 3500);
                  } finally {
                    setUploadingProof(false);
                  }
                }}
              >
                {uploadingProof ? 'Uploading...' : 'Submit Proof'}
              </PrimaryButton>
              <SecondaryButton
                style={{ padding: '10px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, minWidth: 110 }}
                onClick={() => { setProofOrderId(null); setProofFile(null); setProofRef(''); }}
                disabled={uploadingProof}
              >
                Cancel
              </SecondaryButton>
            </ModalActions>
          </ModalBox>
        </ModalOverlay>
      )}
      {/* Modal for cancel confirmation */}
      {showCancelModal && (
        <ModalOverlay>
          <ModalBox>
            <ModalTitle>Cancel Order?</ModalTitle>
            <p style={{ color: '#444', marginBottom: 0 }}>Are you sure you want to cancel this order?</p>
            <ModalActions>
              <DestructiveButton
                style={{ minWidth: 90, fontSize: 12 }}
                onClick={() => handleCancelOrder(orderToCancel)}
                disabled={cancelingOrderId === orderToCancel}
              >
                {cancelingOrderId === orderToCancel ? 'Canceling...' : 'Yes, Cancel'}
              </DestructiveButton>
              <SecondaryButton
                style={{ minWidth: 90, fontSize: 12 }}
                onClick={() => { setShowCancelModal(false); setOrderToCancel(null); }}
                disabled={cancelingOrderId === orderToCancel}
              >
                No, Go Back
              </SecondaryButton>
            </ModalActions>
          </ModalBox>
        </ModalOverlay>
      )}
      {reviewingOrder && (
        <ModalOverlay>
          <ModalBox>
            <ModalTitle>Add a Review</ModalTitle>
            {/* Product selector */}
            {(() => {
              const order = orders.find(o => (o._id || o.id) === reviewingOrder);
              if (!order) return null;
              return (
                <div style={{ marginBottom: 12 }}>
                  <label htmlFor="product-select" style={{ fontWeight: 500, fontSize: 15, marginBottom: 4, display: 'block' }}>Select Product:</label>
                  <select
                    id="product-select"
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15, marginBottom: 8 }}
                  >
                    {order.items.map((item, idx) => {
                      const product = item.product || {};
                      const productId = product._id || item.product || item._id;
                      const productName = product.name || 'Product';
                      return (
                        <option key={productId} value={productId}>{productName}</option>
                      );
                    })}
                  </select>
                </div>
              );
            })()}
            <textarea
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              rows={3}
              style={{ width: '100%', borderRadius: '6px', border: '1px solid #ccc', padding: '8px', fontSize: '14px', resize: 'vertical', marginBottom: 8 }}
              placeholder="Write your review here..."
            />
            <ModalActions>
              <PrimaryButton
                onClick={async () => {
                  if (reviewComment.trim() && selectedProductId) {
                    const order = orders.find(o => (o._id || o.id) === reviewingOrder);
                    const product = order && order.items.find(item => {
                      const pid = item.product?._id || item.product || item._id;
                      return pid === selectedProductId;
                    });
                    try {
                      await review.create(selectedProductId, { comment: reviewComment });
                      setReviewingOrder(null);
                      setReviewComment('');
                      setSelectedProductId('');
                      setSuccessModal({ open: true, message: 'Review submitted successfully' });
                      setTimeout(() => setSuccessModal({ open: false, message: '' }), 1200);
                    } catch (e) {
                      setNotificationMessage(
                        (e && (e.message || e.error || e.details)) || 'Failed to submit review'
                      );
                      setTimeout(() => setNotificationMessage(''), 3000);
                    }
                  }
                }}
                style={{ fontSize: 12 }}
              >
                Submit
              </PrimaryButton>
              <SecondaryButton
                onClick={() => {
                  setReviewingOrder(null);
                  setReviewComment('');
                  setSelectedProductId('');
                }}
                  style={{ fontSize: 12 }}
              >
                Cancel
              </SecondaryButton>
            </ModalActions>
          </ModalBox>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default ViewMyOrder; 