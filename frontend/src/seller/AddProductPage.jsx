import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { product, API_BASE_URL } from '../api';
import http from '../api/http';
import { MdArrowBack, MdAdd, MdDelete, MdImage } from 'react-icons/md';
import { getToken } from '../utils/tokenUtils';

const AddProductPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Derive origin from axios base; if base is '/api' in dev, origin becomes '' so fetch uses Vite proxy
  const API_ORIGIN = (API_BASE_URL || '').replace(/\/api$/, '');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    category: '',
    availability: 'Available',
    estimatedTime: '',
    shippingFee: '0',
    stock: '0'
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  // Multiple images for product
  const [images, setImages] = useState([]); // array of Cloudinary URLs
  const [uploadingImages, setUploadingImages] = useState(false);
  // Variants state - array of { variantName, options: [{ optionName, price, stock, image }] }
  const [variants, setVariants] = useState([]);
  // For inline option image upload loading states
  const [uploadingOption, setUploadingOption] = useState({});

  // Predefined categories
  const categories = ['Drinks', 'Meals', 'Snacks', 'Desserts', 'Appetizers', 'Main Course', 'Beverages', 'Breakfast', 'Lunch', 'Dinner', 'Other'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Variant category handlers
  const addVariant = () => {
    setVariants(prev => ([
      ...prev,
      { variantName: '', options: [] }
    ]));
  };

  const removeVariant = (index) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariantName = (index, value) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, variantName: value } : v));
  };

  // Option handlers inside a variant
  const addOption = (variantIdx) => {
    setVariants(prev => prev.map((v, i) => {
      if (i !== variantIdx) return v;
      return {
        ...v,
        options: [...(v.options || []), { optionName: '', price: '', stock: '', image: '' }]
      };
    }));
  };

  const removeOption = (variantIdx, optionIdx) => {
    setVariants(prev => prev.map((v, i) => {
      if (i !== variantIdx) return v;
      return { ...v, options: v.options.filter((_, oi) => oi !== optionIdx) };
    }));
  };

  const updateOptionField = (variantIdx, optionIdx, field, value) => {
    setVariants(prev => prev.map((v, i) => {
      if (i !== variantIdx) return v;
      const newOptions = v.options.map((o, oi) => oi === optionIdx ? { ...o, [field]: value } : o);
      return { ...v, options: newOptions };
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Upload a single file to backend /api/upload/image (Supabase-protected)
  const uploadOneImage = async (file) => {
    const form = new FormData();
    form.append('image', file);
    const res = await http.post('/upload/image', form);
    return res.data; // expect { success, imageUrl }
  };

  // Handle multiple images selection and upload sequentially (or small parallel batches)
  const handleMultipleImagesSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError('');
    setUploadingImages(true);
    try {
      const uploaded = [];
      for (const f of files) {
        const url = await uploadOneImage(f);
        uploaded.push(url);
      }
      setImages(prev => [...prev, ...uploaded]);
    } catch (err) {
      setError(err.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
      // Reset input value so same file can be re-selected if desired
      e.target.value = '';
    }
  };

  const removeImageAt = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  // Upload a single option image: prefer client-side Cloudinary unsigned upload; fallback to server upload
  const handleOptionImageUpload = async (variantIdx, optionIdx, file) => {
    if (!file) return;
    const key = `${variantIdx}-${optionIdx}`;
    try {
      setUploadingOption(prev => ({ ...prev, [key]: true }));

      const cloudName = import.meta?.env?.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta?.env?.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (cloudName && uploadPreset) {
        // Client-side unsigned upload to Cloudinary
        const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        const fd = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', uploadPreset);
        const up = await fetch(url, { method: 'POST', body: fd });
        const body = await up.json();
        if (up.ok && body?.secure_url) {
          updateOptionField(variantIdx, optionIdx, 'image', body.secure_url);
          return;
        }
        setError(body?.error?.message || 'Failed to upload image to Cloudinary');
        return;
      }

      // Fallback to server upload (Supabase-protected)
      const form = new FormData();
      form.append('image', file);
      const res = await http.post('/upload/image', form);
      if (res.data?.success && res.data.imageUrl) {
        updateOptionField(variantIdx, optionIdx, 'image', res.data.imageUrl);
      } else {
        setError(res.data?.message || 'Failed to upload option image');
      }
    } catch (err) {
      setError('Failed to upload option image');
    } finally {
      setUploadingOption(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const submitData = new FormData();
      // Map fields: basePrice -> price (backend expects price)
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('price', formData.basePrice);
      submitData.append('category', formData.category);
      submitData.append('availability', formData.availability);
      submitData.append('estimatedTime', formData.estimatedTime);
      submitData.append('shippingFee', formData.shippingFee);
      submitData.append('stock', formData.stock);
      if (images.length > 0) {
        submitData.append('images', JSON.stringify(images));
      }
      
      // Validate main fields
      if (!formData.name || !formData.description || !formData.basePrice || !formData.category) {
        throw new Error('Please complete all required fields.');
      }

      // Validate variants/options and format to desired schema (variantChoices)
      const formattedVariants = (variants || [])
        .filter(v => v.variantName && (v.options || []).length > 0)
        .map(v => ({
          variantName: v.variantName,
          options: (v.options || [])
            .filter(o => o.optionName && o.price !== '' && o.stock !== '')
            .map(o => ({
              optionName: o.optionName,
              price: Number(o.price),
              stock: Number(o.stock),
              image: o.image || ''
            }))
        }))
        .filter(v => v.options.length > 0);

      if (formattedVariants.length > 0) {
        submitData.append('variantChoices', JSON.stringify(formattedVariants));
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
        basePrice: '',
        category: '',
        availability: 'Available',
        estimatedTime: '',
        shippingFee: '0',
        stock: '0'
      });
      setVariants([]);
      setSelectedImage(null);
      setPreviewUrl('');
      setImages([]);
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
              <label htmlFor="basePrice" style={styles.label}>Base Price:</label>
              <input
                type="number"
                id="basePrice"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                style={styles.input}
                className="product-input"
                placeholder="Enter base price"
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

            {/* Variants Section (Categories + Options) */}
            <div style={styles.sectionContainer}>
              <div style={styles.sectionHeader}>
                <label style={styles.sectionLabel}>Product Variants & Options</label>
                <button
                  type="button"
                  onClick={addVariant}
                  style={styles.addButton}
                  className="add-button"
                >
                  <MdAdd style={{ marginRight: '5px' }} />
                  Add Variant Category
                </button>
              </div>
              {variants.length === 0 && (
                <div style={styles.emptyState}>No variant categories yet. Click "Add Variant Category".</div>
              )}

              {variants.map((variant, vIdx) => (
                <div key={vIdx} style={{ ...styles.optionGroupContainer, marginTop: 8 }}>
                  <div style={styles.optionGroupHeader}>
                    <input
                      type="text"
                      placeholder="V Category (e.g., Size, Flavor, Color)"
                      value={variant.variantName}
                      onChange={(e) => updateVariantName(vIdx, e.target.value)}
                      style={{ ...styles.input, flex: 1 }}
                      className="product-input"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(vIdx)}
                      style={styles.deleteButton}
                      className="delete-button"
                    >
                      <MdDelete />
                    </button>
                  </div>

                  {/* Options inside this variant */}
                  <div style={styles.choicesContainer}>
                    {(variant.options || []).map((opt, oIdx) => {
                      const loadingKey = `${vIdx}-${oIdx}`;
                      return (
                        <div key={oIdx} style={styles.choiceRow} className="choice-row">
                          {/* Option image preview & uploader */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            {opt.image ? (
                              <img src={opt.image} alt={opt.optionName || 'option'} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                            ) : (
                              <div style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', border: '1px dashed #d1d5db', borderRadius: 8, color: '#9ca3af' }}>
                                <MdImage />
                              </div>
                            )}
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', cursor: 'pointer', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 6, padding: '4px 8px' }}>
                              {uploadingOption[loadingKey] ? 'Uploading...' : 'Upload'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleOptionImageUpload(vIdx, oIdx, e.target.files?.[0])}
                                style={{ display: 'none' }}
                              />
                            </label>
                          </div>

                          <input
                            type="text"
                            placeholder="Option Name (e.g., Small, Large, Chocolate)"
                            value={opt.optionName}
                            onChange={(e) => updateOptionField(vIdx, oIdx, 'optionName', e.target.value)}
                            style={{ ...styles.input, flex: 2 }}
                            className="product-input"
                          />
                          <input
                            type="number"
                            placeholder="Price (override or add-on)"
                            value={opt.price}
                            onChange={(e) => updateOptionField(vIdx, oIdx, 'price', e.target.value)}
                            min="0"
                            step="0.01"
                            style={{ ...styles.input, flex: 1 }}
                            className="product-input"
                          />
                          <input
                            type="number"
                            placeholder="Stock"
                            value={opt.stock}
                            onChange={(e) => updateOptionField(vIdx, oIdx, 'stock', e.target.value)}
                            min="0"
                            style={{ ...styles.input, flex: 1 }}
                            className="product-input"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(vIdx, oIdx)}
                            style={styles.deleteButtonSmall}
                            className="delete-button-small"
                          >
                            <MdDelete size={16} />
                          </button>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => addOption(vIdx)}
                      style={styles.addChoiceButton}
                      className="add-choice-button"
                    >
                      <MdAdd size={16} style={{ marginRight: '3px' }} />
                      Add Option
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Product Images (Multiple uploads) */}
            <div style={{ ...styles.sectionContainer, background: '#fff' }}>
              <div style={styles.sectionHeader}>
                <label style={styles.sectionLabel}>Product Images</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="file" accept="image/*" multiple onChange={handleMultipleImagesSelect} />
                  {uploadingImages && <span style={{ fontSize: 12, color: '#6b7280' }}>Uploading...</span>}
                </div>
              </div>
              {images.length === 0 ? (
                <div style={styles.emptyState}>No images yet. Upload one or more images.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                  {images.map((url, idx) => (
                    <div key={idx} style={{ position: 'relative', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                      <img src={url} alt={`product-${idx}`} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                      <button type="button" onClick={() => removeImageAt(idx)} style={{ position: 'absolute', top: 6, right: 6, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 6px', cursor: 'pointer', fontSize: 12 }}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Real-time Preview */}
            <div style={{ ...styles.sectionContainer, background: '#fff' }}>
              <div style={styles.sectionHeader}>
                <label style={styles.sectionLabel}>Preview</label>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 10, border: '2px solid #e5e7eb' }} />
                  ) : (
                    <div style={{ width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: '2px dashed #d1d5db', color: '#9ca3af' }}>No image</div>
                  )}
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{formData.name || 'Product Name'}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{formData.category || 'Category'}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f97316' }}>{formData.basePrice ? `₱${Number(formData.basePrice).toFixed(2)}` : '₱0.00'}</div>
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  {(variants || []).map((v, idx) => (
                    <div key={idx} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{v.variantName || 'Variant'}</div>
                      {(v.options || []).length === 0 ? (
                        <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>No options yet</div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                          {v.options.map((o, oi) => (
                            <div key={oi} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, background: '#f9fafb' }}>
                              {o.image ? (
                                <img src={o.image} alt={o.optionName || 'opt'} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6, marginBottom: 6 }} />
                              ) : (
                                <div style={{ width: '100%', height: 80, background: '#fff', border: '1px dashed #d1d5db', borderRadius: 6, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>No image</div>
                              )}
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{o.optionName || 'Option'}</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#f97316' }}>{o.price ? `₱${Number(o.price).toFixed(2)}` : '₱0.00'}</div>
                              <div style={{ fontSize: 12, color: '#6b7280' }}>Stock: {o.stock || 0}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
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
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '14px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
  },
  optionGroupHeader: {
    display: 'flex',
    gap: '10px',
    marginBottom: '12px',
    alignItems: 'stretch',
    flexWrap: 'wrap'
  },
  choicesContainer: {
    paddingLeft: '10px'
  },
  choiceRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
    alignItems: 'stretch',
    flexWrap: 'wrap',
    background: '#fafafa',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '10px'
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
      
      .choice-row {
        flex-direction: column;
        align-items: stretch;
      }

      .choice-row input {
        width: 100% !important;
      }

      .delete-button-small {
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

      .choice-row input {
        flex: 1;
      }
    }
  `}</style>
);

export default AddProductPage;