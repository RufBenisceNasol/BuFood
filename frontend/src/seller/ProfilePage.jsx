import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, store as storeApi } from '../api';
import { MdArrowBack, MdEdit, MdPerson, MdEmail, MdPhone, MdBusiness, MdDateRange } from 'react-icons/md';
import { getToken } from '../utils/tokenUtils';

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNumber: ''
  });
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userData && userData.role === 'Seller') {
      fetchStoreData();
    }
  }, [userData]);

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        contactNumber: userData.contactNumber || userData.phone || ''
      });
    }
  }, [userData]);

  const fetchStoreData = async () => {
    try {
      const response = await storeApi.getMyStore();
      console.log('Store data retrieved:', response);
      setStoreData(response);
    } catch (err) {
      console.error('Error fetching store data:', err);
    }
  };

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

  const handleEdit = () => {
    setEditMode(true);
    setSaving(false);
    setSuccess('');
    setError('');
  };

  const handleCancel = () => {
    setEditMode(false);
    // Reset form data to original values
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        contactNumber: userData.contactNumber || userData.phone || ''
      });
    }
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      console.log('Submitting form data:', formData);
      
      // Try a direct API call instead of using the auth module
      const token = getToken();
      const response = await fetch('http://localhost:8000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          contactNumber: formData.contactNumber
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      
      // Handle both possible response structures
      const updatedUser = data.user || data;
      
      // Update the local userData state
      setUserData({
        ...userData,
        name: updatedUser.name,
        contactNumber: updatedUser.contactNumber
      });
      
    setEditMode(false);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={styles.loadingContainer}>Loading...</div>;
  }

  if (error && !userData) {
    return <div style={styles.error}>{error}</div>;
  }

  if (!userData) {
    return <div style={styles.error}>No user data found</div>;
  }

  // Get profile image from store data if user is a seller
  const getProfileImage = () => {
    // If user is a seller and store data is available with image
    if (userData.role === 'Seller' && storeData && storeData.image) {
      return storeData.image;
    }
    // Otherwise use user image if available
    return userData.image || null;
  };

  const profileImage = getProfileImage();

  return (
    <div style={styles.mainContainer}>
      <div style={styles.header}>
        <div style={styles.backButton} onClick={handleGoBack}>
          <span style={styles.backArrow}>←</span>
          <span style={styles.headerText}>My Profile</span>
        </div>
      </div>

      <div style={styles.contentContainer}>
        <div style={styles.avatarSection}>
          <div style={styles.profileAvatarWrapper}>
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                style={styles.profileAvatar}
              />
            ) : (
              <div style={{
                ...styles.profileAvatar,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#ff8c00e0',
                fontSize: '32px',
                fontWeight: 'bold',
              }}>
                {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
          <div style={styles.userInfo}>
            <h2 style={styles.userName}>{userData.name}</h2>
            <div style={styles.roleBadge}>{userData.role}</div>
          </div>
          </div>

        <div style={styles.formContainer}>
          {!editMode ? (
            <div style={styles.profileDetails}>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>
                  <MdPerson style={styles.detailIcon} />
                  Full Name
                </div>
                <div style={styles.detailValue}>{userData.name || '—'}</div>
              </div>

              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>
                  <MdEmail style={styles.detailIcon} />
                  Email
                </div>
                <div style={styles.detailValue}>{userData.email || '—'}</div>
              </div>

              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>
                  <MdPhone style={styles.detailIcon} />
                  Contact Number
                </div>
                <div style={styles.detailValue}>{userData.contactNumber || '—'}</div>
              </div>

              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>
                  <MdBusiness style={styles.detailIcon} />
                  Role
                </div>
                <div style={styles.detailValue}>{userData.role}</div>
              </div>

              {userData.role === 'Seller' && (
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>
                    <MdBusiness style={styles.detailIcon} />
                    Store Name
                  </div>
                  <div style={styles.detailValue}>
                    {storeData?.storeName || userData.store?.storeName || '—'}
                  </div>
                </div>
              )}

              {/* Temporarily hidden: Member Since */}
              {false && (
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>
                    <MdDateRange style={styles.detailIcon} />
                    Member Since
                  </div>
                  <div style={styles.detailValue}>
                    {userData.createdAt || userData.memberSince
                      ? new Date(userData.createdAt || userData.memberSince).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : '—'}
                  </div>
                </div>
              )}
              
              <div style={styles.buttonRow}>
                <button
                  type="button"
                  style={styles.editButton}
                  onClick={handleEdit}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  style={styles.input}
                    required
                  />
                </div>
                
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email <span style={styles.registeredLabel}>(Registered Email)</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                  disabled={true}
                  style={{
                    ...styles.input,
                    backgroundColor: '#f3f3f3',
                    color: '#888',
                    cursor: 'not-allowed',
                  }}
                    required
                  />
                </div>
                
              <div style={styles.inputGroup}>
                <label style={styles.label}>Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                  style={styles.input}
                  />
                </div>
                
              <div style={styles.buttonRow}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={handleCancel}
                >
                    Cancel
                  </button>
                <button
                  type="submit"
                  style={styles.saveButton}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
          )}
          
          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}
        </div>
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
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100%',
    fontSize: '16px',
    color: '#666',
    fontWeight: '500',
  },
  contentContainer: {
    overflow: 'auto',
    maxHeight: 'calc(100vh - 60px)',
    paddingBottom: '30px',
    WebkitOverflowScrolling: 'touch',
    scrollBehavior: 'smooth',
  },
  header: {
    padding: '7px 10px',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ff8c00e0',
    color: 'white',
    position: 'sticky',
    height: '60px',
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
  avatarSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '30px 0 20px',
    textAlign: 'center',
  },
  profileAvatarWrapper: {
    position: 'relative',
    marginBottom: '15px',
  },
  profileAvatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    border: '4px solid white',
    objectFit: 'cover',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    transition: 'transform 0.3s',
  },
  userInfo: {
    textAlign: 'center',
  },
  userName: {
    margin: '5px 0',
    fontSize: '22px',
    fontWeight: '600',
    color: '#333',
  },
  roleBadge: {
    background: 'linear-gradient(135deg, #fbaa39, #fc753b)',
    color: 'white',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: '16px',
    margin: '0 15px 20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    transition: 'transform 0.3s, box-shadow 0.3s',
  },
  profileDetails: {
    padding: '20px',
  },
  detailItem: {
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  detailLabel: {
    fontSize: '14px',
    color: 'rgb(0, 0, 0)',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
  },
  detailIcon: {
    marginRight: '10px',
    fontSize: '18px',
    color: ' #ff8c00e0',
  },
  detailValue: {
    fontSize: '15px',
    color: 'rgb(142, 142, 142)',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
    padding: '25px 24px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    width: '100%',
    marginBottom: '16px',
  },
  label: {
    color: '#555',
    fontSize: '15px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
  },
  registeredLabel: {
    color: '#888',
    fontSize: '13px',
    fontWeight: '400',
    fontStyle: 'italic',
    marginLeft: '5px',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#f9f9f9',
    transition: 'all 0.2s',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    marginTop: '20px',
    gap: '10px',
  },
  editButton: {
    padding: '14px 28px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #fbaa39, #fc753b)',
    color: 'white',
    width: '100%',
    maxWidth: '150px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(255, 140, 0, 0.25)',
  },
  saveButton: {
    padding: '14px 28px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #fbaa39, #fc753b)',
    color: 'white',
    width: '100%',
    maxWidth: '150px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(255, 140, 0, 0.25)',
  },
  cancelButton: {
    padding: '14px 28px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    background: '#f0f0f0',
    color: '#555',
    width: '100%',
    maxWidth: '150px',
    marginRight: '10px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  error: {
    backgroundColor: '#fde8e8',
    color: '#e53e3e',
    padding: '12px',
    marginTop: '15px',
    textAlign: 'center',
    borderRadius: '10px',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(229, 62, 62, 0.1)',
    margin: '15px 24px',
  },
  success: {
    backgroundColor: '#e6ffed',
    color: '#22543d',
    padding: '12px',
    marginTop: '15px',
    textAlign: 'center',
    borderRadius: '10px',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(34, 84, 61, 0.1)',
    margin: '15px 24px',
  },
};

