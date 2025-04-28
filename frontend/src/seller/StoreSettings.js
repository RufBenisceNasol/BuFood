import React, { useState, useEffect } from 'react';
import { store } from '../api';

const StoreSettings = () => {
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

  if (loading) {
    return <div style={styles.loadingContainer}>Loading...</div>;
  }
  if (error && !editMode) {
    return <div style={styles.error}>{error}</div>;
  }

  return (
    <div style={styles.mainContainer}>
      <div style={styles.header}>
        <div style={styles.backButton}>
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
            <img
              src={
                formData.profileImage && typeof formData.profileImage !== 'string'
                  ? URL.createObjectURL(formData.profileImage)
                  : formData.profileImage || '/default-profile.jpg'
              }
              alt="Profile"
              style={styles.profileAvatar}
            />
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
    backgroundColor: '#f9f9f9',
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100%',
    fontSize: '16px',
    color: '#666',
  },
  contentContainer: {
    overflow: 'auto',
    maxHeight: 'calc(100vh - 60px)', // Subtract header height
    paddingBottom: '30px',
  },
  header: {
    padding: '15px 20px',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  backArrow: {
    fontSize: '20px',
    marginRight: '10px',
    color: '#333',
  },
  headerText: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#333',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    margin: '0 15px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
    padding: '25px 20px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  },
  label: {
    color: '#555',
    fontSize: '15px',
    fontWeight: '500',
  },
  registeredLabel: {
    color: '#888',
    fontSize: '13px',
    fontWeight: '400',
    fontStyle: 'italic',
  },
  input: {
    padding: '12px 15px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '15px',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    transition: 'border 0.2s',
    ':focus': {
      border: '1px solid #666',
      outline: 'none',
    }
  },
  fieldError: {
    color: '#e53e3e',
    fontSize: '13px',
    marginTop: '4px',
  },
  textarea: {
    padding: '12px 15px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '15px',
    minHeight: '100px',
    width: '100%',
    boxSizing: 'border-box',
    resize: 'vertical',
    backgroundColor: 'white',
    transition: 'border 0.2s',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    marginTop: '10px',
  },
  editButton: {
    padding: '12px 0',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    backgroundColor: '#FF8A00',
    color: 'white',
    width: '100%',
    maxWidth: '120px',
    transition: 'background-color 0.2s',
  },
  saveButton: {
    padding: '12px 0',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    backgroundColor: '#28a745',
    color: 'white',
    opacity: (props) => (props.saving ? 0.7 : 1),
    cursor: (props) => (props.saving ? 'not-allowed' : 'pointer'),
    width: '100%',
    maxWidth: '120px',
    transition: 'background-color 0.2s',
  },
  error: {
    backgroundColor: '#fde8e8',
    color: '#e53e3e',
    padding: '12px',
    marginTop: '15px',
    textAlign: 'center',
    borderRadius: '6px',
    fontSize: '14px',
  },
  success: {
    backgroundColor: '#e6ffed',
    color: '#22543d',
    padding: '12px',
    marginTop: '15px',
    textAlign: 'center',
    borderRadius: '6px',
    fontSize: '14px',
  },
  bannerWrapper: {
    position: 'relative',
    width: '100%',
    marginBottom: '40px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  bannerImg: {
    width: '100%',
    height: '180px',
    objectFit: 'cover',
    display: 'block',
  },
  profileAvatarWrapper: {
    position: 'absolute',
    bottom: '-35px',
    left: '20px',
    zIndex: 2,
  },
  profileAvatar: {
    width: '75px',
    height: '75px',
    borderRadius: '50%',
    border: '4px solid white',
    objectFit: 'cover',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
  },
  blackBar: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: '12px 20px 12px 110px',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    boxSizing: 'border-box',
  },
  storeName: {
    color: 'white',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  sellerName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '14px',
    marginTop: '3px',
  },
  hiddenInput: {
    display: 'none',
  },
  changeBanner: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  changeProfile: {
    position: 'absolute',
    bottom: '-5px',
    right: '-10px',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
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
      opacity: 0.9;
    }
    
    .store-settings-input:focus, .store-settings-textarea:focus {
      border-color: #777;
      outline: none;
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
        width: 65px !important;
        height: 65px !important;
      }
      .blackBar {
        padding-left: 95px !important;
      }
      .formContainer {
        margin: 0 10px !important;
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
      .input, .textarea {
        padding: 10px 12px !important;
        font-size: 14px !important;
      }
      .profileAvatar {
        width: 60px !important;
        height: 60px !important;
      }
      .blackBar {
        padding-left: 90px !important;
      }
    }
  `}</style>
);

export default StoreSettings;

