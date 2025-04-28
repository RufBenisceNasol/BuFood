import React, { useState, useEffect } from 'react';
import { store } from '../api';
import { useNavigate } from 'react-router-dom';

const StoreSettings = () => {
  const navigate = useNavigate();
  const [storeData, setStoreData] = useState(null);
  const [formData, setFormData] = useState({
    storeName: '',
    sellerName: '',
    email: '',
    contactNumber: '',
    description: '',
    shippingFee: '',
    openTime: '',
    profileImage: '',
    bannerImage: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchStoreDetails();
  }, []);

  const fetchStoreDetails = async () => {
    setLoading(true);
    setError('');
    try {
      // Get store data which includes email and phone from registration
      const data = await store.getMyStore();
      setStoreData(data);
      
      // Set the form data with user registration info
      setFormData({
        storeName: data.storeName || '',
        sellerName: data.sellerName || '',
        email: data.email || '', // Email from registration
        contactNumber: data.contactNumber || '', // Phone from registration
        description: data.description || '',
        shippingFee: data.shippingFee || '',
        openTime: data.openTime || '',
        profileImage: data.profileImage || '',
        bannerImage: data.bannerImage || '',
      });

      console.log('Fetched registration data:', {
        email: data.email,
        contactNumber: data.contactNumber
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch store details');
      console.error('Error fetching store data:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateInputs = () => {
    const errors = {};
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Phone number validation (accepts various formats)
    const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10,14}$/;
    if (!phoneRegex.test(formData.contactNumber.replace(/\s+/g, ''))) {
      errors.contactNumber = 'Please enter a valid phone number';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, bannerImage: file }));
    }
  };

  const handleProfileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, profileImage: file }));
    }
  };

  const handleEdit = () => {
    setEditMode(true);
    setSuccess('');
    setError('');
    setValidationErrors({});
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate inputs before submission
    if (!validateInputs()) {
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const submitData = new FormData();
      submitData.append('storeName', formData.storeName);
      submitData.append('sellerName', formData.sellerName);
      submitData.append('email', formData.email);
      submitData.append('contactNumber', formData.contactNumber);
      submitData.append('description', formData.description);
      submitData.append('shippingFee', formData.shippingFee);
      submitData.append('openTime', formData.openTime);
      if (formData.bannerImage && formData.bannerImage instanceof File) {
        submitData.append('bannerImage', formData.bannerImage);
      }
      if (formData.profileImage && formData.profileImage instanceof File) {
        submitData.append('profileImage', formData.profileImage);
      }
      const updated = await store.updateStore(storeData._id, submitData);
      setStoreData(updated);
      setEditMode(false);
      setSuccess('Store details updated successfully!');
      fetchStoreDetails();
    } catch (err) {
      setError(err.message || 'Failed to update store');
    } finally {
      setSaving(false);
    }
  };

  const changeBanner = () => {
    document.getElementById('banner-input').click();
  };

  const changeProfile = () => {
    document.getElementById('profile-input').click();
  };

  const handleBack = () => {
    navigate(-1); // Navigate to previous page
  };

  if (loading) {
    return <div style={styles.loadingContainer}>Loading...</div>;
  }
  if (error && !editMode) {
    return <div style={styles.error}>{error}</div>;
  }

  return (
    <div style={styles.mainContainer}>
      <div style={styles.header}>
        <div style={styles.backButton} onClick={handleBack}>
          <span style={styles.backArrow}>←</span>
          <span style={styles.headerText}>Store Settings</span>
        </div>
      </div>
      
      <div style={styles.contentContainer}>
      <div style={styles.bannerWrapper}>
        <img
          src={
            formData.bannerImage && typeof formData.bannerImage !== 'string'
              ? URL.createObjectURL(formData.bannerImage)
              : formData.bannerImage || '/default-banner.jpg'
          }
          alt="Banner"
          style={styles.bannerImg}
        />
          {editMode && (
            <div style={styles.changeBanner} onClick={changeBanner}>
              <span>Change Banner</span>
              <input 
                id="banner-input"
                type="file" 
                style={styles.hiddenInput} 
                onChange={handleBannerChange}
                accept="image/*"
              />
            </div>
          )}
          
        <div style={styles.profileAvatarWrapper}>
          {formData.profileImage && typeof formData.profileImage !== 'string' ? (
            <img
              src={URL.createObjectURL(formData.profileImage)}
              alt="Profile"
              style={styles.profileAvatar}
            />
          ) : formData.profileImage ? (
            <img
              src={formData.profileImage}
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
              {(formData.storeName || formData.sellerName || 'S').charAt(0).toUpperCase()}
            </div>
          )}
            {editMode && (
              <div style={styles.changeProfile} onClick={changeProfile}>
                <span>Change</span>
                <input 
                  id="profile-input"
                  type="file" 
                  style={styles.hiddenInput} 
                  onChange={handleProfileChange}
                  accept="image/*"
                />
              </div>
            )}
        </div>
          
        <div style={styles.blackBar}>
          <div style={styles.storeName}>{formData.storeName || 'Store Name'}</div>
          <div style={styles.sellerName}>{formData.sellerName || 'Seller Name'}</div>
        </div>
      </div>
        
        <div style={styles.formContainer}>
      <form onSubmit={handleSave} style={styles.form} className="store-settings-form">
        <div style={styles.inputGroup}>
              <label style={styles.label}>Store Name</label>
          <input
            type="text"
                name="storeName"
                value={formData.storeName}
            onChange={handleInputChange}
            disabled={!editMode}
            style={styles.input}
            className="store-settings-input"
            required
          />
        </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email <span style={styles.registeredLabel}>(Registered Email)</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!editMode}
                style={{
                  ...styles.input,
                  borderColor: validationErrors.email ? '#e53e3e' : '#ddd'
                }}
                className="store-settings-input"
                required
              />
              {validationErrors.email && (
                <div style={styles.fieldError}>{validationErrors.email}</div>
              )}
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Contact number <span style={styles.registeredLabel}>(Registered Phone)</span></label>
              <input
                type="text"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                disabled={!editMode}
                style={{
                  ...styles.input,
                  borderColor: validationErrors.contactNumber ? '#e53e3e' : '#ddd'
                }}
                className="store-settings-input"
                required
              />
              {validationErrors.contactNumber && (
                <div style={styles.fieldError}>{validationErrors.contactNumber}</div>
              )}
            </div>
            
        <div style={styles.inputGroup}>
          <label style={styles.label}>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            disabled={!editMode}
            style={styles.textarea}
            className="store-settings-textarea"
            required
          />
        </div>
            
        <div style={styles.inputGroup}>
          <label style={styles.label}>Set Shipping Fee</label>
          <input
            type="number"
            name="shippingFee"
            value={formData.shippingFee}
            onChange={handleInputChange}
            disabled={!editMode}
            style={styles.input}
            className="store-settings-input"
            required
          />
        </div>
            
        <div style={styles.inputGroup}>
          <label style={styles.label}>Open Time</label>
          <input
            type="text"
            name="openTime"
            value={formData.openTime}
            onChange={handleInputChange}
            disabled={!editMode}
            style={styles.input}
            className="store-settings-input"
            required
          />
        </div>
            
        <div style={styles.buttonRow}>
          {!editMode ? (
            <button
              type="button"
                  style={styles.editButton}
              className="store-settings-button"
              onClick={handleEdit}
            >
              Edit
            </button>
          ) : (
            <button
              type="submit"
                  style={styles.saveButton}
              className="store-settings-button"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}
      </form>
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
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ff8c00e0',
    color: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  backArrow: {
    fontSize: '22px',
    marginRight: '10px',
    color: 'white',
  },
  headerText: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'white',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: '16px',
    margin: '20px 15px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    transition: 'transform 0.3s, box-shadow 0.3s',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
    padding: '25px 24px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
  },
  label: {
    color: '#555',
    fontSize: '15px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
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
  fieldError: {
    color: '#e53e3e',
    fontSize: '13px',
    marginTop: '4px',
  },
  textarea: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    fontSize: '16px',
    minHeight: '120px',
    width: '100%',
    boxSizing: 'border-box',
    resize: 'vertical',
    backgroundColor: '#f9f9f9',
    transition: 'all 0.2s',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    marginTop: '20px',
  },
  editButton: {
    padding: '14px 28px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #ff8c00e0, #ff6a00)',
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
    background: 'linear-gradient(135deg, #28a745, #218838)',
    color: 'white',
    opacity: (props) => (props.saving ? 0.7 : 1),
    cursor: (props) => (props.saving ? 'not-allowed' : 'pointer'),
    width: '100%',
    maxWidth: '150px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.25)',
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
  },
  bannerWrapper: {
    position: 'relative',
    width: '100%',
    marginBottom: '50px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  },
  bannerImg: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    display: 'block',
  },
  profileAvatarWrapper: {
    position: 'absolute',
    bottom: '-38px',
    left: '20px',
    zIndex: 2,
  },
  profileAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: '4px solid white',
    objectFit: 'cover',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    transition: 'transform 0.3s',
  },
  blackBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: '12px 20px 12px 115px',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    boxSizing: 'border-box',
  },
  storeName: {
    color: 'white',
    fontSize: '18px',
    fontWeight: 'bold',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
  },
  sellerName: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
    marginTop: '3px',
  },
  hiddenInput: {
    display: 'none',
  },
  changeBanner: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '8px 15px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s',
  },
  changeProfile: {
    position: 'absolute',
    bottom: '-5px',
    right: '-12px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '6px 10px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s',
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
    
    .store-settings-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 15px rgba(255, 140, 0, 0.35);
    }
    
    .store-settings-input:focus, .store-settings-textarea:focus {
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
    
    .changeBanner:hover, .changeProfile:hover {
      background-color: rgba(0, 0, 0, 0.85);
      transform: translateY(-2px);
    }
    
    @media (max-width: 768px) {
      .store-settings-form {
        padding: 20px 15px;
      }
    }
    
    @media (max-width: 600px) {
      .store-settings-container {
        padding: 0 !important;
      }
      .store-settings-form {
        padding: 20px 15px;
      }
      .store-settings-button {
        width: 100% !important;
        max-width: none !important;
      }
    }
    
    @media (max-width: 480px) {
      #root {
        overflow-x: hidden;
      }
      .profileAvatar {
        width: 70px !important;
        height: 70px !important;
      }
      .blackBar {
        padding-left: 100px !important;
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
        font-size: 18px !important;
      }
      .label {
        font-size: 14px !important;
      }
      .input, .textarea {
        padding: 10px 12px !important;
        font-size: 14px !important;
      }
      .profileAvatar {
        width: 65px !important;
        height: 65px !important;
      }
      .blackBar {
        padding-left: 95px !important;
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

export default StoreSettings;

