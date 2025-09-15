import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { store, order, auth } from '../api';
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
import { FiRefreshCw } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { SkeletonCard } from '../components/Skeletons';

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
  const [cacheBuster, setCacheBuster] = useState('');

  const appendCacheBuster = (url) => {
    if (!url) return url;
    if (!cacheBuster) return url;
    return url.includes('?') ? `${url}&_=${cacheBuster}` : `${url}?_=${cacheBuster}`;
  };

  useEffect(() => {
    // Cache-first: hydrate from cache to avoid blank UI after idle
    let hadCache = false;
    try {
      const raw = localStorage.getItem('bufood:seller:store');
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached && typeof cached === 'object') {
          setStoreData(cached);
          setLoading(false);
          hadCache = true;
        }
      }
    } catch (_) {}

    // Fetch store data; show loader only if no cache
    fetchStoreData({ showLoader: !hadCache });

    // Defer orders fetching until after first paint/idle
    const defer = (fn) => {
      if ('requestIdleCallback' in window) {
        // @ts-ignore
        return window.requestIdleCallback(fn, { timeout: 800 });
      }
      return setTimeout(fn, 0);
    };

    const idleId = defer(async () => {
      try {
        // Light fetch to render quick stats
        await fetchOrderStatsLight(20);
        // Then load the rest in the background
        setTimeout(() => {
          fetchOrderStatsFull();
        }, 300);
      } catch (_) {
        // ignore; light fetch failures will be retried by user refresh or next mount
      }
    });

    return () => {
      if (typeof idleId === 'number') clearTimeout(idleId);
      // requestIdleCallback cancel not standardized across browsers; safe to ignore
    };
  }, []);

  // Smooth auto-refresh: react to tab focus/visibility changes and cross-tab events
  useEffect(() => {
    let visibilityTimer = null;
    const smoothRefresh = async (fromUpdateEvent = false) => {
      // Soft refresh: do not show full-screen loader; instead, just update quietly
      try {
        if (fromUpdateEvent) {
          setCacheBuster(String(Date.now()));
        }
        const [data, stats] = await Promise.all([
          store.getMyStore(),
          (async () => {
            const ordersRes = await order.getSellerOrders({ page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });
            return ordersRes;
          })()
        ]);
        setStoreData(data);
        const orders = stats.data?.orders || stats.orders || [];
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
      } catch (_) {}
    };

    const onFocus = () => smoothRefresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Debounce to avoid double-calls on some browsers
        if (visibilityTimer) clearTimeout(visibilityTimer);
        visibilityTimer = setTimeout(smoothRefresh, 120);
      }
    };
    const onStoreUpdated = () => {
      // Small delay to let backend finish uploading and CDN propagate
      setTimeout(() => smoothRefresh(true), 200);
      // Extra retries for image/CDN propagation
      setTimeout(() => smoothRefresh(true), 1000);
      setTimeout(() => smoothRefresh(true), 2500);
    };
    const onStorage = (e) => {
      if (e.key === 'bufood:store-updated') {
        setTimeout(() => smoothRefresh(true), 200);
        setTimeout(() => smoothRefresh(true), 1000);
        setTimeout(() => smoothRefresh(true), 2500);
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('store-updated', onStoreUpdated);
    window.addEventListener('storage', onStorage);
    return () => {
      if (visibilityTimer) clearTimeout(visibilityTimer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('store-updated', onStoreUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // On initial mount, if there was a recent update flagged, force a soft refresh and cache-bust media
  useEffect(() => {
    try {
      const raw = localStorage.getItem('bufood:store-updated');
      if (raw) {
        setCacheBuster(String(Date.now()));
      }
    } catch (_) {}
  }, []);

  const fetchStoreData = async ({ showLoader = true } = {}) => {
    try {
      if (showLoader) setLoading(true);
      const data = await store.getMyStore();
      setStoreData(data);
      // persist cache
      try { localStorage.setItem('bufood:seller:store', JSON.stringify(data)); } catch (_) {}
      setError(null);
    } catch (err) {
      const status = err?.response?.status || err?.status;
      if (status === 401) {
        // Session expired; redirect to login
        try { await auth.logout(); } catch (_) {}
        navigate('/login', { replace: true, state: { message: 'Your session expired. Please sign in again.' } });
        return;
      }
      // Only show fatal error if we did not have cached data to display
      if (!storeData) {
        setError(err?.message || 'Failed to fetch store data');
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Helper to compute and set stats from orders
  const applyOrderStats = (orders) => {
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
  };

  // Light, quick fetch for initial paint
  const fetchOrderStatsLight = async (limit = 20) => {
    try {
      const ordersRes = await order.getSellerOrders({ page: 1, limit, sortBy: 'createdAt', sortOrder: 'desc' });
      const orders = ordersRes.data?.orders || ordersRes.orders || [];
      applyOrderStats(orders);
    } catch (_) {
      // silent; not critical for first paint
    }
  };

  // Full background fetch to hydrate analytics
  const fetchOrderStatsFull = async () => {
    try {
      const ordersRes = await order.getSellerOrders({ page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });
      const orders = ordersRes.data?.orders || ordersRes.orders || [];
      applyOrderStats(orders);
    } catch (_) {
      // silent; user can manually refresh if needed
    }
  };

  const handleLogout = async () => {
    // Close menu immediately for responsive UX
    setIsMenuOpen(false);
    try {
      await auth.logout();
    } finally {
      // Always navigate to login even if logout API fails or times out
      navigate('/login', { replace: true, state: { message: 'You have been signed out.' } });
    }
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
        <div className="content-container">
          <div className="banner-wrapper" style={{ position: 'relative' }}>
            <SkeletonCard height={300} />
          </div>
          <h2 className="dashboard-title">DASHBOARD</h2>
          <div className="form-container">
            <div className="dashboard-content">
              <section className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                <SkeletonCard height={120} />
                <SkeletonCard height={120} />
              </section>
              <section>
                <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginTop: 16 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={`dash-skel-${i}`} height={140} />
                  ))}
                </div>
              </section>
            </div>
          </div>
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
          <button
            className="refresh-btn"
            aria-label="Refresh"
            onClick={() => {
              setLoading(true);
              fetchStoreData();
              // Run staged orders refresh similar to mount
              fetchOrderStatsLight(20).finally(() => {
                setTimeout(() => {
                  fetchOrderStatsFull();
                }, 300);
              });
            }}
            disabled={loading}
            tabIndex={0}
            style={{
              position: 'absolute',
              left: 16,
              top: 16,
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
              size={26}
              color={loading ? '#ff9800' : '#fff'}
              className={loading ? 'spin' : ''}
              aria-hidden="true"
            />
          </button>
          <img 
            key={cacheBuster ? `banner-${cacheBuster}` : 'banner'}
            src={appendCacheBuster(storeData?.bannerImage || 'https://placehold.co/800x300/orange/white?text=Store+Banner')} 
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
                key={cacheBuster ? `avatar-${cacheBuster}` : 'avatar'}
                src={appendCacheBuster(storeData.image)} 
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

        <h2 className="dashboard-title">DASHBOARD</h2>
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