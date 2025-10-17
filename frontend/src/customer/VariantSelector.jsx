import React, { useState, useEffect } from 'react';
import { MdCheck, MdCheckCircle } from 'react-icons/md';

/**
 * DEEP LOGIC: Variant Selector Component for Customers
 * 
 * This component:
 * 1. Displays all variant categories and their choices
 * 2. Validates that all required variants are selected
 * 3. Calculates price based on selections
 * 4. Returns selections in format: [{ variant: "Color", choice: "Silver Tube", image: "url" }]
 * 5. Handles both single and multiple selection variants
 * 
 * Props:
 * - product: Product object with variants
 * - onSelectionChange: Callback with (selections, isValid, calculatedPrice)
 * - initialSelections: Pre-selected choices (for editing cart items)
 */

const VariantSelector = ({ 
  product, 
  onSelectionChange, 
  initialSelections = [] 
}) => {
  const [selections, setSelections] = useState({});
  const [errors, setErrors] = useState({});

  /**
   * DEEP LOGIC: Initialize selections from initial values
   */
  useEffect(() => {
    if (initialSelections && initialSelections.length > 0) {
      const initialState = {};
      initialSelections.forEach(sel => {
        initialState[sel.variant] = sel.allowMultiple 
          ? [sel.choice] 
          : sel.choice;
      });
      setSelections(initialState);
    }
  }, [initialSelections]);

  /**
   * DEEP LOGIC: Validate and notify parent on selection change
   */
  useEffect(() => {
    validateAndNotify();
  }, [selections]);

  /**
   * DEEP LOGIC: Handle choice selection
   * 
   * For single selection: Replace current choice
   * For multiple selection: Toggle choice in array
   */
  const handleChoiceSelect = (variant, choice) => {
    const variantData = product.variants.find(v => v.name === variant.name);
    
    if (!variantData) return;

    let newSelections = { ...selections };

    if (variantData.allowMultiple) {
      // Multiple selection mode
      const currentChoices = selections[variant.name] || [];
      
      if (currentChoices.includes(choice.name)) {
        // Remove choice
        newSelections[variant.name] = currentChoices.filter(c => c !== choice.name);
        if (newSelections[variant.name].length === 0) {
          delete newSelections[variant.name];
        }
      } else {
        // Add choice
        newSelections[variant.name] = [...currentChoices, choice.name];
      }
    } else {
      // Single selection mode
      if (selections[variant.name] === choice.name) {
        // Deselect if clicking same choice (only if not required)
        if (!variantData.isRequired) {
          delete newSelections[variant.name];
        }
      } else {
        // Select new choice
        newSelections[variant.name] = choice.name;
      }
    }

    setSelections(newSelections);
  };

  /**
   * DEEP LOGIC: Check if choice is selected
   */
  const isChoiceSelected = (variantName, choiceName) => {
    const selection = selections[variantName];
    
    if (Array.isArray(selection)) {
      return selection.includes(choiceName);
    }
    
    return selection === choiceName;
  };

  /**
   * DEEP LOGIC: Validate selections and calculate price
   */
  const validateAndNotify = () => {
    const newErrors = {};
    const selectionArray = [];
    let calculatedPrice = product.basePrice;

    // Check each variant
    product.variants.forEach(variant => {
      if (variant.isRequired && !selections[variant.name]) {
        newErrors[variant.name] = `Please select ${variant.name}`;
      }

      // Build selection array
      if (selections[variant.name]) {
        if (Array.isArray(selections[variant.name])) {
          // Multiple selections
          selections[variant.name].forEach(choiceName => {
            const choice = variant.choices.find(c => c.name === choiceName);
            if (choice) {
              selectionArray.push({
                variant: variant.name,
                choice: choice.name,
                choiceId: choice._id,
                image: choice.image,
                price: choice.price,
                stock: typeof choice.stock === 'number' ? choice.stock : undefined,
                isAvailable: typeof choice.isAvailable === 'boolean' ? choice.isAvailable : undefined,
              });
              
              // Add to price (for multiple selections, add each)
              if (choice.priceAdjustment) {
                calculatedPrice += choice.priceAdjustment;
              }
            }
          });
        } else {
          // Single selection
          const choice = variant.choices.find(c => c.name === selections[variant.name]);
          if (choice) {
            selectionArray.push({
              variant: variant.name,
              choice: choice.name,
              choiceId: choice._id,
              image: choice.image,
              price: choice.price,
              stock: typeof choice.stock === 'number' ? choice.stock : undefined,
              isAvailable: typeof choice.isAvailable === 'boolean' ? choice.isAvailable : undefined,
            });
            
            // For single selection, use choice price as final price
            calculatedPrice = choice.price;
          }
        }
      }
    });

    setErrors(newErrors);

    // Notify parent
    const isValid = Object.keys(newErrors).length === 0;
    onSelectionChange(selectionArray, isValid, calculatedPrice);
  };

  /**
   * DEEP LOGIC: Get choice availability status
   */
  const getChoiceStatus = (choice) => {
    if (!choice.isAvailable || choice.stock === 0) {
      return { available: false, message: 'Out of stock' };
    }
    if (choice.stock <= 5) {
      return { available: true, message: `Only ${choice.stock} left`, warning: true };
    }
    return { available: true, message: `${choice.stock} available` };
  };

  if (!product.variants || product.variants.length === 0) {
    return null;
  }

  return (
    <div style={styles.container}>
      {product.variants.map((variant, index) => (
        <div key={variant._id || index} style={styles.variantSection}>
          {/* Variant Header */}
          <div style={styles.variantHeader}>
            <h4 style={styles.variantName}>
              {variant.name}
              {variant.isRequired && <span style={styles.required}>*</span>}
            </h4>
            {variant.allowMultiple && (
              <span style={styles.multipleTag}>Multiple selection</span>
            )}
          </div>

          {/* Error Message */}
          {errors[variant.name] && (
            <div style={styles.error}>{errors[variant.name]}</div>
          )}

          {/* Choices Grid */}
          <div style={styles.choicesGrid}>
            {variant.choices.map((choice, choiceIndex) => {
              const status = getChoiceStatus(choice);
              const isSelected = isChoiceSelected(variant.name, choice.name);
              const isDisabled = !status.available;

              return (
                <button
                  key={choice._id || choiceIndex}
                  onClick={() => !isDisabled && handleChoiceSelect(variant, choice)}
                  disabled={isDisabled}
                  style={{
                    ...styles.choiceCard,
                    ...(isSelected ? styles.choiceCardSelected : {}),
                    ...(isDisabled ? styles.choiceCardDisabled : {}),
                  }}
                >
                  {/* Choice Image */}
                  {choice.image && (
                    <div style={styles.choiceImageContainer}>
                      <img
                        src={choice.image}
                        alt={choice.name}
                        style={styles.choiceImage}
                      />
                      {isSelected && (
                        <div style={styles.selectedBadge}>
                          <MdCheck size={16} color="white" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Choice Info */}
                  <div style={styles.choiceInfo}>
                    <div style={styles.choiceName}>{choice.name}</div>
                    <div style={styles.choicePrice}>₱{choice.price.toFixed(2)}</div>
                    
                    {/* Stock Status */}
                    {!status.available && (
                      <div style={styles.outOfStock}>{status.message}</div>
                    )}
                    {status.available && status.warning && (
                      <div style={styles.lowStock}>{status.message}</div>
                    )}
                  </div>

                  {/* Selection Indicator (for choices without images) */}
                  {!choice.image && isSelected && (
                    <div style={styles.checkIcon}>
                      <MdCheckCircle size={20} color="#10b981" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Helper Text */}
      {product.variants.some(v => v.isRequired) && (
        <div style={styles.helperText}>
          * Required selections
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  variantSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  variantHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  variantName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  required: {
    color: '#ef4444',
    marginLeft: '4px',
  },
  multipleTag: {
    fontSize: '12px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  error: {
    fontSize: '13px',
    color: '#ef4444',
    backgroundColor: '#fee2e2',
    padding: '8px 12px',
    borderRadius: '6px',
  },
  choicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '12px',
  },
  choiceCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#ffffff',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
    textAlign: 'center',
  },
  choiceCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)',
  },
  choiceCardDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: '#f9fafb',
  },
  choiceImageContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: '8px',
  },
  choiceImage: {
    width: '100%',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '6px',
  },
  selectedBadge: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '24px',
    height: '24px',
    backgroundColor: '#10b981',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  choiceInfo: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  choiceName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  choicePrice: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#f97316',
  },
  outOfStock: {
    fontSize: '12px',
    color: '#ef4444',
    fontWeight: '500',
  },
  lowStock: {
    fontSize: '12px',
    color: '#f59e0b',
    fontWeight: '500',
  },
  checkIcon: {
    position: 'absolute',
    top: '8px',
    right: '8px',
  },
  helperText: {
    fontSize: '13px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
};

export default VariantSelector;
