import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { product } from '../api';
import { MdArrowBack } from 'react-icons/md';

const AddProductPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    availability: 'Available', // Default to Available
    estimatedTime: '', // New field for estimated delivery time
    shippingFee: '0', // New field for shipping fee
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      if (selectedImage) {
        submitData.append('image', selectedImage);
      }

      await product.createProduct(submitData);
      setSuccess('Product created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        availability: 'Available',
        estimatedTime: '',
        shippingFee: '0',
      });
      setSelectedImage(null);
      setPreviewUrl('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Redirect after success
      setTimeout(() => {
        navigate('/seller/product-list');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.mainContainer}>
      <div style={styles.header}>
        <div style={styles.backButton} onClick={() => navigate(-1)}>
          <span style={styles.backArrow}>←</span>
          <span style={styles.headerText}>Add New Product</span>
        </div>
      </div>

      <div style={styles.contentContainer}>
        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <div style={styles.formContainer}>
          <form onSubmit={handleSubmit} style={styles.form} className="product-form">
            <div style={styles.imagePreviewContainer}>
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" style={styles.imagePreview} />
              ) : (
                <div style={styles.placeholderImage}>
                  📷 Upload Image
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                style={styles.fileInput}
                className="file-input"
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="name" style={styles.label}>Product Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={styles.input}
                className="product-input"
                placeholder="Enter product name"
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="description" style={styles.label}>Description:</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                style={styles.textarea}
                className="product-textarea"
                placeholder="Enter product description"
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="price" style={styles.label}>Price:</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                style={styles.input}
                className="product-input"
                placeholder="Enter price"
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="category" style={styles.label}>Category:</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                style={styles.input}
                className="product-input"
                placeholder="Enter category"
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="estimatedTime" style={styles.label}>Estimated Delivery Time (minutes):</label>
              <input
                type="number"
                id="estimatedTime"
                name="estimatedTime"
                value={formData.estimatedTime}
                onChange={handleInputChange}
                required
                min="1"
                style={styles.input}
                className="product-input"
                placeholder="Enter estimated delivery time in minutes"
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="shippingFee" style={styles.label}>Shipping Fee:</label>
              <input
                type="number"
                id="shippingFee"
                name="shippingFee"
                value={formData.shippingFee}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                style={styles.input}
                className="product-input"
                placeholder="Enter shipping fee"
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="availability" style={styles.label}>Availability:</label>
              <select
                id="availability"
                name="availability"
                value={formData.availability}
                onChange={handleInputChange}
                style={styles.select}
                className="product-select"
              >
                <option value="Available">Available</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            <div style={styles.buttonRow}>
              <button
                type="submit"
                style={{
                  ...styles.submitButton,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                disabled={loading}
                className="product-button"
              >
                {loading ? 'Creating...' : 'Create Product'}
              </button>
            </div>
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
  contentContainer: {
    overflow: 'auto',
    maxHeight: 'calc(100vh - 60px)',
    paddingBottom: '30px',
    WebkitOverflowScrolling: 'touch',
    scrollBehavior: 'smooth',
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
  imagePreviewContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '10px',
  },
  imagePreview: {
    width: '100%',
    maxWidth: '125px',
    height: '125px',
    objectFit: 'cover',
    borderRadius: '12px',
    border: '2px solid #eee',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
  },
  placeholderImage: {
    width: '100%',
    maxWidth: '125px',
    height: '125px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: '12px',
    border: '2px dashed #ddd',
    color: '#666',
    fontSize: '16px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.09)',
  },
  fileInput: {
    width: '100%',
    maxWidth: '250px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.09)',
  },
  label: {
    color: '#555',
    fontSize: '15px',
    fontWeight: '500',
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
  select: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#f9f9f9',
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23555%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 15px center',
    backgroundSize: '12px',
    transition: 'all 0.2s',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    marginTop: '20px',
  },
  submitButton: {
    padding: '14px 28px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #fbaa39, #fc753b)',
    color: 'white',
    width: '100%',
    maxWidth: '200px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
  },
  error: {
    backgroundColor: '#fde8e8',
    color: '#e53e3e',
    padding: '12px',
    margin: '15px 15px 0',
    textAlign: 'center',
    borderRadius: '10px',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(229, 62, 62, 0.1)',
  },
  success: {
    backgroundColor: '#e6ffed',
    color: '#22543d',
    padding: '12px',
    margin: '15px 15px 0',
    textAlign: 'center',
    borderRadius: '10px',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(34, 84, 61, 0.1)',
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
    
    .product-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 15px rgba(255, 140, 0, 0.35);
    }
    
    .product-input:focus, .product-textarea:focus, .product-select:focus {
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
    }
    
    .contentContainer::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 140, 0, 0.5);
    }
    
    @media (max-width: 768px) {
      .form {
        padding: 20px 15px;
      }
      
      .imagePreview, .placeholderImage {
        height: 200px;
      }
    }
  `}</style>
);

export default AddProductPage;