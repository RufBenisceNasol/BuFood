import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { product } from '../api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProductList = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const data = await product.getSellerProducts();
            setProducts(data || []); // Changed from data.products to data
        } catch (err) {
            setError(err.message || 'Failed to fetch products');
            toast.error(err.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (productId) => {
        try {
            await product.deleteProduct(productId);
            await fetchProducts(); // Refresh the list
            setDeleteConfirm(null);
            toast.success('Product deleted successfully');
        } catch (err) {
            setError(err.message || 'Failed to delete product');
            toast.error(err.message || 'Failed to delete product');
        }
    };

    const handleAvailabilityToggle = async (productId, currentAvailability) => {
        try {
            const newAvailability = currentAvailability === 'Available' ? 'Out of Stock' : 'Available';
            await product.updateProduct(productId, { availability: newAvailability });
            await fetchProducts(); // Refresh the list
            toast.success(`Product marked as ${newAvailability}`);
        } catch (err) {
            setError(err.message || 'Failed to update product availability');
            toast.error(err.message || 'Failed to update product availability');
        }
    };

    if (loading) {
        return <div className="product-list-container">Loading...</div>;
    }

    return (
        <div className="product-list-container" style={styles.container}>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="product-list-header" style={styles.header}>
                <button 
                    className="back-button" 
                    onClick={() => navigate('/seller/dashboard')}
                    style={styles.backButton}
                >
                    ← Back to Dashboard
                </button>
                <h1 style={styles.title}>Product List</h1>
                <button 
                    className="add-product-button"
                    onClick={() => navigate('/seller/add-product')}
                    style={styles.addButton}
                >
                    + Add Product
                </button>
            </div>

            {error && <div className="error-message" style={styles.errorMessage}>{error}</div>}

            {products.length === 0 ? (
                <div className="no-products" style={styles.noProducts}>
                    <p>No products found. Start by adding your first product!</p>
                    <button 
                        className="add-first-product-button"
                        onClick={() => navigate('/seller/add-product')}
                        style={styles.addFirstButton}
                    >
                        Add Your First Product
                    </button>
                </div>
            ) : (
                <div className="product-grid" style={styles.productGrid}>
                    {products.map(product => (
                        <div key={product._id} className="product-card" style={styles.productCard}>
                            <div className="product-image-container" style={styles.imageContainer}>
                                <img 
                                    src={product.image} 
                                    alt={product.name}
                                    className="product-image"
                                    style={styles.productImage}
                                />
                                <span className={`availability-badge ${product.availability.toLowerCase().replace(' ', '-')}`}
                                      style={{
                                          ...styles.availabilityBadge,
                                          backgroundColor: product.availability === 'Available' ? '#4CAF50' : '#f44336'
                                      }}>
                                    {product.availability}
                                </span>
                            </div>
                            <div className="product-info" style={styles.productInfo}>
                                <h3 style={styles.productName}>{product.name}</h3>
                                <p className="product-price" style={styles.productPrice}>₱{product.price.toFixed(2)}</p>
                                <p className="product-category" style={styles.productCategory}>{product.category}</p>
                            </div>
                            <div className="product-actions" style={styles.productActions}>
                                <button 
                                    className="edit-button"
                                    onClick={() => navigate(`/seller/edit-product/${product._id}`)}
                                    style={styles.editButton}
                                >
                                    Edit
                                </button>
                                <button 
                                    className={`availability-button ${product.availability.toLowerCase().replace(' ', '-')}`}
                                    onClick={() => handleAvailabilityToggle(product._id, product.availability)}
                                    style={{
                                        ...styles.availabilityButton,
                                        backgroundColor: product.availability === 'Available' ? '#f44336' : '#4CAF50'
                                    }}
                                >
                                    {product.availability === 'Available' ? 'Mark Out of Stock' : 'Mark Available'}
                                </button>
                                <button 
                                    className="delete-button"
                                    onClick={() => setDeleteConfirm(product._id)}
                                    style={styles.deleteButton}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {deleteConfirm && (
                <div className="delete-modal" style={styles.deleteModal}>
                    <div className="delete-modal-content" style={styles.deleteModalContent}>
                        <h2>Confirm Delete</h2>
                        <p>Are you sure you want to delete this product? This action cannot be undone.</p>
                        <div className="delete-modal-actions" style={styles.deleteModalActions}>
                            <button 
                                className="confirm-delete-button"
                                onClick={() => handleDelete(deleteConfirm)}
                                style={styles.confirmDeleteButton}
                            >
                                Yes, Delete
                            </button>
                            <button 
                                className="cancel-delete-button"
                                onClick={() => setDeleteConfirm(null)}
                                style={styles.cancelDeleteButton}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    title: {
        margin: '0',
        fontSize: '24px',
        color: '#333'
    },
    backButton: {
        padding: '10px 20px',
        backgroundColor: '#f0f0f0',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
    },
    addButton: {
        padding: '10px 20px',
        backgroundColor: '#ff8c00e0',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
    },
    productGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        padding: '20px 0'
    },
    productCard: {
        backgroundColor: '#fff',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'transform 0.3s',
        cursor: 'pointer',
        '&:hover': {
            transform: 'translateY(-5px)'
        }
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: '200px',
        overflow: 'hidden'
    },
    productImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    availabilityBadge: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        padding: '5px 10px',
        borderRadius: '15px',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold'
    },
    productInfo: {
        padding: '15px'
    },
    productName: {
        margin: '0 0 10px 0',
        fontSize: '18px',
        color: '#333'
    },
    productPrice: {
        margin: '0 0 5px 0',
        fontSize: '20px',
        color: '#ff8c00e0',
        fontWeight: 'bold'
    },
    productCategory: {
        margin: '0',
        color: '#666',
        fontSize: '14px'
    },
    productActions: {
        display: 'flex',
        gap: '10px',
        padding: '15px',
        borderTop: '1px solid #eee'
    },
    editButton: {
        flex: '1',
        padding: '8px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
    },
    availabilityButton: {
        flex: '2',
        padding: '8px',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
    },
    deleteButton: {
        flex: '1',
        padding: '8px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
    },
    deleteModal: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '1000'
    },
    deleteModalContent: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '10px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center'
    },
    deleteModalActions: {
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        marginTop: '20px'
    },
    confirmDeleteButton: {
        padding: '10px 20px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
    },
    cancelDeleteButton: {
        padding: '10px 20px',
        backgroundColor: '#9e9e9e',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
    },
    errorMessage: {
        backgroundColor: '#ffebee',
        color: '#f44336',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '20px'
    },
    noProducts: {
        textAlign: 'center',
        padding: '50px 20px',
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    addFirstButton: {
        marginTop: '20px',
        padding: '12px 30px',
        backgroundColor: '#ff8c00e0',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px'
    }
};

export default ProductList;