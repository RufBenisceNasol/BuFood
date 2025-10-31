import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { product as productAPI } from '../api';
import http from '../api/http';
import { MdArrowBack, MdAdd, MdDelete, MdEdit, MdSave, MdClose, MdImage } from 'react-icons/md';

const ManageVariantsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await productAPI.getProductById(productId);
      setProduct(data);
      setVariants(data.variants || []);
    } catch (err) {
      setError('Failed to load product');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateVariantId = (name) => {
    return name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36).substr(-4);
  };

  const addVariant = () => {
    const newVariant = {
      id: generateVariantId('new-variant'),
      name: '',
      price: product?.price || 0,
      image: '',
      stock: 0,
      sku: '',
      isAvailable: true,
      isNew: true,
    };
    setVariants([...variants, newVariant]);
    setEditingIndex(variants.length);
  };

  const updateVariant = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    
    // Auto-generate ID when name changes
    if (field === 'name' && value) {
      updated[index].id = generateVariantId(value);
    }
    
    setVariants(updated);
  };

  const removeVariant = (index) => {
    if (window.confirm('Are you sure you want to remove this variant?')) {
      setVariants(variants.filter((_, i) => i !== index));
      if (editingIndex === index) setEditingIndex(null);
    }
  };

  const handleImageUpload = async (index, file) => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Upload to Cloudinary via your backend using axios http (auth auto-attached)
      const { data } = await http.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (data.success) {
        updateVariant(index, 'image', data.imageUrl);
        setSuccess('Image uploaded successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to upload image');
      console.error(err);
    }
  };

  const saveVariants = async () => {
    try {
      setSaving(true);
      setError('');

      // Validate variants
      const invalidVariants = variants.filter(v => !v.name || v.price < 0);
      if (invalidVariants.length > 0) {
        setError('All variants must have a name and valid price');
        return;
      }

      // Update product with new variants
      await productAPI.updateProduct(productId, { variants });

      setSuccess('Variants saved successfully!');
      setEditingIndex(null);
      setTimeout(() => {
        navigate(`/seller/product-list`);
      }, 2000);
    } catch (err) {
      setError('Failed to save variants');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Product not found</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <MdArrowBack size={24} />
        </button>
        <div>
          <h1 style={styles.title}>Manage Variants</h1>
          <p style={styles.subtitle}>{product.name}</p>
        </div>
      </div>

      {/* Messages */}
      {error && <div style={styles.errorMessage}>{error}</div>}
      {success && <div style={styles.successMessage}>{success}</div>}

      {/* Product Info */}
      <div style={styles.productInfo}>
        <img src={product.image} alt={product.name} style={styles.productImage} />
        <div>
          <h3 style={styles.productName}>{product.name}</h3>
          <p style={styles.basePrice}>Base Price: ₱{product.price}</p>
        </div>
      </div>

      {/* Variants List */}
      <div style={styles.variantsContainer}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Product Variants</h2>
          <button onClick={addVariant} style={styles.addButton}>
            <MdAdd size={20} />
            Add Variant
          </button>
        </div>

        {variants.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No variants yet. Click "Add Variant" to create different options for this product.</p>
          </div>
        ) : (
          <div style={styles.variantsList}>
            {variants.map((variant, index) => (
              <div key={variant.id || index} style={styles.variantCard}>
                {editingIndex === index ? (
                  // Edit Mode
                  <div style={styles.editMode}>
                    <div style={styles.variantImageSection}>
                      {variant.image ? (
                        <img src={variant.image} alt={variant.name} style={styles.variantImage} />
                      ) : (
                        <div style={styles.imagePlaceholder}>
                          <MdImage size={40} />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(index, e.target.files[0])}
                        style={styles.fileInput}
                        id={`image-${index}`}
                      />
                      <label htmlFor={`image-${index}`} style={styles.uploadLabel}>
                        Upload Image
                      </label>
                    </div>

                    <div style={styles.variantFields}>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Variant Name *</label>
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => updateVariant(index, 'name', e.target.value)}
                          placeholder="e.g., Black, Large, Spicy"
                          style={styles.input}
                        />
                      </div>

                      <div style={styles.inputRow}>
                        <div style={styles.inputGroup}>
                          <label style={styles.label}>Price *</label>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value))}
                            min="0"
                            step="0.01"
                            style={styles.input}
                          />
                        </div>

                        <div style={styles.inputGroup}>
                          <label style={styles.label}>Stock</label>
                          <input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value))}
                            min="0"
                            style={styles.input}
                          />
                        </div>
                      </div>

                      <div style={styles.inputGroup}>
                        <label style={styles.label}>SKU (Optional)</label>
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                          placeholder="Stock Keeping Unit"
                          style={styles.input}
                        />
                      </div>

                      <div style={styles.checkboxGroup}>
                        <input
                          type="checkbox"
                          checked={variant.isAvailable}
                          onChange={(e) => updateVariant(index, 'isAvailable', e.target.checked)}
                          id={`available-${index}`}
                        />
                        <label htmlFor={`available-${index}`} style={styles.checkboxLabel}>
                          Available for purchase
                        </label>
                      </div>
                    </div>

                    <div style={styles.editActions}>
                      <button onClick={() => setEditingIndex(null)} style={styles.saveButton}>
                        <MdSave size={18} />
                        Done
                      </button>
                      <button onClick={() => removeVariant(index)} style={styles.deleteButton}>
                        <MdDelete size={18} />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div style={styles.viewMode}>
                    <div style={styles.variantImageSection}>
                      {variant.image ? (
                        <img src={variant.image} alt={variant.name} style={styles.variantImage} />
                      ) : (
                        <div style={styles.imagePlaceholder}>
                          <MdImage size={40} />
                        </div>
                      )}
                    </div>

                    <div style={styles.variantInfo}>
                      <h3 style={styles.variantName}>{variant.name || 'Unnamed Variant'}</h3>
                      <p style={styles.variantPrice}>₱{variant.price}</p>
                      <p style={styles.variantStock}>
                        Stock: {variant.stock} | {variant.isAvailable ? '✓ Available' : '✗ Unavailable'}
                      </p>
                      {variant.sku && <p style={styles.variantSku}>SKU: {variant.sku}</p>}
                    </div>

                    <button onClick={() => setEditingIndex(index)} style={styles.editButton}>
                      <MdEdit size={20} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div style={styles.footer}>
        <button
          onClick={saveVariants}
          disabled={saving || variants.length === 0}
          style={{
            ...styles.saveAllButton,
            opacity: saving || variants.length === 0 ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save All Variants'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f7f8fa',
    paddingBottom: '80px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '20px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
  },
  backButton: {
    padding: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    margin: 0,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '4px 0 0 0',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#6b7280',
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#ef4444',
  },
  errorMessage: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px 20px',
    margin: '15px',
    borderRadius: '8px',
    fontSize: '14px',
  },
  successMessage: {
    backgroundColor: '#d1fae5',
    color: '#059669',
    padding: '12px 20px',
    margin: '15px',
    borderRadius: '8px',
    fontSize: '14px',
  },
  productInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '20px',
    backgroundColor: 'white',
    margin: '15px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  productImage: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  productName: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#1f2937',
  },
  basePrice: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  variantsContainer: {
    margin: '15px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '2px dashed #e5e7eb',
    color: '#6b7280',
  },
  variantsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  variantCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  editMode: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  viewMode: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  variantImageSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  variantImage: {
    width: '120px',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
  },
  imagePlaceholder: {
    width: '120px',
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    border: '2px dashed #d1d5db',
    color: '#9ca3af',
  },
  fileInput: {
    display: 'none',
  },
  uploadLabel: {
    padding: '6px 12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    textAlign: 'center',
  },
  variantFields: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  inputRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#1f2937',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  checkboxLabel: {
    fontSize: '14px',
    color: '#374151',
  },
  editActions: {
    display: 'flex',
    gap: '10px',
  },
  saveButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  deleteButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  variantInfo: {
    flex: 1,
  },
  variantName: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#1f2937',
  },
  variantPrice: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#f97316',
    margin: '0 0 6px 0',
  },
  variantStock: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 4px 0',
  },
  variantSku: {
    fontSize: '13px',
    color: '#9ca3af',
    margin: 0,
  },
  editButton: {
    padding: '10px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#374151',
  },
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '15px',
    backgroundColor: 'white',
    borderTop: '1px solid #e5e7eb',
  },
  saveAllButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default ManageVariantsPage;
