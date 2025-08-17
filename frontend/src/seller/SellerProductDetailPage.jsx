import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { product } from '../api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdArrowBack, MdEdit, MdDelete, MdMoreVert } from 'react-icons/md';
import { Modal, Button } from '@mui/material';

import styled from 'styled-components';

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  padding-bottom: 20px;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
    transition: background 0.3s ease;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  scrollbar-width: thin;
  scrollbar-color: #888 #f1f1f1;
`;

const SellerProductDetailPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [productData, setProductData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [timestamp, setTimestamp] = useState(Date.now());

    const fetchProductDetails = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        
        setError('');
        
        try {
            // Add timestamp to prevent browser caching
            const cacheBuster = `?t=${Date.now()}`;
            const data = await product.getProductById(productId + cacheBuster);
            
            // Process the data to ensure proper format
            const processedData = {
                ...data,
                // Ensure image URL has cache-busting parameter if it's not a blob or data URL
                image: data.image && !data.image.startsWith('blob:') && !data.image.startsWith('data:') 
                    ? `${data.image}${data.image.includes('?') ? '&' : '?'}t=${Date.now()}`
                    : data.image,
                // Ensure price is a number
                price: typeof data.price === 'string' ? parseFloat(data.price) : data.price
            };
            
            setProductData(processedData);
            setTimestamp(Date.now());
        } catch (err) {
            setError(err.message || 'Failed to fetch product details');
            toast.error(err.message || 'Failed to fetch product details');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [productId]);

    // Initial fetch on component mount
    useEffect(() => {
        fetchProductDetails();
    }, [fetchProductDetails]);
    
    // Refresh data when the page is revisited
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchProductDetails(true);
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchProductDetails]);
    
    // Refresh data when location pathname changes and we come back to this page
    useEffect(() => {
        // Check if we're coming from the edit page with updated product info
        if (location.state && location.state.fromEdit) {
            // Force a fresh fetch with the updated timestamp
            const editTimestamp = location.state.timestamp || Date.now();
            setTimestamp(editTimestamp);
            fetchProductDetails(true);
            
            // Remove the state after handling to prevent repeated refreshes
            // on subsequent navigation events
            navigate(location.pathname, { replace: true, state: {} });
        } else {
            fetchProductDetails(true);
        }
    }, [location.pathname, location.state, fetchProductDetails, navigate]);

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            try {
                await product.deleteProduct(productId);
                toast.success('Product deleted successfully');
                navigate('/seller/product-list');
            } catch (err) {
                toast.error(err.message || 'Failed to delete product');
            }
        }
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };
    
    const handleRefresh = () => {
        fetchProductDetails(true);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-container')) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    if (loading && !refreshing) {
        return <div style={styles.loadingContainer}>Loading...</div>;
    }

    if (error && !productData) {
        return <div style={styles.errorContainer}>{error || 'Product not found'}</div>;
    }

    return (
        <div style={styles.mainContainer}>
            <ToastContainer position="top-right" autoClose={3000} />
            
            <div style={styles.header}>
                <button style={styles.backButton} onClick={() => navigate('/seller/product-list')}>
                    <MdArrowBack size={24} />
                </button>
                <h1 style={styles.headerTitle}>Product Details</h1>
            </div>

            <ScrollableContent>
                <div style={styles.contentContainer}>
                    {refreshing && (
                        <div style={styles.refreshingIndicator}>Refreshing...</div>
                    )}
                    
                    {productData && (
                        <div style={styles.productCard}>
                            <div style={styles.imageContainer}>
                                <img 
                                    src={`${productData.image}${productData.image.includes('?') ? '&' : '?'}t=${timestamp}&nocache=${Math.random()}`}
                                    alt={productData.name}
                                    style={styles.productImage}
                                    onError={(e) => {
                                        // If image fails to load, try without cache busting
                                        if (!e.target.dataset.retried) {
                                            e.target.dataset.retried = true;
                                            e.target.src = productData.image;
                                        }
                                    }}
                                />
                                <div style={styles.availabilityBadge(productData.availability)}>
                                    {productData.availability === 'Available' ? 'Available' : productData.availability === 'Pending' ? 'Pending' : 'Out of Stock'}
                                </div>
                            </div>

                            <div style={styles.productInfo}>
                                <div style={styles.productHeader}>
                                    <h2 style={styles.productName}>{productData.name}</h2>
                                    <div className="dropdown-container" style={styles.dropdownContainer}>
                                        <button style={styles.dropdownButton} onClick={toggleDropdown}>
                                            <MdMoreVert size={24} />
                                        </button>
                                        {showDropdown && (
                                            <div style={styles.dropdownMenu}>
                                                <button 
                                                    style={styles.dropdownItem}
                                                    onClick={() => navigate(`/seller/edit-product/${productId}`)}
                                                >
                                                    <MdEdit size={20} />
                                                    Edit
                                                </button>
                                                <button 
                                                    style={{...styles.dropdownItem, color: '#dc3545'}}
                                                    onClick={handleDelete}
                                                >
                                                    <MdDelete size={20} />
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <p style={styles.price}>₱{parseFloat(productData.price).toFixed(2)}</p>
                                
                                <div style={styles.description}>
                                    <h3 style={styles.sectionTitle}>Description</h3>
                                    <p style={styles.descriptionText}>{productData.description}</p>
                                </div>

                                <div style={styles.section}>
                                    <h3 style={styles.sectionTitle}>Delivery Information</h3>
                                    <div style={styles.deliveryInfo}>
                                        <div style={styles.infoRow}>
                                            <span style={styles.infoLabel}>Estimated Time:</span>
                                            <span style={styles.infoValue}>
                                                {productData.estimatedTime ? `${productData.estimatedTime} minutes` : 'Not specified'}
                                            </span>
                                        </div>
                                        <div style={styles.infoRowLast}>
                                            <span style={styles.infoLabel}>Shipping Fee:</span>
                                            <span style={styles.infoValue}>
                                                ₱{productData.shippingFee ? parseFloat(productData.shippingFee).toFixed(2) : '0.00'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollableContent>

            <style>{`
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 40px;
                    height: 20px;
                }

                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                    border-radius: 20px;
                }

                .slider:before {
                    position: absolute;
                    content: "";
                    height: 16px;
                    width: 16px;
                    left: 2px;
                    bottom: 2px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }

                input:checked + .slider {
                    background-color: #ff8c00;
                }

                input:checked + .slider:before {
                    transform: translateX(20px);
                }

                .editButton:hover, .deleteButton:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
        fontSize: '17px',
        fontWeight: '600',
    },
    contentContainer: {
        padding: '20px',
        maxWidth: '800px',
        margin: '1px',
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
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: 'transform 0.3s ease',
    },
    refreshingIndicator: {
        textAlign: 'center',
        padding: '10px',
        backgroundColor: 'rgba(255, 140, 0, 0.1)',
        borderRadius: '8px',
        marginBottom: '10px',
        color: '#ff8c00',
        fontWeight: '500',
    },
    editImageButton: {
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            transform: 'scale(1.1)',
        }
    },
    availabilityBadge: (availability) => ({
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor:
            availability === 'Available'
                ? 'rgba(46, 204, 113, 0.9)'
                : availability === 'Pending'
                ? 'rgba(255, 140, 0, 0.9)'
                : 'rgba(231, 76, 60, 0.9)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '500',
    }),
    productInfo: {
        padding: '24px',
    },
    productHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1px',
    },
    productName: {
        margin: '0',
        fontSize: '20px',
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    dropdownContainer: {
        position: 'relative',
    },
    dropdownButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
    },
    dropdownMenu: {
        position: 'absolute',
        top: '100%',
        right: 0,
        backgroundColor: 'white',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
        zIndex: 10,
    },
    dropdownItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '1px',
        padding: '10px 16px',
        backgroundColor: 'white',
        color: '#333',
        border: 'none',
        cursor: 'pointer',
        fontSize: '11px',
        fontWeight: '500',
        width: '100%',
        textAlign: 'left',
        transition: 'background-color 0.3s ease',
    },
    dropdownItemHover: {
        backgroundColor: '#f8f8f8',
    },
    price: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#ff8c00',
        margin: '0 0 2px 0',
    },
    description: {
        marginBottom: '-2px',
    },
    sectionTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#444',
        marginBottom: '1px',
    },
    descriptionText: {
        fontSize: '14px',
        color: '#666',
        lineHeight: '1.5',
        margin: 0,
    },
    availabilitySection: {
        marginTop: '2px',
        padding: '20px',
        backgroundColor: '#f8f8f8',
        borderRadius: '8px',
    },
    availabilityToggle: {
        display: 'flex',
        alignItems: 'center',
        gap: '1px',
    },
    availabilityLabel: {
        fontSize: '14px',
        color: '#666',
    },
    loadingContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '14px',
        color: '#666',
    },
    errorContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '14px',
        color: '#e53e3e',
        padding: '0 20px',
        textAlign: 'center',
    },
    section: {
        marginBottom: '2px',
    },
    deliveryInfo: {
        backgroundColor: '#f8f8f8',
        padding: '16px',
        borderRadius: '8px',
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
    },
    infoRowLast: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 0
    },
    infoLabel: {
        color: '#666',
        fontSize: '13px',
    },
    infoValue: {
        color: '#333',
        fontSize: '13px',
        fontWeight: '500',
    },
};

export default SellerProductDetailPage;