import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { product, cart } from '../api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdArrowBack, MdShoppingCart } from 'react-icons/md';

const SingleProductPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [productData, setProductData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1);

    const fetchProductDetails = React.useCallback(async () => {
        try {
            const data = await product.getProductById(productId);
            setProductData(data);
        } catch (err) {
            setError(err.message || 'Failed to fetch product details');
            toast.error(err.message || 'Failed to fetch product details');
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        fetchProductDetails();
    }, [fetchProductDetails]);

    const handleAddToCart = async () => {
        try {
            // This will need to be implemented in your cart API
            await cart.addToCart(productId, quantity);
            toast.success('Product added to cart successfully');
        } catch (err) {
            toast.error(err.message || 'Failed to add product to cart');
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
                        {!productData.isAvailable && (
                            <div style={styles.outOfStockBadge}>
                                Out of Stock
                            </div>
                        )}
                    </div>

                    <div style={styles.productInfo}>
                        <h2 style={styles.productName}>{productData.name}</h2>
                        <p style={styles.price}>₱{productData.price.toFixed(2)}</p>
                        
                        <div style={styles.description}>
                            <h3 style={styles.sectionTitle}>Description</h3>
                            <p style={styles.descriptionText}>{productData.description}</p>
                        </div>

                        {productData.isAvailable && (
                            <div style={styles.addToCartSection}>
                                <div style={styles.quantitySelector}>
                                    <button 
                                        style={styles.quantityButton}
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    >
                                        -
                                    </button>
                                    <span style={styles.quantityDisplay}>{quantity}</span>
                                    <button 
                                        style={styles.quantityButton}
                                        onClick={() => setQuantity(quantity + 1)}
                                    >
                                        +
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
        fontSize: '20px',
        fontWeight: '600',
    },
    contentContainer: {
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
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
        padding: '8px 16px',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '500',
    },
    productInfo: {
        padding: '24px',
    },
    productName: {
        margin: '0 0 12px 0',
        fontSize: '24px',
        fontWeight: '600',
        color: '#333',
    },
    price: {
        fontSize: '22px',
        fontWeight: '600',
        color: '#ff8c00',
        margin: '0 0 20px 0',
    },
    description: {
        marginBottom: '24px',
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#444',
        marginBottom: '12px',
    },
    descriptionText: {
        fontSize: '16px',
        color: '#666',
        lineHeight: '1.5',
        margin: 0,
    },
    addToCartSection: {
        marginTop: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    quantitySelector: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
    },
    quantityButton: {
        width: '36px',
        height: '36px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        background: 'white',
        fontSize: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    quantityDisplay: {
        fontSize: '18px',
        fontWeight: '500',
        minWidth: '40px',
        textAlign: 'center',
    },
    addToCartButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        backgroundColor: '#ff8c00',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '14px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 8px rgba(255, 140, 0, 0.3)',
    },
    loadingContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#666',
    },
    errorContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#e53e3e',
        padding: '0 20px',
        textAlign: 'center',
    },
};

export default SingleProductPage;