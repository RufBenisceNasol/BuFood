import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { product, cart } from '../api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdArrowBack, MdShoppingCart, MdAdd, MdRemove } from 'react-icons/md';

const SingleProductPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [productData, setProductData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        const fetchProductDetails = async () => {
            try {
                const data = await product.getProductById(productId);
                setProductData(data);
            } catch (err) {
                setError(err.message || 'Failed to fetch product details');
                toast.error(err.message || 'Failed to fetch product details');
            } finally {
                setLoading(false);
            }
        };

        fetchProductDetails();
    }, [productId]);

    const handleAddToCart = async () => {
        try {
            await cart.addToCart(productId, quantity);
            toast.success('Product added to cart successfully');
        } catch (err) {
            const errorMessage = err.message || err.error || 'Failed to add product to cart';
            toast.error(errorMessage);
            console.error('Add to cart error:', err);
        }
    };

    if (loading) {
        return <div style={styles.loadingContainer}>Loading...</div>;
    }

    if (error || !productData) {
        return <div style={styles.errorContainer}>{error || 'Product not found'}</div>;
    }

    return (
        <div style={styles.mainContainer}>
            <ToastContainer position="top-right" autoClose={3000} />
            
            <div style={styles.header}>
                <button style={styles.backButton} onClick={() => navigate(-1)}>
                    <MdArrowBack size={24} />
                </button>
                <h1 style={styles.headerTitle}>Product Details</h1>
            </div>

            <div style={styles.contentContainer}>
                <div style={styles.productCard}>
                    <div style={styles.imageContainer}>
                        <img 
                            src={productData.image} 
                            alt={productData.name}
                            style={styles.productImage}
                        />
                        {productData.availability === 'Out of Stock' && (
                            <div style={styles.outOfStockBadge}>
                                Out of Stock
                            </div>
                        )}
                    </div>

                    <div style={styles.productInfo}>
                        <h2 style={styles.productName}>{productData.name}</h2>
                        <p style={styles.price}>₱{productData.price.toFixed(2)}</p>
                        
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>Description</h3>
                            <p style={styles.descriptionText}>{productData.description}</p>
                        </div>

                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>Store</h3>
                            <p style={styles.storeText}>{productData.storeName}</p>
                        </div>

                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>Category</h3>
                            <p style={styles.categoryText}>{productData.category}</p>
                        </div>

                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>Delivery Information</h3>
                            <div style={styles.deliveryInfo}>
                                <div style={styles.infoGrid}>
                                    <div style={styles.infoItem}>
                                        <span style={styles.infoLabel}>Estimated Time:</span>
                                        <span style={styles.infoValue}>{productData.estimatedTime ? `${productData.estimatedTime} minutes` : 'Not specified'}</span>
                                    </div>
                                    <div style={styles.infoItem}>
                                        <span style={styles.infoLabel}>Shipping Fee:</span>
                                        <span style={styles.infoValue}>₱{productData.shippingFee ? parseFloat(productData.shippingFee).toFixed(2) : '0.00'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {productData.availability === 'Available' && (
                            <div style={styles.addToCartSection}>
                                <div style={styles.quantitySelector}>
                                    <button 
                                        style={styles.quantityButton}
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    >
                                        <MdRemove size={20} />
                                    </button>
                                    <span style={styles.quantityDisplay}>{quantity}</span>
                                    <button 
                                        style={styles.quantityButton}
                                        onClick={() => setQuantity(quantity + 1)}
                                    >
                                        <MdAdd size={20} />
                                    </button>
                                </div>

                                <button 
                                    style={styles.addToCartButton}
                                    onClick={handleAddToCart}
                                >
                                    <MdShoppingCart size={20} />
                                    Add to Cart
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .productCard {
                        border-radius: 0 !important;
                        box-shadow: none !important;
                    }
                    .contentContainer {
                        padding: 0 !important;
                    }
                    .imageContainer {
                        height: 250px !important;
                    }
                    .productInfo {
                        padding: 16px !important;
                    }
                    .header {
                        padding: 12px !important;
                    }
                }
                
                @media (max-width: 480px) {
                    .imageContainer {
                        height: 200px !important;
                    }
                    .productName {
                        font-size: 20px !important;
                    }
                    .price {
                        font-size: 18px !important;
                    }
                    .quantitySelector {
                        justify-content: center !important;
                    }
                }

                .quantityButton:hover {
                    background-color: #f0f0f0;
                }
                
                .addToCartButton:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(255, 140, 0, 0.35);
                }
            `}</style>
        </div>
    );
};

const styles = {
    mainContainer: {
        backgroundColor: '#f7f7f7',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
    },
    header: {
        backgroundColor: '#ff8c00e0',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        color: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    backButton: {
        background: 'none',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        marginRight: '16px',
    },
    headerTitle: {
        margin: 0,
        fontSize: '1.25rem',
        fontWeight: '600',
    },
    contentContainer: {
        padding: '1.25rem',
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
    },
    productCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: '300px',
        backgroundColor: '#f8f8f8',
    },
    productImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    outOfStockBadge: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(231, 76, 60, 0.9)',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        fontSize: '0.875rem',
        fontWeight: '500',
    },
    productInfo: {
        padding: '1.5rem',
    },
    productName: {
        margin: '0 0 0.75rem 0',
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#333',
    },
    price: {
        fontSize: '1.375rem',
        fontWeight: '600',
        color: '#ff8c00',
        margin: '0 0 1.25rem 0',
    },
    section: {
        marginBottom: '1.5rem',
    },
    sectionTitle: {
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#444',
        marginBottom: '0.5rem',
    },
    descriptionText: {
        fontSize: '1rem',
        color: '#666',
        lineHeight: '1.5',
        margin: 0,
    },
    storeText: {
        fontSize: '1rem',
        color: '#666',
        margin: 0,
    },
    categoryText: {
        fontSize: '1rem',
        color: '#666',
        margin: 0,
        textTransform: 'capitalize',
    },
    deliveryInfo: {
        backgroundColor: '#f8f8f8',
        padding: '1rem',
        borderRadius: '8px',
    },
    infoGrid: {
        display: 'grid',
        gap: '0.75rem',
    },
    infoItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
    },
    infoLabel: {
        color: '#666',
        fontSize: '0.9375rem',
    },
    infoValue: {
        color: '#333',
        fontSize: '0.9375rem',
        fontWeight: '500',
    },
    addToCartSection: {
        marginTop: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    quantitySelector: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1rem',
    },
    quantityButton: {
        width: '36px',
        height: '36px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    quantityDisplay: {
        fontSize: '1.125rem',
        fontWeight: '500',
        minWidth: '40px',
        textAlign: 'center',
    },
    addToCartButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        backgroundColor: '#ff8c00',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '0.875rem',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 8px rgba(255, 140, 0, 0.3)',
        width: '100%',
    },
    loadingContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1rem',
        color: '#666',
    },
    errorContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1rem',
        color: '#e53e3e',
        padding: '0 1.25rem',
        textAlign: 'center',
    },
};

export default SingleProductPage;