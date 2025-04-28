import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api';
import { MdArrowBack, MdEdit, MdPerson, MdEmail, MdPhone, MdBusiness, MdDateRange } from 'react-icons/md';

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNumber: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        contactNumber: userData.contactNumber || userData.phone || ''
      });
    }
  }, [userData]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const rawResponse = await auth.getMe();
      console.log('Raw API response:', rawResponse);
      
      // Extract the user data from the response
      let data = rawResponse;
      
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // This would be implemented with an API call to update profile
    console.log('Update profile with:', formData);
    // After update is successful:
    setEditMode(false);
    // Refresh user data
    fetchUserProfile();
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

          {!editMode ? (
            <div className="profile-details">
              <div className="detail-item">
                <div className="detail-label">
                  <MdPerson className="detail-icon" />
                  Full Name
                </div>
                <div className="detail-value">{userData.name}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">
                  <MdEmail className="detail-icon" />
                  Email
                </div>
                <div className="detail-value">{userData.email || '—'}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">
                  <MdPhone className="detail-icon" />
                  Contact Number
                </div>
                <div className="detail-value">{userData.contactNumber || '—'}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">
                  <MdBusiness className="detail-icon" />
                  Role
                </div>
                <div className="detail-value">{userData.role}</div>
              </div>

              {userData.role === 'Seller' && userData.store && (
                <div className="detail-item">
                  <div className="detail-label">
                    <MdBusiness className="detail-icon" />
                    Store Name
                  </div>
                  <div className="detail-value">{userData.store.storeName || userData.storeName || '—'}</div>
                </div>
              )}

              <div className="detail-item">
                <div className="detail-label">
                  <MdDateRange className="detail-icon" />
                  Member Since
                </div>
                <div className="detail-value">
                  {userData.createdAt || userData.memberSince
                    ? new Date(userData.createdAt || userData.memberSince).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : '—'}
                </div>
              </div>
            </div>
          ) : (
            <div className="profile-edit-form">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="contactNumber">Contact Number</label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-buttons">
                  <button type="button" className="cancel-button" onClick={() => setEditMode(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="save-button">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="profile-actions">
            <button 
              className="edit-profile-button" 
              onClick={() => setEditMode(!editMode)}
            >
              <MdEdit className="edit-icon" />
              {editMode ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .profile-container {
          max-width: 600px;
          width: 100%;
          height: 100vh;
          margin: 0 auto;
          background-color: #f7f7f7;
          position: relative;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          overflow: hidden; /* Prevent outer scrolling */
        }
        
        .profile-header {
          background-color: #ff8c00e0;
          padding: 16px;
          display: flex;
          align-items: center;
          color: white;
          position: sticky;
          top: 0;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
          z-index: 10;
        }
        
        .back-button {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          margin-right: 15px;
          display: flex;
          align-items: center;
          transition: transform 0.2s;
        }
        
        .back-button:hover {
          transform: translateX(-3px);
        }
        
        .back-icon {
          font-size: 22px;
        }
        
        .header-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
          flex-grow: 1;
          text-align: center;
          margin-right: 22px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .profile-content {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
          scroll-behavior: smooth; /* Smooth scrolling on all browsers */
          height: calc(100vh - 60px); /* Subtract header height */
          padding-bottom: 40px; /* Extra padding at bottom for better scrolling */
        }
        
        /* Scrollbar styling */
        .profile-content::-webkit-scrollbar {
          width: 6px;
        }
        
        .profile-content::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        
        .profile-content::-webkit-scrollbar-thumb {
          background: rgba(255, 140, 0, 0.3);
          border-radius: 10px;
          transition: background 0.3s;
        }
        
        .profile-content::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 140, 0, 0.5);
        }
        
        .profile-card {
          max-width: 100%;
          overflow: hidden;
          background-color: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .profile-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
        }
        
        .profile-avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 36px 20px 28px;
          background: linear-gradient(to bottom, #f9f9f9, #ffffff);
          border-bottom: 1px solid #f0f0f0;
        }
        
        .profile-avatar {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          overflow: hidden;
          margin-bottom: 18px;
          border: 4px solid white;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s;
        }
        
        .profile-avatar:hover {
          transform: scale(1.05);
        }
        
        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fbaa39, #fc753b);
          color: white;
          font-size: 42px;
          font-weight: bold;
        }
        
        .user-name {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 10px 0;
          color: #333;
        }
        
        .role-badge {
          background: linear-gradient(135deg, #fbaa39, #fc753b);
          color: white;
          padding: 6px 16px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(255, 140, 0, 0.3);
        }
        
        .profile-details {
          padding: 20px 24px;
        }
        
        .detail-item {
          padding: 16px 0;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s;
        }
        
        .detail-item:hover {
          background-color: #fafafa;
        }
        
        .detail-item:last-child {
          border-bottom: none;
        }
        
        .detail-label {
          font-size: 14px;
          color: #888;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
        }
        
        .detail-icon {
          margin-right: 10px;
          font-size: 18px;
          color: #ff8c00e0;
        }
        
        .detail-value {
          font-size: 16px;
          color: #333;
          word-break: break-word;
          font-weight: 500;
          padding-left: 28px;
        }
        
        .profile-actions {
          padding: 8px 24px 28px;
          display: flex;
          justify-content: center;
        }
        
        .edit-profile-button {
          background: linear-gradient(135deg,#fbaa39, #fc753b);
          color: white;
          border: none;
          border-radius: 50px;
          padding: 14px 28px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          box-shadow: 0 2px 5px rgba(51, 50, 48, 0.5);
          transition: all 0.3s ease;
        }
        
        .edit-profile-button:hover {
          background: linear-gradient(135deg,#fbaa39, #fc753b);
          transform: translateY(-3px);
          box-shadow: 0 6px 15px rgba(255, 140, 0, 0.35);
        }
        
        .edit-profile-button:active {
          transform: translateY(-1px);
        }
        
        .edit-icon {
          margin-right: 10px;
          font-size: 18px;
        }
        
        /* Form styles */
        .profile-edit-form {
          padding: 24px;
        }
        
        .form-group {
          margin-bottom: 24px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 10px;
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }
        
        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 10px;
          font-size: 16px;
          transition: all 0.2s;
          background-color: #f9f9f9;
        }
        
        .form-group input:focus {
          border-color: #ff8c00e0;
          outline: none;
          box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.15);
          background-color: #fff;
        }
        
        .form-buttons {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
        }
        
        .cancel-button {
          background-color: #f3f3f3;
          color: #555;
          border: none;
          border-radius: 10px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .cancel-button:hover {
          background-color: #eaeaea;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
        }
        
        .save-button {
          background: linear-gradient(135deg, #fbaa39, #fc753b);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 12px 30px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(255, 140, 0, 0.25);
        }
        
        .save-button:hover {
          background: linear-gradient(135deg, #fbaa39, #fc753b);
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(255, 140, 0, 0.35);
        }
        
        /* Loading and error states */
        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          width: 100%;
          background-color: #f7f7f7;
        }
        
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 140, 0, 0.1);
          border-radius: 50%;
          border-top: 4px solid #ff8c00e0;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-text {
          font-size: 16px;
          color: #666;
          font-weight: 500;
        }
        
        .error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          width: 100%;
          font-size: 16px;
          color: #e53e3e;
          padding: 0 20px;
          text-align: center;
          background-color: #f7f7f7;
        }
        
        /* Fix for iOS momentum scrolling issues */
        @supports (-webkit-overflow-scrolling: touch) {
          .profile-container {
            -webkit-overflow-scrolling: touch;
          }
          
          .profile-content {
            -webkit-overflow-scrolling: touch;
          }
        }
        
        /* Responsive styles */
        @media (max-width: 480px) {
          .profile-avatar {
            width: 90px;
            height: 90px;
          }
          
          .user-name {
            font-size: 20px;
          }
          
          .header-title {
            font-size: 18px;
          }
          
          .detail-value {
            font-size: 15px;
          }
          
          .edit-profile-button {
            padding: 12px 20px;
            font-size: 15px;
          }
          
          .profile-content {
            padding: 16px 16px 32px;
          }
          
          .profile-details {
            padding: 16px 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
