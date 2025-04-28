import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { store } from '../api';
import '../styles/DashboardPage.css';
import { MdMenuOpen, MdNotificationAdd, MdStore, MdAddCircle, MdListAlt, MdSettings, MdLogout, MdPerson } from "react-icons/md";

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
    // Clear any stored tokens or user data
    localStorage.removeItem('token');
    // Redirect to login page
    navigate('/login');
  };

  if (loading) {
    return <div className="dashboard-container">Loading...</div>;
  }

  if (error) {
    return <div className="dashboard-container">Error: {error}</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div 
        className="store-header"
        style={{
          backgroundImage: storeData?.bannerImage ? `url(${storeData.bannerImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        <div className="header-overlay"></div>
        <h1>{storeData?.storeName || 'My Store'}</h1>
        <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span className="hamburger-icon"><MdMenuOpen /></span>
        </button>
        {isMenuOpen && (
          <div className="popup-menu">
            <Link to="/profile" className="menu-item">
              <MdPerson className="menu-icon" />
              My Profile
            </Link>
            <Link to="/seller/store-settings" className="menu-item">
              <MdSettings className="menu-icon" />
              Settings
            </Link>
            <button onClick={handleLogout} className="menu-item">
              <MdLogout className="menu-icon" />
              Logout
            </button>
          </div>
        )}
      </div>

      <div className="scrollable-section">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Completed Orders</h3>
          <div className="count">
            {storeData?.completedOrders || 0}
          </div>
        </div>
        <div className="summary-card">
          <h3>Total Earnings</h3>
          <div className="count">
            ₱ {storeData?.totalEarnings || 0}
          </div>
        </div>
      </div>

      {/* Dashboard Title */}
      <h2 className="dashboard-title">DASHBOARD</h2>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        <Link to="/seller/manage-orders" className="grid-item">
          <div className="icon"><MdNotificationAdd /></div>
          <div className="count">{storeData?.pendingOrders || 0}</div>
          <div className="label">Manage Orders</div>
        </Link>

        <Link to="/seller/store-settings" className="grid-item">
          <div className="icon"><MdStore /></div>
          <div className="space">0</div>
          <div className="label">Store Settings</div>
        </Link>

        <Link to="/seller/add-product" className="grid-item">
          <div className="icon"><MdAddCircle /></div>
          <div className="space">0</div>
          <div className="label">Add Product</div>
        </Link>

        <Link to="/seller/product-list" className="grid-item">
          <div className="icon"><MdListAlt /></div>
          <div className="count">{storeData?.products?.length || 0}</div>
          <div className="label">Product List</div>
        </Link>
      </div>
      
      {/* Profile Button */}
      <Link to="/seller/profile">
        <button className="profile-button">PROFILE</button>
      </Link>
    </div>
    </div>
  );
};

export default DashboardPage;