// Responsive media queries using a style tag
const ResponsiveStyle = () => (
      <style>{`
    * {
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    button {
          cursor: pointer;
    }
    
    button:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 15px rgba(255, 140, 0, 0.35);
    }
    
    button[style*="cancelButton"]:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
      background: #e5e5e5;
    }
    
    input:focus {
      border-color: #ff8c00e0;
      outline: none;
      box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.15);
      background-color: #fff;
        }
        
        /* Scrollbar styling */
    .contentContainer::-webkit-scrollbar {
          width: 6px;
        }
        
    .contentContainer::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        
    .contentContainer::-webkit-scrollbar-thumb {
          background: rgba(255, 140, 0, 0.3);
          border-radius: 10px;
          transition: background 0.3s;
        }
        
    .contentContainer::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 140, 0, 0.5);
        }
        
    .formContainer:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
        }
        
    .backButton:hover {
      transform: translateX(-3px);
    }
    
    @media (max-width: 768px) {
      .form {
        padding: 20px 15px;
      }
    }
    
    @media (max-width: 600px) {
      .buttonRow {
        flex-direction: column !important;
        gap: 10px !important;
      }
      
      .cancelButton, .saveButton, .editButton {
        max-width: none !important;
        margin-right: 0 !important;
      }
    }
    
    @media (max-width: 480px) {
      .contentContainer {
        overflow-x: hidden;
      }
      
      .profileAvatar {
        width: 80px !important;
        height: 80px !important;
      }
      
      .formContainer {
        margin: 15px 10px !important;
      }
      
      .form {
        padding: 20px !important;
      }
      
      .header {
        padding: 14px 15px !important;
      }
    }
    
    @media (max-width: 400px) {
      .header {
        padding: 12px 15px !important;
      }
      
      .backArrow {
        font-size: 18px !important;
      }
      
      .headerText {
        font-size: 16px !important;
      }
      
      .label {
        font-size: 14px !important;
      }
      
      .input {
        padding: 10px 12px !important;
        font-size: 14px !important;
      }
        }
        
        /* Fix for iOS momentum scrolling issues */
        @supports (-webkit-overflow-scrolling: touch) {
      .contentContainer {
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
  );

export default ProfilePage;