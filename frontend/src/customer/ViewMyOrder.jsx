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
import { customer } from '../api';
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
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border-left: 4px solid ${props => 
    props.status === 'completed' ? '#4CAF50' : '#FFA000'};
`;

const OrderHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
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
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => 
    props.status === 'delivered' ? '#E8F5E9' : 
    props.status === 'shipped' ? '#E3F2FD' :
    props.status === 'placed' ? '#FFF8E1' :
    props.status === 'canceled' ? '#FFEBEE' : '#FFF3E0'};
  color: ${props => 
    props.status === 'delivered' ? '#2E7D32' :
    props.status === 'shipped' ? '#1565C0' :
    props.status === 'placed' ? '#F57F17' :
    props.status === 'canceled' ? '#C62828' : '#E65100'};
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  
  &.primary {
    background: #ff8c00;
    color: white;
    border: none;
    &:active {
      background: #e67e00;
    }
  }
  
  &.outline {
    background: white;
    border: 1px solid #e0e0e0;
    color: #333;
    &:active {
      background: #f5f5f5;
    }
  }
`;

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
  background: #f5f5f5;
  border-radius: 8px;
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
  width: 48px;
  height: 48px;
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
  const [selectedProductId, setSelectedProductId] = useState('');
  const navigate = useNavigate();

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

  // Helper to save review to localStorage
  function saveProductReview(productId, comment, userName, userImage) {
    const key = 'productReviews';
    const reviews = JSON.parse(localStorage.getItem(key) || '[]');
    reviews.push({ productId, comment, createdAt: new Date().toISOString(), userName, userImage });
    localStorage.setItem(key, JSON.stringify(reviews));
  }

  const handleCancelOrder = async (orderId) => {
    setCancelingOrderId(orderId);
    try {
      await api.post(`/orders/${orderId}/cancel`, { cancellationReason: 'Canceled by customer' });
      // Refresh orders after cancellation
      const res = await api.get('/orders/my-orders');
      setOrders(res.data.data?.orders || res.data.orders || []);
      setShowCancelModal(false);
      setOrderToCancel(null);
    } catch (err) {
      alert('Failed to cancel order. Please try again.');
    } finally {
      setCancelingOrderId(null);
    }
  };

  return (
    <PageContainer>
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
            <Button 
              className="primary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </EmptyState>
        ) : orders.length === 0 ? (
          <EmptyState>
            <p style={{ color: '#666', marginBottom: '24px' }}>You haven't placed any orders yet</p>
            <Button 
              className="primary"
              onClick={() => navigate('/customer/home')}
            >
              Start Ordering
            </Button>
          </EmptyState>
        ) : (
          <div>
            {orders.map((order) => (
              <OrderCard key={order._id || order.id} status={order.status}>
                <OrderHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>{new Date(order.createdAt).toLocaleString()}</span>
                    <StatusBadge status={order.status}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </StatusBadge>
                  </div>
                  <h3 style={{ margin: '8px 0', fontSize: '16px', fontWeight: 600 }}>
                    Order #{order.orderNumber || order._id || order.id}
                  </h3>
                </OrderHeader>
                <OrderBody>
                  {order.items && order.items.slice(0, expandedOrder === (order._id || order.id) ? order.items.length : 2).map((item, index) => {
                    // Get product image and name
                    const product = item.product || {};
                    const imageUrl = product.image || defPic;
                    const productName = product.name || item.name || 'Product';
                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
                          <ProductImage src={imageUrl} alt={productName} onError={e => { e.target.onerror = null; e.target.src = defPic; }} />
                          <span style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.quantity}x {productName}</span>
                        </div>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>
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
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px' }}>Subtotal</span>
                      <span style={{ fontSize: '14px' }}>{formatCurrency((order.totalAmount || order.total || 0) - (order.shippingFee || order.deliveryFee || 0))}</span>
                    </div>
                    {(order.shippingFee || order.deliveryFee) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px' }}>Delivery Fee</span>
                        <span style={{ fontSize: '14px' }}>{formatCurrency(order.shippingFee || order.deliveryFee)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
                      <span style={{ fontWeight: 600 }}>Total</span>
                      <span style={{ fontWeight: 600, color: '#ff8c00' }}>{formatCurrency(order.totalAmount || order.total || 0)}</span>
                    </div>
                  </div>
                  {expandedOrder === (order._id || order.id) && (
                    <>
                    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0' }}>Order Details</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Payment Method</p>
                          <p style={{ fontSize: '14px', margin: 0 }}>{order.paymentMethod}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Status</p>
                          <p style={{ 
                            fontSize: '14px', 
                            margin: 0,
                            color: order.status === 'delivered' ? '#2E7D32' :
                                  order.status === 'shipped' ? '#1565C0' :
                                  order.status === 'placed' ? '#F57F17' :
                                  order.status === 'canceled' ? '#C62828' : '#E65100',
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
                        <div>
                          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Estimated Delivery</p>
                          <p style={{ fontSize: '14px', margin: 0 }}>
                              {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleString() : 'N/A'}
                          </p>
                          </div>
                        </div>
                      </div>
                      <TimelineContainer>
                        <TimelineTitle><TimelineIcon style={{ fontSize: 18, color: '#ff8c00' }} /> Order Status History</TimelineTitle>
                        {order.statusHistory && order.statusHistory.length > 0 ? (
                          <TimelineList>
                            {order.statusHistory.map((h, idx) => (
                              <TimelineItem key={idx}>
                                <TimelineDot><FiberManualRecord fontSize="small" /></TimelineDot>
                                <TimelineContent>
                                  <TimelineStatus>{getStatusIcon(h.status)} {h.status}</TimelineStatus>
                                  <TimelineTime>{h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}</TimelineTime>
                                  {h.note && <TimelineNote>{h.note}</TimelineNote>}
                                </TimelineContent>
                              </TimelineItem>
                            ))}
                          </TimelineList>
                        ) : (
                          <span style={{ color: '#888', fontSize: 13 }}>No status history available.</span>
                        )}
                      </TimelineContainer>
                    </>
                  )}
                </OrderBody>
                <OrderFooter>
                  <Button 
                    className="outline"
                    onClick={() => toggleOrderDetails(order._id || order.id)}
                    style={{ fontSize: '14px' }}
                  >
                    {expandedOrder === (order._id || order.id) ? 'Hide Details' : 'View Details'}
                  </Button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                      className="outline"
                      onClick={() => console.log('Reordering order:', order._id || order.id)}
                      style={{ fontSize: '14px' }}
                    >
                      Reorder
                    </Button>
                    <Button 
                      className="primary"
                      onClick={async () => {
                        setReviewingOrder(order._id || order.id);
                        setReviewComment('');
                        const firstProductId = order.items && order.items[0] && (order.items[0].product?._id || order.items[0].product || order.items[0]._id);
                        setSelectedProductId(firstProductId || '');
                      }}
                      style={{ fontSize: '14px' }}
                    >
                      Add Review
                    </Button>
                    {order.status === 'Pending' && (
                      <Button
                        className="cancel"
                        onClick={() => {
                          setOrderToCancel(order._id || order.id);
                          setShowCancelModal(true);
                        }}
                        style={{ fontSize: '14px', background: '#e74c3c', color: 'white', border: 'none' }}
                        disabled={cancelingOrderId === (order._id || order.id)}
                      >
                        {cancelingOrderId === (order._id || order.id) ? 'Canceling...' : 'Cancel Order'}
                      </Button>
                    )}
                  </div>
                </OrderFooter>
              </OrderCard>
            ))}
          </div>
        )}
      </Content>
      {/* Modal for cancel confirmation */}
      {showCancelModal && (
        <ModalOverlay>
          <ModalBox>
            <ModalTitle>Cancel Order?</ModalTitle>
            <p style={{ color: '#444', marginBottom: 0 }}>Are you sure you want to cancel this order?</p>
            <ModalActions>
              <Button
                className="cancel"
                style={{ background: '#e74c3c', color: 'white', border: 'none', minWidth: 90 }}
                onClick={() => handleCancelOrder(orderToCancel)}
                disabled={cancelingOrderId === orderToCancel}
              >
                {cancelingOrderId === orderToCancel ? 'Canceling...' : 'Yes, Cancel'}
              </Button>
              <Button
                className="outline"
                style={{ minWidth: 90 }}
                onClick={() => { setShowCancelModal(false); setOrderToCancel(null); }}
                disabled={cancelingOrderId === orderToCancel}
              >
                No, Go Back
              </Button>
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
              <Button
                className="primary"
                onClick={async () => {
                  if (reviewComment.trim() && selectedProductId) {
                    const order = orders.find(o => (o._id || o.id) === reviewingOrder);
                    const product = order && order.items.find(item => {
                      const pid = item.product?._id || item.product || item._id;
                      return pid === selectedProductId;
                    });
                    // Get user info from localStorage
                    let user = getUser() || {};
                    const userName = user.name || (order && order.customer && order.customer.name) || 'Anonymous';
                    const userImage = user.profileImage || '';
                    saveProductReview(selectedProductId, reviewComment, userName, userImage);
                    setReviewingOrder(null);
                    setReviewComment('');
                    setSelectedProductId('');
                    setNotificationMessage('Review submitted!');
                    setTimeout(() => setNotificationMessage(''), 3000);
                  }
                }}
                style={{ fontSize: '14px' }}
              >
                Submit
              </Button>
              <Button
                className="outline"
                onClick={() => {
                  setReviewingOrder(null);
                  setReviewComment('');
                  setSelectedProductId('');
                }}
                style={{ fontSize: '14px' }}
              >
                Cancel
              </Button>
            </ModalActions>
          </ModalBox>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default ViewMyOrder; 