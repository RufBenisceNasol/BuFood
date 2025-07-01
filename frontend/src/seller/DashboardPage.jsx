import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { store, order } from '../api';
import '../styles/DashboardPage.css';
import { 
  MdMenuOpen, 
  MdNotificationAdd, 
  MdStore, 
  MdAddCircle,
  MdListAlt, 
  MdSettings, 
  MdLogout
} from "react-icons/md";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const DashboardCard = ({ title, value, icon: Icon, to, onClick }) => (
  <Link to={to} className="grid-item" onClick={onClick}>
    {Icon && <Icon className="icon" aria-hidden="true" />}
    {value && <div className="count" role="status">{value}</div>}
    <div className="label">{title}</div>
  </Link>
);

const SummaryCard = ({ title, value, prefix = '' }) => (
  <article className="summary-card">
    <h2>{title}</h2>
    <div className="count" role="status">
      {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
    </div>
  </article>
);

const DashboardPage = () => {
  const [storeData, setStoreData] = useState(null);
  const [orderStats, setOrderStats] = useState({ pending: 0, completed: 0, earnings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [ordersForChart, setOrdersForChart] = useState([]);

  useEffect(() => {
    fetchStoreData();
    fetchOrderStats();
  }, []);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const data = await store.getMyStore();
      setStoreData(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch store data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStats = async () => {
    try {
      // Fetch all seller orders (use backend max limit 100)
      const ordersRes = await order.getSellerOrders({ page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });
      const orders = ordersRes.data?.orders || ordersRes.orders || [];
      let pending = 0, completed = 0, earnings = 0;
      for (const o of orders) {
        if (!['Delivered', 'Canceled', 'Rejected'].includes(o.status)) pending++;
        if (o.status === 'Delivered') {
          completed++;
          if (o.paymentStatus === 'Paid') earnings += o.totalAmount;
        }
      }
      setOrderStats({ pending, completed, earnings, orders });
      setOrdersForChart(orders);
    } catch (err) {
      // Optionally handle error
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Compute analytics
  const analytics = useMemo(() => {
    if (!storeData || !Array.isArray(storeData.products)) return null;
    const orders = orderStats.orders || [];
    // Use orders from fetchOrderStats if available, else fallback to []
    const allOrders = orders.length ? orders : [];
    // Total Orders
    const totalOrders = allOrders.length;
    // Average Order Value (for completed & paid orders)
    const paidOrders = allOrders.filter(o => o.status === 'Delivered' && o.paymentStatus === 'Paid');
    const avgOrderValue = paidOrders.length ? (paidOrders.reduce((sum, o) => sum + o.totalAmount, 0) / paidOrders.length) : 0;
    // Best-Selling Product
    const productSales = {};
    for (const o of allOrders) {
      if (o.items && Array.isArray(o.items)) {
        for (const item of o.items) {
          const pid = item.product?._id || item.product;
          if (!pid) continue;
          if (!productSales[pid]) productSales[pid] = { count: 0, name: item.product?.name || 'Unknown' };
          productSales[pid].count += item.quantity || 1;
        }
      }
    }
    let bestProduct = { name: 'N/A', count: 0 };
    for (const pid in productSales) {
      if (productSales[pid].count > bestProduct.count) {
        bestProduct = productSales[pid];
      }
    }
    // Total Products
    const totalProducts = storeData.products.length;
    // Sales in last 7 days
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sales7d = allOrders.filter(o => o.status === 'Delivered' && o.paymentStatus === 'Paid' && new Date(o.createdAt) >= weekAgo)
      .reduce((sum, o) => sum + o.totalAmount, 0);
    return {
      totalOrders,
      avgOrderValue,
      bestProduct,
      totalProducts,
      sales7d
    };
  }, [storeData, orderStats]);

  // Chart Data Preparation
  const salesLast7Days = useMemo(() => {
    if (!ordersForChart.length) return [];
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      return d.toISOString().slice(0, 10);
    });
    const salesMap = {};
    days.forEach(day => { salesMap[day] = 0; });
    ordersForChart.forEach(o => {
      if (o.status === 'Delivered' && o.paymentStatus === 'Paid') {
        const day = new Date(o.createdAt).toISOString().slice(0, 10);
        if (salesMap[day] !== undefined) salesMap[day] += o.totalAmount;
      }
    });
    return days.map(day => ({ date: day.slice(5), sales: salesMap[day] }));
  }, [ordersForChart]);

  const orderStatusData = useMemo(() => {
    if (!ordersForChart.length) return [];
    const statusCount = { Pending: 0, Accepted: 0, Preparing: 0, Ready: 0, Delivered: 0, Canceled: 0, Rejected: 0 };
    ordersForChart.forEach(o => {
      if (statusCount[o.status] !== undefined) statusCount[o.status]++;
    });
    return Object.entries(statusCount).map(([status, value]) => ({ name: status, value }));
  }, [ordersForChart]);

  const pieColors = ['#ff9800', '#4caf50', '#2196f3', '#ffb300', '#43a047', '#e53935', '#757575'];

  if (loading) {
    return (
      <div className="main-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading store information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-container">
        <div className="error">
          <h1>Error loading dashboard</h1>
          <p>{error}</p>
          <button 
            className="retry-button" 
            onClick={fetchStoreData}
            aria-label="Retry loading dashboard"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const dashboardItems = [
    {
      title: 'Manage Orders',
      value: orderStats.pending,
      icon: MdNotificationAdd,
      to: '/seller/manage-orders'
    },
    {
      title: 'Store Settings',
      icon: MdStore,
      to: '/seller/store-settings'
    },
    {
      title: 'Add Product',
      icon: MdAddCircle,
      to: '/seller/add-product'
    },
    {
      title: 'Product List',
      value: storeData?.products?.length || 0,
      icon: MdListAlt,
      to: '/seller/product-list'
    }
  ];

  return (
    <div className="main-container">
      <div className="content-container">
        <div className="banner-wrapper">
          <img 
            src={storeData?.bannerImage || 'https://placehold.co/800x300/orange/white?text=Store+Banner'} 
            alt="Store Banner" 
            className="banner-img"
          />
          <button 
            className="menu-toggle" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-label="Toggle menu"
          >
            <MdMenuOpen className="menu-icon" />
          </button>
          
          {isMenuOpen && (
            <div className="popup-menu">
              <Link to="/seller/store-settings" className="menu-item">
                <MdSettings />
                <span>Settings</span>
              </Link>
              <button onClick={handleLogout} className="menu-item">
                <MdLogout />
                <span>Logout</span>
              </button>
            </div>
          )}

          <div className="profile-avatar-wrapper">
            {storeData?.image ? (
              <img 
                src={storeData.image} 
                alt={`${storeData.storeName || 'Store'} logo`} 
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar profile-avatar-default">
                {(storeData?.storeName || 'S').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="black-bar">
            <div className="store-name">{storeData?.storeName || 'My Store'}</div>
            <div className="seller-name">{storeData?.description || 'No description available'}</div>
          </div>
        </div>

        <div className="form-container">
          <div className="dashboard-content">
            {/* Summary Cards - quick stats */}
            <section className="summary-cards">
              <SummaryCard 
                title="Completed Orders"
                value={orderStats.completed}
              />
              <SummaryCard 
                title="Total Earnings"
                value={orderStats.earnings}
                prefix="₱ "
              />
            </section>

            <section>
              <h2 className="dashboard-title">DASHBOARD</h2>
              <div className="dashboard-grid">
                {dashboardItems.map((item, index) => (
                  <DashboardCard 
                    key={index}
                    {...item}
                  />
                ))}
              </div>
            </section>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0 0 0' }}>
              <Link to="/seller/analytics" className="analytics-link-btn">
                View Analytics
              </Link>
            </div>
          </div>
        </div>

        <Link to="/seller/profile" className="profile-button">
          PROFILE
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;