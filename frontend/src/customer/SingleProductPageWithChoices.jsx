import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdFavorite, MdFavoriteBorder, MdShoppingCart, MdAdd, MdRemove } from 'react-icons/md';
import VariantSelector from './VariantSelector';
import { cart as cartAPI, product as productAPI, customer as customerAPI } from '../api';

/**
 * DEEP LOGIC: Single Product Page with Variant Choices
 * 
 * Flow:
 * 1. Load product with variants
 * 2. Customer selects variant choices
 * 3. Validate all required variants are selected
 * 4. Calculate price based on selections
 * 5. Add to cart with complete variant selections
 * 6. Handle favorites with variant selections
 */

const SingleProductPageWithChoices = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [variantSelections, setVariantSelections] = useState([]);
  const [isSelectionsValid, setIsSelectionsValid] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProduct();
    checkFavoriteStatus();
  }, [productId]);

  /**
   * DEEP LOGIC: Fetch product with variants
   */
  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await productAPI.getProductById(productId);
      if (data) {
        setProduct(data);
        setCalculatedPrice(data.basePrice || data.price || 0);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError('Failed to load product');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * DEEP LOGIC: Check if product is favorited
   */
  const checkFavoriteStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/favorites/check?productId=${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      if (data.success) {
        setIsFavorite(data.isFavorited);
      }
    } catch (err) {
      console.error('Failed to check favorite status:', err);
    }
  };

  /**
   * DEEP LOGIC: Handle variant selection change
   * 
   * Called by VariantSelector component
   */
  const handleVariantSelectionChange = (selections, isValid, price) => {
    setVariantSelections(selections);
    setIsSelectionsValid(isValid);
    setCalculatedPrice(price);
    setError(''); // Clear any previous errors
  };

  /**
   * DEEP LOGIC: Handle quantity change
   */
  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  /**
   * DEEP LOGIC: Add to cart
   * 
   * Validates:
   * 1. All required variants are selected
   * 2. Stock is available
   * 3. User is authenticated
   */
  const handleAddToCart = async () => {
    try {
      // Validate variant selections
      if (product.variants && product.variants.length > 0 && !isSelectionsValid) {
        setError('Please select all required options');
        return;
      }

      setAddingToCart(true);
      setError('');

      // Use shared API wrapper (injects Supabase token)
      await cartAPI.addToCart(product._id, quantity, null, variantSelections);

      {
        // Show success message
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        
        // Reset quantity
        setQuantity(1);
      }

    } catch (err) {
      setError('Failed to add to cart');
      console.error(err);
    } finally {
      setAddingToCart(false);
    }
  };

  /**
   * DEEP LOGIC: Toggle favorite
   */
  const handleToggleFavorite = async () => {
    try {
      if (!product?._id) return;
      if (isFavorite) {
        await customerAPI.removeFromFavorites(product._id);
        setIsFavorite(false);
      } else {
        await customerAPI.addToFavorites(product._id, { variantSelections });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  /**
   * DEEP LOGIC: Get display image
   * 
   * Priority:
   * 1. First selected variant's image
   * 2. Product main image
   */
  const getDisplayImage = () => {
    if (variantSelections.length > 0 && variantSelections[0].image) {
      return variantSelections[0].image;
    }
    return product.image;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
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

  const displayImage = getDisplayImage();
  const hasVariants = product.variants && product.variants.length > 0;
  const canAddToCart = !hasVariants || isSelectionsValid;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <MdArrowBack size={24} />
        </button>
        <button onClick={handleToggleFavorite} style={styles.favoriteButton}>
          {isFavorite ? (
            <MdFavorite size={24} color="#ef4444" />
          ) : (
            <MdFavoriteBorder size={24} />
          )}
        </button>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div style={styles.successBanner}>
          ✓ Added to cart successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={styles.errorBanner}>
          {error}
        </div>
      )}

      {/* Product Image */}
      <div style={styles.imageContainer}>
        <img src={displayImage} alt={product.name} style={styles.productImage} />
      </div>

      {/* Product Info */}
      <div style={styles.contentContainer}>
        <h1 style={styles.productName}>{product.name}</h1>
        
        <div style={styles.priceContainer}>
          <span style={styles.price}>₱{calculatedPrice.toFixed(2)}</span>
          {product.discount > 0 && (
            <span style={styles.discount}>{product.discount}% OFF</span>
          )}
        </div>

        <p style={styles.description}>{product.description}</p>

        {/* Variant Selector */}
        {hasVariants && (
          <div style={styles.variantsSection}>
            <VariantSelector
              product={product}
              onSelectionChange={handleVariantSelectionChange}
            />
          </div>
        )}

        {/* Quantity Selector */}
        <div style={styles.quantitySection}>
          <h3 style={styles.sectionTitle}>Quantity</h3>
          <div style={styles.quantityControls}>
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              style={{
                ...styles.quantityButton,
                opacity: quantity <= 1 ? 0.5 : 1,
              }}
            >
              <MdRemove size={20} />
            </button>
            <span style={styles.quantityDisplay}>{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              style={styles.quantityButton}
            >
              <MdAdd size={20} />
            </button>
          </div>
        </div>

        {/* Product Details */}
        <div style={styles.detailsSection}>
          <h3 style={styles.sectionTitle}>Product Details</h3>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Category:</span>
            <span style={styles.detailValue}>{product.category}</span>
          </div>
          {product.estimatedTime && (
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Estimated Time:</span>
              <span style={styles.detailValue}>{product.estimatedTime} minutes</span>
            </div>
          )}
          {product.shippingFee > 0 && (
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Shipping Fee:</span>
              <span style={styles.detailValue}>₱{product.shippingFee.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Add to Cart Button */}
      <div style={styles.footer}>
        <button
          onClick={handleAddToCart}
          disabled={addingToCart || !canAddToCart}
          style={{
            ...styles.addToCartButton,
            opacity: addingToCart || !canAddToCart ? 0.6 : 1,
          }}
        >
          <MdShoppingCart size={20} />
          {addingToCart ? 'Adding...' : 'Add to Cart'}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 10,
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
  },
  favoriteButton: {
    padding: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
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
  successBanner: {
    backgroundColor: '#d1fae5',
    color: '#059669',
    padding: '12px 20px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px 20px',
    textAlign: 'center',
    fontSize: '14px',
  },
  imageContainer: {
    width: '100%',
    height: '300px',
    backgroundColor: 'white',
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  contentContainer: {
    padding: '20px',
  },
  productName: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 12px 0',
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
  },
  price: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#f97316',
  },
  discount: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
  description: {
    fontSize: '15px',
    color: '#6b7280',
    lineHeight: '1.6',
    marginBottom: '20px',
  },
  variantsSection: {
    marginBottom: '25px',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  quantitySection: {
    marginBottom: '25px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  quantityButton: {
    width: '40px',
    height: '40px',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#374151',
  },
  quantityDisplay: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    minWidth: '40px',
    textAlign: 'center',
  },
  detailsSection: {
    marginTop: '25px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb',
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  detailLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
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
  addToCartButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
};

export default SingleProductPageWithChoices;
