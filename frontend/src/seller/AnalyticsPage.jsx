import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { order, store } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import '../styles/DashboardPage.css';

const AnalyticsPage = () => {
  const [orders, setOrders] = useState([]);
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersRes, storeRes] = await Promise.all([
          order.getSellerOrders({ page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }),
          store.getMyStore()
        ]);
        // Handle different possible response shapes
        const ordersData =
          (ordersRes && ordersRes.data && ordersRes.data.orders)
          || (ordersRes && ordersRes.data && ordersRes.data.data && ordersRes.data.data.orders)
          || ordersRes?.orders
          || [];
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        // store.getMyStore returns the store object directly in our API
        setStoreData(storeRes?.data || storeRes || null);
        setError(null);
      } catch (err) {
        // Prefer backend-provided message when available
        const friendlyMsg = err?.response?.data?.message || err?.message || 'Failed to fetch analytics data';
        setError(friendlyMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const analytics = useMemo(() => {
    if (!storeData || !Array.isArray(storeData.products)) return null;
    const allOrders = orders;
    const totalOrders = allOrders.length;
    const paidOrders = allOrders.filter(o => o.status === 'Delivered' && o.paymentStatus === 'Paid');
    const avgOrderValue = paidOrders.length ? (paidOrders.reduce((sum, o) => sum + o.totalAmount, 0) / paidOrders.length) : 0;
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
    const totalProducts = storeData.products.length;
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
  }, [storeData, orders]);

  const salesLast7Days = useMemo(() => {
    if (!orders.length) return [];
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      return d.toISOString().slice(0, 10);
    });
    const salesMap = {};
    days.forEach(day => { salesMap[day] = 0; });
    orders.forEach(o => {
      if (o.status === 'Delivered' && o.paymentStatus === 'Paid') {
        const day = new Date(o.createdAt).toISOString().slice(0, 10);
        if (salesMap[day] !== undefined) salesMap[day] += o.totalAmount;
      }
    });
    return days.map(day => ({ date: day.slice(5), sales: salesMap[day] }));
  }, [orders]);

  const orderStatusData = useMemo(() => {
    if (!orders.length) return [];
    const statusCount = { Pending: 0, Accepted: 0, Preparing: 0, Ready: 0, Delivered: 0, Canceled: 0, Rejected: 0 };
    orders.forEach(o => {
      if (statusCount[o.status] !== undefined) statusCount[o.status]++;
    });
    return Object.entries(statusCount).map(([status, value]) => ({ name: status, value }));
  }, [orders]);

  const pieColors = ['#ff9800', '#4caf50', '#2196f3', '#ffb300', '#43a047', '#e53935', '#757575'];

  // Custom label for Pie slices
  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent === 0) return null;
    const RADIAN = Math.PI / 180;
    // Position label at the middle of the arc
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        fontSize={12}
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="main-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-container">
        <div className="error">
          <h1>Error loading analytics</h1>
          <p>{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()} aria-label="Retry loading analytics">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <div className="content-container">
        <button onClick={() => navigate('/seller/dashboard')} className="analytics-link-btn" style={{ marginBottom: 24, marginTop: 12, padding: '10px 28px', fontSize: '1rem' }}>
          ← Back to Dashboard
        </button>
        <div className="form-container">
          <div className="dashboard-content">
            <section className="analytics-section">
              <h2>Analytics</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ width: 320, height: 220, background: 'white', borderRadius: 16, padding: '1px 1px' }}>
                  <h3 style={{ textAlign: 'center', fontSize: 14, margin: 0, color: ' #ff9800' }}>Sales (Last 7 Days)</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={salesLast7Days}>
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip formatter={v => `₱ ${v.toLocaleString()}`} />
                      <Bar dataKey="sales" fill=" #ff9800" radius={[8,8,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ width: 320, height: 260, background: 'white', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <h3 style={{ textAlign: 'center', fontSize: 14, margin: 0, color: ' #ff9800', marginBottom: 8 }}>Order Status</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={38}
                        label={renderPieLabel}
                        labelLine={false}
                        paddingAngle={2}
                      >
                        {orderStatusData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                        ))}
                      </Pie>
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: 10, marginTop: 8 }}
                      />
                      <Tooltip formatter={(v, n) => [`${v} orders`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {analytics ? (
                <ul className="analytics-list">
                  <li><strong className="analytics-label">Total Orders:</strong> {analytics.totalOrders}</li>
                  {/* Temporarily hidden - Average Order Value
                  <li><strong className="analytics-label">Average Order Value:</strong> ₱ {analytics.avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</li>
                  */}
                  <li><strong className="analytics-label">Best-Selling Product:</strong> {analytics.bestProduct.name} ({analytics.bestProduct.count} sold)</li>
                  <li><strong className="analytics-label">Total Products:</strong> {analytics.totalProducts}</li>
                  <li><strong className="analytics-label">Sales (Last 7 Days):</strong> ₱ {analytics.sales7d.toLocaleString(undefined, { maximumFractionDigits: 2 })}</li>
                </ul>
              ) : (
                <p>Loading analytics...</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage; 