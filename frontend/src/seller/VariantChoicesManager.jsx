import React, { useState } from 'react';
import { MdAdd, MdDelete, MdEdit, MdSave, MdClose, MdImage, MdExpandMore, MdExpandLess } from 'react-icons/md';
import api, { API_BASE_URL } from '../api';

/**
 * DEEP LOGIC: Variant Choices Manager Component
 * 
 * This component allows sellers to:
 * 1. Add variant categories (e.g., "Color", "Size")
 * 2. Add choices to each category (e.g., "Red", "Blue")
 * 3. Set price, stock, and image for each choice
 * 4. Mark categories as required or optional
 * 5. Allow multiple selections per category
 * 
 * Data Structure:
 * variants: [
 *   {
 *     name: "Color",
 *     isRequired: true,
 *     allowMultiple: false,
 *     choices: [
 *       { name: "3in1 Mascara", image: "url", price: 119, stock: 20 }
 *     ]
 *   }
 * ]
 */

const VariantChoicesManager = ({ variants = [], onChange }) => {
  const [expandedVariants, setExpandedVariants] = useState({});
  const [editingChoice, setEditingChoice] = useState(null);
  const API_ORIGIN = (API_BASE_URL || '').replace(/\/api$/, '');

  /**
   * DEEP LOGIC: Add new variant category
   */
  const addVariantCategory = () => {
    const newVariant = {
      _id: `temp-${Date.now()}`,
      name: '',
      isRequired: true,
      allowMultiple: false,
      choices: [],
    };
    
    onChange([...variants, newVariant]);
    setExpandedVariants({ ...expandedVariants, [newVariant._id]: true });
  };

  /**
   * DEEP LOGIC: Update variant category
   */
  const updateVariantCategory = (variantId, field, value) => {
    const updated = variants.map(v => 
      v._id === variantId ? { ...v, [field]: value } : v
    );
    onChange(updated);
  };

  /**
   * DEEP LOGIC: Remove variant category
   * 
   * Warning: This will remove all choices in this category
   */
  const removeVariantCategory = (variantId) => {
    const variant = variants.find(v => v._id === variantId);
    const choiceCount = variant?.choices?.length || 0;
    
    const message = choiceCount > 0
      ? `Remove "${variant.name}" category and all ${choiceCount} choices?`
      : `Remove "${variant.name}" category?`;
    
    if (window.confirm(message)) {
      onChange(variants.filter(v => v._id !== variantId));
    }
  };

  /**
   * DEEP LOGIC: Add choice to variant category
   */
  const addChoice = (variantId) => {
    const updated = variants.map(v => {
      if (v._id === variantId) {
        const newChoice = {
          _id: `temp-choice-${Date.now()}`,
          name: '',
          image: '',
          price: 0,
          priceAdjustment: 0,
          stock: 0,
          sku: '',
          isAvailable: true,
        };
        return {
          ...v,
          choices: [...(v.choices || []), newChoice],
        };
      }
      return v;
    });
    
    onChange(updated);
  };

  /**
   * DEEP LOGIC: Update choice
   */
  const updateChoice = (variantId, choiceId, field, value) => {
    const updated = variants.map(v => {
      if (v._id === variantId) {
        return {
          ...v,
          choices: v.choices.map(c => 
            c._id === choiceId ? { ...c, [field]: value } : c
          ),
        };
      }
      return v;
    });
    
    onChange(updated);
  };

  /**
   * DEEP LOGIC: Remove choice
   */
  const removeChoice = (variantId, choiceId) => {
    const variant = variants.find(v => v._id === variantId);
    const choice = variant?.choices?.find(c => c._id === choiceId);
    
    if (window.confirm(`Remove "${choice?.name || 'this choice'}"?`)) {
      const updated = variants.map(v => {
        if (v._id === variantId) {
          return {
            ...v,
            choices: v.choices.filter(c => c._id !== choiceId),
          };
        }
        return v;
      });
      
      onChange(updated);
    }
  };

  /**
   * DEEP LOGIC: Handle image upload
   */
  const handleImageUpload = async (variantId, choiceId, file) => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/upload/image', formData);
      if (data?.success && data.imageUrl) {
        updateChoice(variantId, choiceId, 'image', data.imageUrl);
      } else {
        throw new Error(data?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image');
    }
  };

  /**
   * DEEP LOGIC: Toggle variant expansion
   */
  const toggleVariant = (variantId) => {
    setExpandedVariants({
      ...expandedVariants,
      [variantId]: !expandedVariants[variantId],
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Product Variants & Choices</h3>
        <button onClick={addVariantCategory} style={styles.addCategoryButton}>
          <MdAdd size={20} />
          Add Variant Category
        </button>
      </div>

      {variants.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No variant categories yet.</p>
          <p style={styles.emptyHint}>
            Add categories like "Size", "Color", or "Flavor" to give customers options.
          </p>
        </div>
      ) : (
        <div style={styles.variantsList}>
          {variants.map((variant, variantIndex) => (
            <div key={variant._id} style={styles.variantCard}>
              {/* Variant Category Header */}
              <div style={styles.variantHeader}>
                <div style={styles.variantHeaderLeft}>
                  <button
                    onClick={() => toggleVariant(variant._id)}
                    style={styles.expandButton}
                  >
                    {expandedVariants[variant._id] ? (
                      <MdExpandLess size={24} />
                    ) : (
                      <MdExpandMore size={24} />
                    )}
                  </button>
                  
                  <input
                    type="text"
                    value={variant.name}
                    onChange={(e) => updateVariantCategory(variant._id, 'name', e.target.value)}
                    placeholder="Category name (e.g., Color, Size)"
                    style={styles.variantNameInput}
                  />
                  
                  <span style={styles.choiceCount}>
                    {variant.choices?.length || 0} choices
                  </span>
                </div>

                <button
                  onClick={() => removeVariantCategory(variant._id)}
                  style={styles.deleteIconButton}
                  title="Remove category"
                >
                  <MdDelete size={20} />
                </button>
              </div>

              {/* Variant Options */}
              {expandedVariants[variant._id] && (
                <>
                  <div style={styles.variantOptions}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={variant.isRequired}
                        onChange={(e) => updateVariantCategory(variant._id, 'isRequired', e.target.checked)}
                      />
                      <span>Required (customer must select)</span>
                    </label>

                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={variant.allowMultiple}
                        onChange={(e) => updateVariantCategory(variant._id, 'allowMultiple', e.target.checked)}
                      />
                      <span>Allow multiple selections</span>
                    </label>
                  </div>

                  {/* Choices List */}
                  <div style={styles.choicesSection}>
                    <div style={styles.choicesHeader}>
                      <span style={styles.choicesTitle}>Choices</span>
                      <button
                        onClick={() => addChoice(variant._id)}
                        style={styles.addChoiceButton}
                      >
                        <MdAdd size={18} />
                        Add Choice
                      </button>
                    </div>

                    {variant.choices && variant.choices.length > 0 ? (
                      <div style={styles.choicesList}>
                        {variant.choices.map((choice, choiceIndex) => (
                          <div key={choice._id} style={styles.choiceCard}>
                            {/* Choice Image */}
                            <div style={styles.choiceImageSection}>
                              {choice.image ? (
                                <img
                                  src={choice.image}
                                  alt={choice.name}
                                  style={styles.choiceImage}
                                />
                              ) : (
                                <div style={styles.choiceImagePlaceholder}>
                                  <MdImage size={32} />
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(variant._id, choice._id, e.target.files[0])}
                                style={styles.fileInput}
                                id={`image-${variant._id}-${choice._id}`}
                              />
                              <label
                                htmlFor={`image-${variant._id}-${choice._id}`}
                                style={styles.uploadButton}
                              >
                                Upload
                              </label>
                            </div>

                            {/* Choice Details */}
                            <div style={styles.choiceDetails}>
                              <div style={styles.choiceRow}>
                                <div style={styles.choiceField}>
                                  <label style={styles.fieldLabel}>Choice Name *</label>
                                  <input
                                    type="text"
                                    value={choice.name}
                                    onChange={(e) => updateChoice(variant._id, choice._id, 'name', e.target.value)}
                                    placeholder="e.g., 3in1 Mascara, Silver Tube"
                                    style={styles.fieldInput}
                                  />
                                </div>

                                <div style={styles.choiceField}>
                                  <label style={styles.fieldLabel}>Price *</label>
                                  <input
                                    type="number"
                                    value={choice.price}
                                    onChange={(e) => updateChoice(variant._id, choice._id, 'price', parseFloat(e.target.value) || 0)}
                                    min="0"
                                    step="0.01"
                                    style={styles.fieldInput}
                                  />
                                </div>
                              </div>

                              <div style={styles.choiceRow}>
                                <div style={styles.choiceField}>
                                  <label style={styles.fieldLabel}>Stock *</label>
                                  <input
                                    type="number"
                                    value={choice.stock}
                                    onChange={(e) => updateChoice(variant._id, choice._id, 'stock', parseInt(e.target.value) || 0)}
                                    min="0"
                                    style={styles.fieldInput}
                                  />
                                </div>

                                <div style={styles.choiceField}>
                                  <label style={styles.fieldLabel}>SKU</label>
                                  <input
                                    type="text"
                                    value={choice.sku}
                                    onChange={(e) => updateChoice(variant._id, choice._id, 'sku', e.target.value)}
                                    placeholder="Optional"
                                    style={styles.fieldInput}
                                  />
                                </div>
                              </div>

                              <div style={styles.choiceRow}>
                                <label style={styles.checkboxLabel}>
                                  <input
                                    type="checkbox"
                                    checked={choice.isAvailable}
                                    onChange={(e) => updateChoice(variant._id, choice._id, 'isAvailable', e.target.checked)}
                                  />
                                  <span>Available for purchase</span>
                                </label>
                              </div>
                            </div>

                            {/* Remove Choice Button */}
                            <button
                              onClick={() => removeChoice(variant._id, choice._id)}
                              style={styles.removeChoiceButton}
                              title="Remove choice"
                            >
                              <MdDelete size={20} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={styles.noChoices}>
                        No choices yet. Click "Add Choice" to create options.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Helper Text */}
      <div style={styles.helperText}>
        <p><strong>💡 Tips:</strong></p>
        <ul>
          <li>Create categories like "Size", "Color", or "Flavor"</li>
          <li>Add choices with individual prices and stock</li>
          <li>Upload images for each choice to help customers decide</li>
          <li>Mark categories as required if customers must choose</li>
        </ul>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  addCategoryButton: {
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
    transition: 'all 0.2s',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '2px dashed #e5e7eb',
  },
  emptyHint: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '8px',
  },
  variantsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  variantCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  variantHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  variantHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  expandButton: {
    padding: '4px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
  },
  variantNameInput: {
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    minWidth: '200px',
  },
  choiceCount: {
    fontSize: '13px',
    color: '#6b7280',
    backgroundColor: '#e5e7eb',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  deleteIconButton: {
    padding: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#ef4444',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
  variantOptions: {
    display: 'flex',
    gap: '20px',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f3f4f6',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
  },
  choicesSection: {
    padding: '16px',
  },
  choicesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  choicesTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#374151',
  },
  addChoiceButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  choicesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  choiceCard: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    position: 'relative',
  },
  choiceImageSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  choiceImage: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '6px',
    border: '2px solid #e5e7eb',
  },
  choiceImagePlaceholder: {
    width: '80px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    border: '2px dashed #d1d5db',
    color: '#9ca3af',
  },
  fileInput: {
    display: 'none',
  },
  uploadButton: {
    padding: '4px 10px',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
  },
  choiceDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  choiceRow: {
    display: 'flex',
    gap: '10px',
  },
  choiceField: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
  },
  fieldInput: {
    padding: '8px 10px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  removeChoiceButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '6px',
    border: 'none',
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  noChoices: {
    textAlign: 'center',
    padding: '20px',
    color: '#9ca3af',
    fontSize: '14px',
    fontStyle: 'italic',
  },
  helperText: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    border: '1px solid #bfdbfe',
    fontSize: '13px',
    color: '#1e40af',
  },
};

export default VariantChoicesManager;
