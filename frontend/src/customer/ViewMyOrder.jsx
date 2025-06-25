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

const ViewMyOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderHistories, setOrderHistories] = useState({}); // { orderId: [history] }
  const [historyLoading, setHistoryLoading] = useState({}); // { orderId: bool }
  const [reviewingOrder, setReviewingOrder] = useState(null); // orderId being reviewed
  const [reviewComment, setReviewComment] = useState('');
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
    // Fetch order history if not already loaded
    if (!orderHistories[orderId] && !historyLoading[orderId]) {
      setHistoryLoading(prev => ({ ...prev, [orderId]: true }));
      api.get(`/orders/${orderId}/history`)
        .then(res => {
          setOrderHistories(prev => ({ ...prev, [orderId]: res.data.history || [] }));
          setHistoryLoading(prev => ({ ...prev, [orderId]: false }));
        })
        .catch(() => {
          setOrderHistories(prev => ({ ...prev, [orderId]: [] }));
          setHistoryLoading(prev => ({ ...prev, [orderId]: false }));
        });
    }
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
  function saveProductReview(productId, comment, userName) {
    const key = 'productReviews';
    const reviews = JSON.parse(localStorage.getItem(key) || '[]');
    reviews.push({ productId, comment, createdAt: new Date().toISOString(), userName });
    localStorage.setItem(key, JSON.stringify(reviews));
  }

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
                  {order.items && order.items.slice(0, expandedOrder === (order._id || order.id) ? order.items.length : 2).map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px' }}>{item.quantity}x {item.name || item.product?.name}</span>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>
                        {formatCurrency((item.price || item.product?.price || 0) * item.quantity)}
                      </span>
                    </div>
                  ))}
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
                        {historyLoading[order._id || order.id] ? (
                          <span style={{ color: '#888', fontSize: 13 }}>Loading history...</span>
                        ) : (orderHistories[order._id || order.id] && orderHistories[order._id || order.id].length > 0 ? (
                          <TimelineList>
                            {orderHistories[order._id || order.id].map((h, idx) => (
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
                        ))}
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
                      onClick={() => {
                        setReviewingOrder(order._id || order.id);
                        setReviewComment('');
                      }}
                      style={{ fontSize: '14px' }}
                    >
                      Add Review
                    </Button>
                  </div>
                  {/* Review form modal/inline */}
                  {reviewingOrder === (order._id || order.id) && (
                    <div style={{ marginTop: '16px', background: '#fffbe6', border: '1px solid #ffe082', borderRadius: '8px', padding: '16px' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>Add a Review</h4>
                      <textarea
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        rows={3}
                        style={{ width: '100%', borderRadius: '6px', border: '1px solid #ccc', padding: '8px', fontSize: '14px', resize: 'vertical' }}
                        placeholder="Write your review here..."
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <Button
                          className="primary"
                          onClick={() => {
                            if (reviewComment.trim()) {
                              // Save review to localStorage for the first product in the order
                              const productId = order.items && order.items[0] && (order.items[0].product?._id || order.items[0].product || order.items[0]._id);
                              const userName = (order.customer && order.customer.name) || 'You';
                              saveProductReview(productId, reviewComment, userName);
                              setReviewingOrder(null);
                              setReviewComment('');
                              alert('Review submitted!');
                            }
                          }}
                          style={{ fontSize: '14px' }}
                        >
                          Submit
                        </Button>
                        <Button
                          className="outline"
                          onClick={() => setReviewingOrder(null)}
                          style={{ fontSize: '14px' }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </OrderFooter>
              </OrderCard>
            ))}
          </div>
        )}
      </Content>
    </PageContainer>
  );
};

export default ViewMyOrder; 