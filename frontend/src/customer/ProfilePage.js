import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api';
import { MdArrowBack, MdEdit } from 'react-icons/md';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError('');
    try {
      // Get the raw response first
      const rawResponse = await auth.getMe();
      console.log('Raw API response:', rawResponse);
      
      // Extract the user data from the response
      let data;
      
      // Check all possible locations for user data
      if (rawResponse && typeof rawResponse === 'object') {
        // Try to find user data in common response structures
        if (rawResponse.user) {
          data = rawResponse.user;
        } else if (rawResponse.data && rawResponse.data.user) {
          data = rawResponse.data.user;
        } else if (rawResponse.data) {
          data = rawResponse.data;
        } else {
          data = rawResponse;
        }
      } else {
        data = { name: 'Unknown User', email: 'No email available' };
      }
      
      // Ensure required fields have values
      const processedData = {
        ...data,
        name: data.name || data.fullName || data.username || 'User',
        email: data.email || '',
        contactNumber: data.contactNumber || data.phone || data.phoneNumber || '',
        role: data.role || data.userRole || 'User'
      };
      
      setUserData(processedData);
      console.log('Final processed user data:', processedData);
    } catch (err) {
      setError(err.message || 'Failed to fetch user profile');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (userData?.role === 'Seller') {
      navigate('/seller/dashboard');
    } else {
      navigate('/customer/home');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  if (error && !userData) {
    return <div className="error-container">{error}</div>;
  }

  if (!userData) {
    return <div className="error-container">No user data found</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button className="back-button" onClick={handleGoBack}>
          <MdArrowBack className="back-icon" />
        </button>
        <h1 className="header-title">My Profile</h1>
      </div>

      <div className="profile-content">
        {/* Debug display, will be removed in production */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', fontSize: '10px', whiteSpace: 'pre-wrap' }}>
            <strong>Debug Data:</strong>
            <pre>{JSON.stringify(userData, null, 2)}</pre>
          </div>
        )}

        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {userData.profileImage ? (
                <img src={userData.profileImage} alt="Profile" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {userData.name && userData.name.trim() ? userData.name.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
            <h2 className="user-name">{userData.name || 'User'}</h2>
            <div className="role-badge">{userData.role}</div>
          </div>

          <div className="profile-details">
            <div className="detail-item">
              <div className="detail-label">Full Name</div>
              <div className="detail-value">{userData.name}</div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Email</div>
              <div className="detail-value">{userData.email || '—'}</div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Contact Number</div>
              <div className="detail-value">{userData.contactNumber || '—'}</div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Role</div>
              <div className="detail-value">{userData.role}</div>
            </div>

            {userData.store && (
              <div className="detail-item">
                <div className="detail-label">Store Name</div>
                <div className="detail-value">{userData.store.storeName || userData.storeName || 'Not available'}</div>
              </div>
            )}

            <div className="detail-item">
              <div className="detail-label">Member Since</div>
              <div className="detail-value">
                {userData.createdAt || userData.memberSince
                  ? new Date(userData.createdAt || userData.memberSince).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Not available'}
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button className="edit-profile-button">
              <MdEdit className="edit-icon" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 