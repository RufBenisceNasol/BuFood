import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { store } from '../api';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStoreData();
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleBack = () => {
    navigate(-1);
  };

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
      value: storeData?.pendingOrders || 0,
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
            <section className="summary-cards">
              <SummaryCard 
                title="Completed Orders"
                value={storeData?.completedOrders || 0}
              />
              <SummaryCard 
                title="Total Earnings"
                value={storeData?.totalEarnings || 0}
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