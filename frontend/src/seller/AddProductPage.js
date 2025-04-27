import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { product } from '../api';

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
    availability: 'Available',
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
    <div className="add-product-container" style={styles.container}>
      <h1 style={styles.title}>Add New Product</h1>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
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
            placeholder="Enter category"
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
          >
            <option value="Available">Available</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        <button
          type="submit"
          style={{
            ...styles.submitButton,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  imagePreviewContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  imagePreview: {
    width: '200px',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '10px',
    border: '2px solid #ddd',
  },
  placeholderImage: {
    width: '200px',
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: '10px',
    border: '2px dashed #ddd',
    color: '#666',
    fontSize: '16px',
  },
  fileInput: {
    width: '200px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: '#666',
    fontSize: '14px',
    fontWeight: '500',
  },
  input: {
    padding: '12px 15px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    transition: 'border-color 0.3s',
  },
  textarea: {
    padding: '12px 15px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    minHeight: '100px',
    resize: 'vertical',
  },
  select: {
    padding: '12px 15px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    backgroundColor: 'white',
  },
  submitButton: {
    padding: '15px',
    backgroundColor: '#ff8c00e0',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  error: {
    backgroundColor: '#ffe6e6',
    color: '#dc3545',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  success: {
    backgroundColor: '#e6ffe6',
    color: '#28a745',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
  },
};

export default AddProductPage;