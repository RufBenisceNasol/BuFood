import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { product } from '../api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdArrowBack, MdEdit, MdDelete, MdMoreVert } from 'react-icons/md';
import { Modal, Button } from '@mui/material';

const SellerProductDetailPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [productData, setProductData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingToggle, setPendingToggle] = useState(false);

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

    const handleToggleAvailabilityClick = () => {
        setShowConfirmModal(true);
    };

    const handleConfirmToggle = async () => {
        setPendingToggle(true);
        try {
            await product.toggleAvailability(productId);
            await fetchProductDetails();
            toast.success('Product availability updated');
        } catch (err) {
            toast.error(err.message || 'Failed to update product availability');
        } finally {
            setPendingToggle(false);
            setShowConfirmModal(false);
        }
    };

    const handleCancelToggle = () => {
        setShowConfirmModal(false);
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
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
                <button style={styles.backButton} onClick={() => navigate('/seller/product-list')}>
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
                        
                        <p style={styles.price}>₱{productData.price.toFixed(2)}</p>
                        
                        <div style={styles.description}>
                            <h3 style={styles.sectionTitle}>Description</h3>
                            <p style={styles.descriptionText}>{productData.description}</p>
                        </div>

                        <div style={styles.availabilitySection}>
                            <h3 style={styles.sectionTitle}>Availability</h3>
                            <div style={styles.availabilityToggle}>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={productData.availability === 'Available'}
                                        onChange={handleToggleAvailabilityClick}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <span style={styles.availabilityLabel}>
                                    {productData.availability === 'Available' ? 'Product is Available' : 'Product is Out of Stock'}
                                </span>
                            </div>
                        </div>
                        <Modal open={showConfirmModal} onClose={handleCancelToggle}>
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                background: 'white',
                                padding: 32,
                                borderRadius: 12,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                minWidth: 300,
                                textAlign: 'center',
                            }}>
                                <h2>Change Availability</h2>
                                <p>Do you want to change the availability?</p>
                                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 16 }}>
                                    <Button variant="outlined" onClick={handleCancelToggle} disabled={pendingToggle}>Cancel</Button>
                                    <Button variant="contained" color="primary" onClick={handleConfirmToggle} disabled={pendingToggle}>
                                        {pendingToggle ? 'Updating...' : 'Yes, Change'}
                                    </Button>
                                </div>
                            </div>
                        </Modal>
                    </div>
                </div>
            </div>

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
        fontSize: '14px',
        fontWeight: '500',
    }),
    productInfo: {
        padding: '24px',
    },
    productHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px',
    },
    productName: {
        margin: '0',
        fontSize: '24px',
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
        gap: '6px',
        padding: '10px 16px',
        backgroundColor: 'white',
        color: '#333',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        width: '100%',
        textAlign: 'left',
        transition: 'background-color 0.3s ease',
    },
    dropdownItemHover: {
        backgroundColor: '#f8f8f8',
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
    availabilitySection: {
        marginTop: '24px',
        padding: '20px',
        backgroundColor: '#f8f8f8',
        borderRadius: '8px',
    },
    availabilityToggle: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
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

export default SellerProductDetailPage;