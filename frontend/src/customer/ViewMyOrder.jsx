import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  ArrowBack, 
  CheckCircle, 
  Pending, 
  LocalShipping, 
  Restaurant,
  Refresh
} from '@mui/icons-material';

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

const mockOrders = [
  { 
    id: 'ORD123456', 
    date: '2024-06-01', 
    total: 456.00, 
    status: 'delivered',
    items: [
      { name: 'Burger Meal', quantity: 2, price: 99.00 },
      { name: 'Fries', quantity: 1, price: 59.00 },
      { name: 'Soda', quantity: 1, price: 35.00 }
    ],
    deliveryFee: 49.00,
    paymentMethod: 'Cash on Delivery',
    estimatedDelivery: '2024-06-01 19:30',
    orderStatus: 'Delivered',
    orderStatusIcon: 'delivered',
    orderDate: 'June 1, 2024 6:30 PM',
    orderNumber: 'ORD123456'
  },
  { 
    id: 'ORD123455', 
    date: '2024-05-31', 
    total: 320.00, 
    status: 'shipped',
    items: [
      { name: 'Pizza', quantity: 1, price: 249.00 },
      { name: 'Garlic Bread', quantity: 1, price: 71.00 }
    ],
    deliveryFee: 49.00,
    paymentMethod: 'Credit Card',
    estimatedDelivery: '2024-06-01 20:15',
    orderStatus: 'Shipped',
    orderStatusIcon: 'on-the-way',
    orderDate: 'May 31, 2024 7:15 PM',
    orderNumber: 'ORD123455'
  },
  { 
    id: 'ORD123454', 
    date: '2024-05-30', 
    total: 150.00, 
    status: 'placed',
    items: [
      { name: 'Pasta Carbonara', quantity: 1, price: 150.00 }
    ],
    deliveryFee: 0.00,
    paymentMethod: 'GCash',
    estimatedDelivery: '2024-05-31 18:45',
    orderStatus: 'Placed',
    orderStatusIcon: 'preparing',
    orderDate: 'May 30, 2024 5:45 PM',
    orderNumber: 'ORD123454'
  },
  { 
    id: 'ORD123453', 
    date: '2024-05-29', 
    total: 275.00, 
    status: 'pending',
    items: [
      { name: 'Chicken Sandwich', quantity: 2, price: 125.00 },
      { name: 'Soda', quantity: 1, price: 25.00 }
    ],
    deliveryFee: 0.00,
    paymentMethod: 'Cash on Delivery',
    estimatedDelivery: '2024-05-30 19:30',
    orderStatus: 'Pending',
    orderStatusIcon: 'pending',
    orderDate: 'May 29, 2024 6:30 PM',
    orderNumber: 'ORD123453'
  },
  { 
    id: 'ORD123452', 
    date: '2024-05-28', 
    total: 180.00, 
    status: 'canceled',
    items: [
      { name: 'Caesar Salad', quantity: 1, price: 180.00 }
    ],
    deliveryFee: 0.00,
    paymentMethod: 'Credit Card',
    estimatedDelivery: '2024-05-29 13:30',
    orderStatus: 'Canceled',
    orderStatusIcon: 'canceled',
    orderDate: 'May 28, 2024 12:30 PM',
    orderNumber: 'ORD123452',
    cancelReason: 'Out of stock'
  },
];

const ViewMyOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Simulate API call
    setTimeout(() => {
      setOrders(mockOrders);
      setLoading(false);
    }, 1000);
  }, []);

  const handleGoBack = () => {
    navigate('/customer/home');
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusIcon = (status) => {
    switch (status) {
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
              <OrderCard key={order.id} status={order.status}>
                <OrderHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>{order.orderDate}</span>
                    <StatusBadge status={order.status}>
                      {getStatusIcon(order.orderStatusIcon)}
                      {order.orderStatus}
                    </StatusBadge>
                  </div>
                  <h3 style={{ margin: '8px 0', fontSize: '16px', fontWeight: 600 }}>
                    Order #{order.orderNumber}
                  </h3>
                </OrderHeader>
                
                <OrderBody>
                  {order.items.slice(0, expandedOrder === order.id ? order.items.length : 2).map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px' }}>{item.quantity}x {item.name}</span>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  
                  {order.items.length > 2 && expandedOrder !== order.id && (
                    <p style={{ fontSize: '13px', color: '#666', margin: '8px 0 0 0' }}>
                      +{order.items.length - 2} more items
                    </p>
                  )}
                  
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px' }}>Subtotal</span>
                      <span style={{ fontSize: '14px' }}>{formatCurrency(order.total - (order.deliveryFee || 0))}</span>
                    </div>
                    {order.deliveryFee > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px' }}>Delivery Fee</span>
                        <span style={{ fontSize: '14px' }}>{formatCurrency(order.deliveryFee)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
                      <span style={{ fontWeight: 600 }}>Total</span>
                      <span style={{ fontWeight: 600, color: '#ff8c00' }}>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                  
                  {expandedOrder === order.id && (
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
                            {order.orderStatus}
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
                            {new Date(order.estimatedDelivery).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </OrderBody>
                
                <OrderFooter>
                  <Button 
                    className="outline"
                    onClick={() => toggleOrderDetails(order.id)}
                    style={{ fontSize: '14px' }}
                  >
                    {expandedOrder === order.id ? 'Hide Details' : 'View Details'}
                  </Button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                      className="outline"
                      onClick={() => console.log('Reordering order:', order.id)}
                      style={{ fontSize: '14px' }}
                    >
                      Reorder
                    </Button>
                    <Button 
                      className="primary"
                      onClick={() => console.log('Tracking order:', order.id)}
                      style={{ fontSize: '14px' }}
                    >
                      Track Order
                    </Button>
                  </div>
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