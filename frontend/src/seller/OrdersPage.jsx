import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdArrowBack } from 'react-icons/md';

const OrdersPage = () => {
  const navigate = useNavigate();
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
      toast.error('Failed to fetch orders. Please try again later.');
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
        const token = localStorage.getItem('token');
        await axios.patch(
          `/api/orders/seller/manage/${orderId}`,
          { action: 'cancel' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
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

  const filteredOrders = orders.filter(order => 
    statusFilter === 'all' ? true : order.status === statusFilter
  );

  const statusBadgeColor = (status) => {
    switch(status) {
      case 'Pending': return '#f39c12';
      case 'Placed': return '#3498db';
      case 'Shipped': return '#2ecc71';
      case 'Delivered': return '#27ae60';
      case 'Canceled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <div style={styles.mainContainer}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div style={styles.header}>
        <div style={styles.backButton} onClick={() => navigate('/seller/dashboard')}>
          <span style={styles.backArrow}>←</span>
          <span style={styles.headerText}>Manage Orders</span>
        </div>
      </div>

      <div style={styles.contentContainer}>
        <div style={styles.filterContainer}>
          <div style={styles.filterLabel}>Filter by Status:</div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.filterSelect}
            className="order-filter-select"
          >
            <option value="all">All Orders</option>
            <option value="Pending">Pending</option>
            <option value="Placed">Placed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Canceled">Canceled</option>
          </select>
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p style={styles.loadingText}>Loading orders...</p>
          </div>
        ) : error ? (
          <div style={styles.error}>{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div style={styles.noOrders}>
            <p>No orders found.</p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table} className="orders-table">
              <thead>
                <tr>
                  <th style={styles.th}>Order ID</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Payment</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id} style={styles.tr}>
                    <td style={styles.td} data-label="Order ID">
                      <div style={styles.cellContent}>
                        <span style={styles.orderId}>{order._id.slice(-8)}</span>
                      </div>
                    </td>
                    <td style={styles.td} data-label="Customer">
                      <div style={styles.cellContent}>
                        {order.customerName}
                      </div>
                    </td>
                    <td style={styles.td} data-label="Amount">
                      <div style={styles.cellContent}>
                        <span style={styles.price}>₱{order.totalAmount.toFixed(2)}</span>
                      </div>
                    </td>
                    <td style={styles.td} data-label="Status">
                      <div style={styles.cellContent}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: statusBadgeColor(order.status)
                        }}>
                          {order.status}
                        </span>
                      </div>
                    </td>
                    <td style={styles.td} data-label="Payment">
                      <div style={styles.cellContent}>
                        <span style={{
                          ...styles.paymentStatus,
                          color: order.paymentStatus === 'Paid' ? '#27ae60' : '#e74c3c'
                        }}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td style={styles.td} data-label="Actions">
                      <div style={styles.cellContent}>
                        {order.status !== 'Canceled' && order.status !== 'Delivered' && (
                          <div style={styles.actionButtons}>
                            {order.status === 'Placed' && (
                              <button
                                onClick={() => handleStatusUpdate(order._id, 'Shipped')}
                                style={styles.actionButton}
                                className="ship-button"
                              >
                                Ship
                              </button>
                            )}
                            {order.status === 'Shipped' && (
                              <button
                                onClick={() => handleStatusUpdate(order._id, 'Delivered')}
                                style={styles.deliverButton}
                                className="deliver-button"
                              >
                                Deliver
                              </button>
                            )}
                            {['Pending', 'Placed'].includes(order.status) && (
                              <button
                                onClick={() => handleCancelOrder(order._id)}
                                style={styles.cancelButton}
                                className="cancel-button"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ResponsiveStyle />
    </div>
  );
};

const styles = {
  mainContainer: {
    backgroundColor: '#f7f7f7',
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  header: {
    padding: '7px 15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ff8c00e0',
    color: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.4)',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  backArrow: {
    fontSize: '20px',
    marginRight: '10px',
    color: 'white',
  },
  headerText: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
  },
  contentContainer: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    overflowY: 'auto',
    height: 'calc(100vh - 53px)',
  },
  filterContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '20px',
    backgroundColor: 'white',
    padding: '15px 20px',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
  },
  filterLabel: {
    fontWeight: '500',
    fontSize: '15px',
    color: '#555',
  },
  filterSelect: {
    padding: '10px 15px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    minWidth: '180px',
    fontSize: '14px',
    backgroundColor: '#f9f9f9',
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23555%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '10px',
  },
  tableWrapper: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '15px 20px',
    fontWeight: '600',
    fontSize: '14px',
    color: '#333',
    backgroundColor: '#f9f9f9',
    borderBottom: '1px solid #eee',
  },
  tr: {
    borderBottom: '1px solid #eee',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '15px 20px',
    fontSize: '14px',
    color: '#444',
  },
  cellContent: {
    display: 'flex',
    alignItems: 'center',
  },
  orderId: {
    fontFamily: 'monospace',
    fontWeight: '600',
    letterSpacing: '0.5px',
  },
  price: {
    fontWeight: '600',
    color: '#ff8c00',
  },
  statusBadge: {
    padding: '5px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    minWidth: '80px',
    display: 'inline-block',
  },
  paymentStatus: {
    fontWeight: '600',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  actionButton: {
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  deliverButton: {
    padding: '6px 12px',
    backgroundColor: '#2ecc71',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  cancelButton: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #ff8c00',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '15px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
  },
  error: {
    backgroundColor: '#fde8e8',
    color: '#e53e3e',
    padding: '15px 20px',
    marginBottom: '20px',
    textAlign: 'center',
    borderRadius: '10px',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(229, 62, 62, 0.1)',
  },
  noOrders: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
  },
};

// Responsive media queries using a style tag
const ResponsiveStyle = () => (
  <style>{`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    .orders-table {
      width: 100%;
    }
    
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    
    .order-filter-select:focus {
      border-color: #ff8c00;
      outline: none;
      box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.15);
    }
    
    /* Scrollbar styling */
    div[style*="contentContainer"]::-webkit-scrollbar {
      width: 6px;
    }
    
    div[style*="contentContainer"]::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 10px;
    }
    
    div[style*="contentContainer"]::-webkit-scrollbar-thumb {
      background: rgba(255, 140, 0, 0.3);
      border-radius: 10px;
    }
    
    div[style*="contentContainer"]::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 140, 0, 0.5);
    }
    
    @media (max-width: 992px) {
      .orders-table th, .orders-table td {
        padding: 12px 15px;
      }
    }
    
    @media (max-width: 768px) {
      .orders-table thead {
        display: none;
      }
      
      .orders-table, .orders-table tbody, .orders-table tr, .orders-table td {
        display: block;
        width: 100%;
      }
      
      .orders-table tr {
        margin-bottom: 20px;
        border: 1px solid #eee;
        border-radius: 8px;
        overflow: hidden;
      }
      
      .orders-table td {
        text-align: right;
        position: relative;
        padding: 10px 15px;
      }
      
      .orders-table td:before {
        content: attr(data-label);
        position: absolute;
        left: 15px;
        top: 50%;
        transform: translateY(-50%);
        font-weight: 600;
        color: #555;
      }
      
      .orders-table td div[style*="cellContent"] {
        justify-content: flex-end;
      }
      
      div[style*="filterContainer"] {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
      
      select[style*="filterSelect"] {
        width: 100%;
      }
    }
  `}</style>
);

export default OrdersPage;