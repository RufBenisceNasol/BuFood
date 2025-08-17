import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { auth, store } from '../api';
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
    openTime: '',
    image: '',
    bannerImage: '',
    // Manual GCash fields
    gcashName: '',
    gcashNumber: '',
    gcashQr: null, // File or null
    gcashQrUrl: '', // existing URL for preview
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchAllDetails();
  }, []);

  // Fetch both store and profile details
  const fetchAllDetails = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch store data
      const data = await store.getMyStore();
      setStoreData(data);

      // Fetch seller profile
      const profile = await auth.getMe();
      // Use profile for email, name, contact number
      setFormData({
        storeName: data.storeName || '',
        sellerName: profile.name || '',
        email: profile.email || '',
        contactNumber: profile.contactNumber || '',
        description: data.description || '',
        openTime: data.openTime || '',
        image: data.image || '',
        bannerImage: data.bannerImage || '',
        gcashName: data.gcashName || '',
        gcashNumber: data.gcashNumber || '',
        gcashQr: null,
        gcashQrUrl: data.gcashQrUrl || '',
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch store/profile details');
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

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
  }, [validationErrors]);

  const handleBannerChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, bannerImage: file }));
    }
  }, []);

  const handleProfileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
    }
  }, []);

  // Handle GCash QR change
  const handleGcashQrChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, gcashQr: file }));
    }
  }, []);

  // Memoized preview URLs to avoid recreating blob URLs every render
  const bannerPreviewUrl = useMemo(() => {
    if (formData.bannerImage && typeof formData.bannerImage !== 'string') {
      return URL.createObjectURL(formData.bannerImage);
    }
    return formData.bannerImage || '/default-banner.jpg';
  }, [formData.bannerImage]);

  const profilePreviewUrl = useMemo(() => {
    if (formData.image && typeof formData.image !== 'string') {
      return URL.createObjectURL(formData.image);
    }
    return formData.image || '';
  }, [formData.image]);

  const gcashQrPreviewUrl = useMemo(() => {
    if (formData.gcashQr && typeof formData.gcashQr !== 'string') {
      return URL.createObjectURL(formData.gcashQr);
    }
    return formData.gcashQrUrl || '';
  }, [formData.gcashQr, formData.gcashQrUrl]);

  // Revoke blob URLs when they change to prevent memory leaks and jank
  useEffect(() => {
    return () => {
      if (bannerPreviewUrl && bannerPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(bannerPreviewUrl);
      }
    };
  }, [bannerPreviewUrl]);

  useEffect(() => {
    return () => {
      if (profilePreviewUrl && profilePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(profilePreviewUrl);
      }
    };
  }, [profilePreviewUrl]);

  useEffect(() => {
    return () => {
      if (gcashQrPreviewUrl && gcashQrPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(gcashQrPreviewUrl);
      }
    };
  }, [gcashQrPreviewUrl]);

  const handleEdit = useCallback(() => {
    setEditMode(true);
    setSaving(false);
    setSuccess('');
    setError('');
    setValidationErrors({});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate inputs before submission
    if (!validateInputs()) {
      setSaving(false); // Reset saving if validation fails
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
      submitData.append('openTime', formData.openTime);
      if (formData.bannerImage && formData.bannerImage instanceof File) {
        submitData.append('bannerImage', formData.bannerImage);
      }
      if (formData.image && formData.image instanceof File) {
        submitData.append('image', formData.image);
      }
      // GCash fields
      submitData.append('gcashName', formData.gcashName || '');
      submitData.append('gcashNumber', formData.gcashNumber || '');
      if (formData.gcashQr && formData.gcashQr instanceof File) {
        submitData.append('gcashQr', formData.gcashQr);
      }
      const updated = await store.updateStore(storeData._id, submitData);
      setStoreData(updated);
      setEditMode(false);
      setSuccess('Store details updated successfully!');
      // Notify other views (e.g., Dashboard) to refresh without forcing full reload
      try {
        window.dispatchEvent(new Event('store-updated'));
      } catch (_) {}
      try {
        // Store info about which store and which images changed for cache-busting
        const payload = {
          ts: Date.now(),
          banner: Boolean(formData.bannerImage),
          image: Boolean(formData.image),
          storeId: storeData?._id
        };
        localStorage.setItem('bufood:store-updated', JSON.stringify(payload));
      } catch (_) {}
      await fetchAllDetails();
    } catch (err) {
      setError(err.message || 'Failed to update store');
    } finally {
      setSaving(false); // This ensures saving state is always reset
    }
  };

  const handleCancel = () => {
    // Reset form to original data
    fetchAllDetails();
    setEditMode(false);
    setError('');
    setSuccess('');
    setValidationErrors({});
  };

  const changeBanner = useCallback(() => {
    document.getElementById('banner-input').click();
  }, []);

  const changeProfile = useCallback(() => {
    document.getElementById('profile-input').click();
  }, []);

  const handleBack = useCallback(() => {
    navigate(-1); // Navigate to previous page
  }, [navigate]);

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
          src={bannerPreviewUrl}
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
          {profilePreviewUrl ? (
            <img
              src={profilePreviewUrl}
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
                // Always disabled, not editable
                disabled={true}
                style={{
                  ...styles.input,
                  borderColor: validationErrors.email ? '#e53e3e' : '#ddd',
                  backgroundColor: '#f3f3f3',
                  color: '#888',
                  cursor: 'not-allowed',
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
                // Always disabled, not editable
                disabled={true}
                style={{
                  ...styles.input,
                  borderColor: validationErrors.contactNumber ? '#e53e3e' : '#ddd',
                  backgroundColor: '#f3f3f3',
                  color: '#888',
                  cursor: 'not-allowed',
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

        {/* GCash Payment Settings */}
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #eee' }}>
          <div style={{ fontWeight: 600, color: '#333', marginBottom: 6 }}>GCash Payment Settings</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>GCash Name</label>
              <input
                type="text"
                name="gcashName"
                value={formData.gcashName}
                onChange={handleInputChange}
                disabled={!editMode}
                style={styles.input}
                className="store-settings-input"
                placeholder="e.g., Juan Dela Cruz"
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>GCash Number</label>
              <input
                type="text"
                name="gcashNumber"
                value={formData.gcashNumber}
                onChange={handleInputChange}
                disabled={!editMode}
                style={styles.input}
                className="store-settings-input"
                placeholder="09XXXXXXXXX"
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>GCash QR</label>
              {gcashQrPreviewUrl ? (
                <img src={gcashQrPreviewUrl} alt="GCash QR" style={{ width: 180, height: 180, objectFit: 'contain', border: '1px solid #eee', borderRadius: 10, background: '#fafafa', marginBottom: 8 }} />
              ) : (
                <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>No QR uploaded</div>
              )}
              {editMode && (
                <div>
                  <input
                    id="gcash-qr-input"
                    type="file"
                    accept="image/*"
                    style={styles.hiddenInput}
                    onChange={handleGcashQrChange}
                  />
                  <button type="button" className="store-settings-button" style={{ ...styles.editButton, maxWidth: 180 }} onClick={() => document.getElementById('gcash-qr-input').click()}>
                    {formData.gcashQr ? 'Change QR' : 'Upload QR'}
                  </button>
                </div>
              )}
            </div>
          </div>
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
            <>
              <button
                type="button"
                style={styles.cancelButton}
                className="store-settings-button"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={styles.saveButton}
                className="store-settings-button"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
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
    backgroundColor: ' #f7f7f7',
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
    color: ' #666666',
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
    backgroundColor: ' #ff8c00e0',
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
    background: 'linear-gradient(135deg, #fbaa39, #fc753b)',
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
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
    transition: 'transform 0.3s',
  },
  blackBar: {
    background: 'linear-gradient(135deg,rgba(252, 147, 0, 0.64),rgba(56, 19, 3, 0.51))',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    boxSizing: 'border-box',
  },
  storeName: {
    color: 'white',
    fontSize: '18px',
    fontWeight: 'bold',
    textShadow: '0 3px 2px rgba(0, 0, 0, 0.5)',
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
    
    button[style*="cancelButton"]:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
      background: #e5e5e5;
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
      .buttonRow {
        flex-direction: column !important;
        gap: 10px !important;
      }
      .cancelButton, .saveButton {
        max-width: none !important;
        margin-right: 0 !important;
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

