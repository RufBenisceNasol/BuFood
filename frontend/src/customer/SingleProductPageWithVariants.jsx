import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { product as productAPI, cart as cartAPI } from '../api';
import http from '../api/http';
import { MdArrowBack, MdFavorite, MdFavoriteBorder, MdShoppingCart, MdAdd, MdRemove, MdCheck } from 'react-icons/md';

const SingleProductPageWithVariants = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
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

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await productAPI.getProductById(productId);
      setProduct(data);
      
      // Auto-select first variant if available
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
      }
    } catch (err) {
      setError('Failed to load product');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const { data } = await http.get(`/favorites/check/${productId}`);
      setIsFavorite(!!data?.isFavorite);
    } catch (err) {
      // ignore if unauthorized; user can still toggle and will be prompted by route guard
    }
  };

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (selectedVariant?.stock || 999)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    try {
      // Validate variant selection
      if (product.variants && product.variants.length > 0 && !selectedVariant) {
        setError('Please select a variant');
        return;
      }

      // Check stock
      if (selectedVariant && selectedVariant.stock < quantity) {
        setError(`Only ${selectedVariant.stock} items available`);
        return;
      }

      setAddingToCart(true);
      setError('');

      const payload = {
        productId: product._id,
        quantity,
      };

      // Add variant info if selected
      if (selectedVariant) {
        payload.selectedVariantId = selectedVariant.id;
      }

      await cartAPI.addToCart(payload.productId, payload.quantity, payload.selectedVariantId);

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (err) {
      setError(err.message || 'Failed to add to cart');
      console.error(err);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        await http.delete(`/favorites/product/${productId}`, {
          params: selectedVariant ? { variantId: selectedVariant.id } : undefined,
        });
        setIsFavorite(false);
      } else {
        await http.post('/favorites', {
          productId: product._id,
          variantId: selectedVariant?.id,
          variantName: selectedVariant?.name,
        });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      setError('Failed to update favorites');
    }
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

  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayImage = selectedVariant?.image || product.image;
  const isOutOfStock = selectedVariant ? selectedVariant.stock === 0 : product.stock === 0;

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
          <MdCheck size={20} />
          Added to cart successfully!
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
        {isOutOfStock && (
          <div style={styles.outOfStockBadge}>Out of Stock</div>
        )}
      </div>

      {/* Product Info */}
      <div style={styles.contentContainer}>
        <h1 style={styles.productName}>{product.name}</h1>
        
        <div style={styles.priceContainer}>
          <span style={styles.price}>₱{displayPrice.toFixed(2)}</span>
          {product.discount > 0 && (
            <span style={styles.discount}>{product.discount}% OFF</span>
          )}
        </div>

        <p style={styles.description}>{product.description}</p>

        {/* Variants Selection */}
        {product.variants && product.variants.length > 0 && (
          <div style={styles.variantsSection}>
            <h3 style={styles.sectionTitle}>Select Variant</h3>
            <div style={styles.variantsList}>
              {product.variants.map((variant) => (
                <div
                  key={variant.id}
                  onClick={() => handleVariantSelect(variant)}
                  style={{
                    ...styles.variantCard,
                    ...(selectedVariant?.id === variant.id ? styles.variantCardSelected : {}),
                    ...(variant.stock === 0 ? styles.variantCardDisabled : {}),
                  }}
                >
                  {variant.image && (
                    <img src={variant.image} alt={variant.name} style={styles.variantImage} />
                  )}
                  <div style={styles.variantInfo}>
                    <span style={styles.variantName}>{variant.name}</span>
                    <span style={styles.variantPrice}>₱{variant.price.toFixed(2)}</span>
                    {variant.stock === 0 && (
                      <span style={styles.variantOutOfStock}>Out of Stock</span>
                    )}
                    {variant.stock > 0 && variant.stock <= 5 && (
                      <span style={styles.variantLowStock}>Only {variant.stock} left</span>
                    )}
                  </div>
                  {selectedVariant?.id === variant.id && (
                    <div style={styles.selectedCheck}>
                      <MdCheck size={20} color="white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
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
              disabled={quantity >= (selectedVariant?.stock || product.stock || 999)}
              style={{
                ...styles.quantityButton,
                opacity: quantity >= (selectedVariant?.stock || product.stock || 999) ? 0.5 : 1,
              }}
            >
              <MdAdd size={20} />
            </button>
          </div>
          {selectedVariant && (
            <p style={styles.stockInfo}>
              {selectedVariant.stock} available
            </p>
          )}
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
          disabled={addingToCart || isOutOfStock}
          style={{
            ...styles.addToCartButton,
            opacity: addingToCart || isOutOfStock ? 0.6 : 1,
          }}
        >
          <MdShoppingCart size={20} />
          {addingToCart ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
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
    position: 'relative',
    width: '100%',
    height: '300px',
    backgroundColor: 'white',
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
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
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  variantsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  variantCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s',
  },
  variantCardSelected: {
    borderColor: '#f97316',
    backgroundColor: '#fff7ed',
  },
  variantCardDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  variantImage: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '6px',
  },
  variantInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  variantName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1f2937',
  },
  variantPrice: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#f97316',
  },
  variantOutOfStock: {
    fontSize: '12px',
    color: '#ef4444',
  },
  variantLowStock: {
    fontSize: '12px',
    color: '#f59e0b',
  },
  selectedCheck: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '24px',
    height: '24px',
    backgroundColor: '#f97316',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantitySection: {
    marginBottom: '25px',
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
  stockInfo: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '8px',
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

export default SingleProductPageWithVariants;
