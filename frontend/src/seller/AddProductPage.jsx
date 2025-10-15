import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { product } from '../api';
import { MdArrowBack, MdAdd, MdDelete } from 'react-icons/md';

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
    stock: '0', // Stock quantity
    discount: '0', // Discount percentage (0-100)
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  // Variants state - array of {name, price}
  const [variants, setVariants] = useState([]);
  
  // Options state - array of {groupName, choices: []}
  const [optionGroups, setOptionGroups] = useState([]);

  // Predefined categories
  const categories = ['Drinks', 'Meals', 'Snacks', 'Desserts', 'Appetizers', 'Main Course', 'Beverages', 'Breakfast', 'Lunch', 'Dinner', 'Other'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Generate unique ID for variants
  const generateVariantId = (name) => {
    return name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36).substr(-4);
  };

  // Variant handlers
  const addVariant = () => {
    setVariants([...variants, { name: '', price: '' }]);
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  // Option group handlers
  const addOptionGroup = () => {
    setOptionGroups([...optionGroups, { groupName: '', choices: [''] }]);
  };

  const removeOptionGroup = (index) => {
    setOptionGroups(optionGroups.filter((_, i) => i !== index));
  };

  const updateOptionGroupName = (index, value) => {
    const updated = [...optionGroups];
    updated[index].groupName = value;
    setOptionGroups(updated);
  };

  const addChoice = (groupIndex) => {
    const updated = [...optionGroups];
    updated[groupIndex].choices.push('');
    setOptionGroups(updated);
  };

  const removeChoice = (groupIndex, choiceIndex) => {
    const updated = [...optionGroups];
    updated[groupIndex].choices = updated[groupIndex].choices.filter((_, i) => i !== choiceIndex);
    setOptionGroups(updated);
  };

  const updateChoice = (groupIndex, choiceIndex, value) => {
    const updated = [...optionGroups];
    updated[groupIndex].choices[choiceIndex] = value;
    setOptionGroups(updated);
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
      
      // Format variants with auto-generated IDs
      if (variants.length > 0) {
        const formattedVariants = variants
          .filter(v => v.name && v.price)
          .map(v => ({
            id: generateVariantId(v.name),
            name: v.name,
            price: parseFloat(v.price)
          }));
        if (formattedVariants.length > 0) {
          submitData.append('variants', JSON.stringify(formattedVariants));
        }
      }
      
      // Format options as object
      if (optionGroups.length > 0) {
        const formattedOptions = {};
        optionGroups.forEach(group => {
          if (group.groupName && group.choices.filter(c => c.trim()).length > 0) {
            formattedOptions[group.groupName] = group.choices.filter(c => c.trim());
          }
        });
        if (Object.keys(formattedOptions).length > 0) {
          submitData.append('options', JSON.stringify(formattedOptions));
        }
      }
      
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
        stock: '0',
        discount: '0',
      });
      setVariants([]);
      setOptionGroups([]);
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
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                style={styles.select}
                className="product-select"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
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
              <label htmlFor="stock" style={styles.label}>Stock Quantity:</label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                required
                min="0"
                style={styles.input}
                className="product-input"
                placeholder="Enter stock quantity"
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="discount" style={styles.label}>Discount (%):</label>
              <input
                type="number"
                id="discount"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="1"
                style={styles.input}
                className="product-input"
                placeholder="Enter discount percentage (0-100)"
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

            {/* Variants Section */}
            <div style={styles.sectionContainer}>
              <div style={styles.sectionHeader}>
                <label style={styles.sectionLabel}>Product Variants (optional)</label>
                <button
                  type="button"
                  onClick={addVariant}
                  style={styles.addButton}
                  className="add-button"
                >
                  <MdAdd style={{ marginRight: '5px' }} />
                  Add Variant
                </button>
              </div>
              
              {variants.map((variant, index) => (
                <div key={index} style={styles.variantRow}>
                  <input
                    type="text"
                    placeholder="Variant Name (e.g., Small, Large)"
                    value={variant.name}
                    onChange={(e) => updateVariant(index, 'name', e.target.value)}
                    style={{ ...styles.input, flex: 2 }}
                    className="product-input"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={variant.price}
                    onChange={(e) => updateVariant(index, 'price', e.target.value)}
                    min="0"
                    step="0.01"
                    style={{ ...styles.input, flex: 1 }}
                    className="product-input"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    style={styles.deleteButton}
                    className="delete-button"
                  >
                    <MdDelete />
                  </button>
                </div>
              ))}
              
              {variants.length === 0 && (
                <div style={styles.emptyState}>
                  No variants added. Click "Add Variant" to create size/type options.
                </div>
              )}
            </div>

            {/* Options Section */}
            <div style={styles.sectionContainer}>
              <div style={styles.sectionHeader}>
                <label style={styles.sectionLabel}>Product Options (optional)</label>
                <button
                  type="button"
                  onClick={addOptionGroup}
                  style={styles.addButton}
                  className="add-button"
                >
                  <MdAdd style={{ marginRight: '5px' }} />
                  Add Option Group
                </button>
              </div>
              
              {optionGroups.map((group, groupIndex) => (
                <div key={groupIndex} style={styles.optionGroupContainer}>
                  <div style={styles.optionGroupHeader}>
                    <input
                      type="text"
                      placeholder="Option Group Name (e.g., Sugar Level, Ice Level)"
                      value={group.groupName}
                      onChange={(e) => updateOptionGroupName(groupIndex, e.target.value)}
                      style={{ ...styles.input, flex: 1 }}
                      className="product-input"
                    />
                    <button
                      type="button"
                      onClick={() => removeOptionGroup(groupIndex)}
                      style={styles.deleteButton}
                      className="delete-button"
                    >
                      <MdDelete />
                    </button>
                  </div>
                  
                  <div style={styles.choicesContainer}>
                    {group.choices.map((choice, choiceIndex) => (
                      <div key={choiceIndex} style={styles.choiceRow}>
                        <input
                          type="text"
                          placeholder="Choice (e.g., 0%, 50%, 100%)"
                          value={choice}
                          onChange={(e) => updateChoice(groupIndex, choiceIndex, e.target.value)}
                          style={{ ...styles.input, flex: 1 }}
                          className="product-input"
                        />
                        <button
                          type="button"
                          onClick={() => removeChoice(groupIndex, choiceIndex)}
                          style={styles.deleteButtonSmall}
                          className="delete-button-small"
                        >
                          <MdDelete size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addChoice(groupIndex)}
                      style={styles.addChoiceButton}
                      className="add-choice-button"
                    >
                      <MdAdd size={16} style={{ marginRight: '3px' }} />
                      Add Choice
                    </button>
                  </div>
                </div>
              ))}
              
              {optionGroups.length === 0 && (
                <div style={styles.emptyState}>
                  No option groups added. Click "Add Option Group" to create customization options.
                </div>
              )}
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
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div style={styles.spinner}></div>
                    Creating Product...
                  </div>
                ) : (
                  'Create Product'
                )}
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
    margin: '15px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    transition: 'transform 0.3s, box-shadow 0.3s',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    padding: '20px 16px',
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
    width: '120px',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '10px',
    border: '2px solid #e5e7eb',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  placeholderImage: {
    width: '120px',
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: '10px',
    border: '2px dashed #d1d5db',
    color: '#6b7280',
    fontSize: '14px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  fileInput: {
    width: '100%',
    maxWidth: '100%',
    fontSize: '14px',
    padding: '8px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
  },
  label: {
    color: '#374151',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '0.01em',
  },
  input: {
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '15px',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s',
    color: '#1f2937',
  },
  textarea: {
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '15px',
    minHeight: '100px',
    width: '100%',
    boxSizing: 'border-box',
    resize: 'vertical',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s',
    color: '#1f2937',
    lineHeight: '1.5',
  },
  select: {
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '15px',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23374151%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '10px',
    transition: 'all 0.2s',
    color: '#1f2937',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    marginTop: '20px',
  },
  submitButton: {
    padding: '13px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    color: 'white',
    width: '100%',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)',
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
    animation: 'slideDown 0.3s ease-out',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  // Variants and Options Sections
  sectionContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: '10px',
    padding: '16px',
    marginTop: '12px',
    border: '1px solid #e5e7eb',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  sectionLabel: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1f2937',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 14px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(16, 185, 129, 0.3)',
    whiteSpace: 'nowrap',
  },
  variantRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
  deleteButton: {
    padding: '10px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '42px',
    flexShrink: 0,
  },
  deleteButtonSmall: {
    padding: '7px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '34px',
    flexShrink: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '24px 16px',
    color: '#9ca3af',
    fontSize: '13px',
    fontStyle: 'italic',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    border: '2px dashed #e5e7eb',
    lineHeight: '1.5',
  },
  optionGroupContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
    border: '1px solid #e5e7eb',
  },
  optionGroupHeader: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
  choicesContainer: {
    paddingLeft: '12px',
    borderLeft: '2px solid #e5e7eb',
  },
  choiceRow: {
    display: 'flex',
    gap: '6px',
    marginBottom: '6px',
    alignItems: 'stretch',
  },
  addChoiceButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 10px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '4px',
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
    
    .add-button:hover {
      background-color: #059669;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
    }
    
    .delete-button:hover, .delete-button-small:hover {
      background-color: #dc2626;
      transform: scale(1.05);
    }
    
    .add-choice-button:hover {
      background-color: #2563eb;
      transform: translateY(-1px);
    }
    
    .product-input:focus, .product-textarea:focus, .product-select:focus {
      border-color: #ff8c00e0;
      outline: none;
      box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.15);
      background-color: #fff;
      transform: translateY(-1px);
      transition: all 0.2s ease;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    
    .product-form {
      animation: fadeIn 0.4s ease-out;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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
    
    @media (max-width: 640px) {
      .variantRow {
        flex-direction: column;
      }
      
      .variantRow input {
        width: 100% !important;
        flex: 1 1 100% !important;
      }
      
      .variantRow button {
        width: 100%;
        max-width: 100%;
      }
      
      .optionGroupHeader {
        flex-direction: column;
      }
      
      .optionGroupHeader input {
        width: 100% !important;
        flex: 1 1 100% !important;
      }
      
      .optionGroupHeader button {
        width: 100%;
      }
      
      .sectionHeader {
        flex-direction: column;
        align-items: stretch;
      }
      
      .add-button {
        width: 100%;
      }
    }
    
    @media (min-width: 641px) {
      .variantRow input:first-child {
        flex: 2;
      }
      
      .variantRow input:nth-child(2) {
        flex: 1;
      }
      
      .optionGroupHeader input {
        flex: 1;
      }
    }
  `}</style>
);

export default AddProductPage;