import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { product } from '../api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdArrowBack, MdAdd, MdEdit, MdDelete, MdClose } from 'react-icons/md';

const ProductList = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        availability: 'Available'
    });
    const [editLoading, setEditLoading] = useState(false);
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const data = await product.getSellerProducts();
            setProducts(data || []);
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

    const openEditModal = (prod) => {
        setEditingProduct(prod);
        setEditFormData({
            name: prod.name,
            description: prod.description,
            price: prod.price,
            category: prod.category,
            availability: prod.availability
        });
        setPreviewUrl(prod.image);
    };

    const closeEditModal = () => {
        setEditingProduct(null);
        setEditFormData({
            name: '',
            description: '',
            price: '',
            category: '',
            availability: 'Available'
        });
        setPreviewUrl('');
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditFormData(prev => ({
                ...prev,
                image: file
            }));
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        
        try {
            const submitData = new FormData();
            Object.keys(editFormData).forEach(key => {
                if (key !== 'image' || (key === 'image' && editFormData[key] instanceof File)) {
                    submitData.append(key, editFormData[key]);
                }
            });
            
            await product.updateProduct(editingProduct._id, submitData);
            await fetchProducts();
            closeEditModal();
            toast.success('Product updated successfully');
        } catch (err) {
            toast.error(err.message || 'Failed to update product');
        } finally {
            setEditLoading(false);
        }
    };

    if (loading) {
        return <div style={styles.loadingContainer}>Loading...</div>;
    }

    return (
        <div style={styles.mainContainer}>
            <ToastContainer position="top-right" autoClose={3000} />
            
            <div style={styles.header}>
                <div style={styles.backButton} onClick={() => navigate('/seller/dashboard')}>
                    <span style={styles.backArrow}>←</span>
                    <span style={styles.headerText}>Product List</span>
                </div>
                <button 
                    style={styles.addButton}
                    onClick={() => navigate('/seller/add-product')}
                >
                    <MdAdd size={18} /> Add Product
                </button>
            </div>

            <div style={styles.contentContainer}>
                {error && <div style={styles.error}>{error}</div>}

                {products.length === 0 ? (
                    <div style={styles.noProducts}>
                        <p>No products found. Start by adding your first product!</p>
                        <button 
                            onClick={() => navigate('/seller/add-product')}
                            style={styles.addFirstButton}
                        >
                            Add Your First Product
                        </button>
                    </div>
                ) : (
                    <div style={styles.productGrid}>
                        {products.map(prod => (
                            <div key={prod._id} style={styles.productCard}>
                                <div style={styles.imageContainer}>
                                    <img 
                                        src={prod.image} 
                                        alt={prod.name}
                                        style={styles.productImage}
                                    />
                                    <span
                                        style={{
                                            ...styles.availabilityBadge,
                                            backgroundColor: prod.availability === 'Available' ? '#4CAF50' : '#f44336'
                                        }}>
                                        {prod.availability}
                                    </span>
                                </div>
                                <div style={styles.productInfo}>
                                    <h3 style={styles.productName}>{prod.name}</h3>
                                    <p style={styles.productPrice}>₱{prod.price.toFixed(2)}</p>
                                    <p style={styles.productCategory}>{prod.category}</p>
                                </div>
                                <div style={styles.productActions}>
                                    <button 
                                        onClick={() => openEditModal(prod)}
                                        style={styles.editButton}
                                    >
                                        <MdEdit size={16} /> Edit
                                    </button>
                                    <button 
                                        onClick={() => handleAvailabilityToggle(prod._id, prod.availability)}
                                        style={{
                                            ...styles.availabilityButton,
                                            backgroundColor: prod.availability === 'Available' ? '#f44336' : '#4CAF50'
                                        }}
                                    >
                                        {prod.availability === 'Available' ? 'Mark Out of Stock' : 'Mark Available'}
                                    </button>
                                    <button 
                                        onClick={() => setDeleteConfirm(prod._id)}
                                        style={styles.deleteButton}
                                    >
                                        <MdDelete size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {deleteConfirm && (
                <div style={styles.deleteModal}>
                    <div style={styles.deleteModalContent}>
                        <h2 style={styles.deleteTitle}>Confirm Delete</h2>
                        <p style={styles.deleteText}>Are you sure you want to delete this product? This action cannot be undone.</p>
                        <div style={styles.deleteModalActions}>
                            <button 
                                onClick={() => handleDelete(deleteConfirm)}
                                style={styles.confirmDeleteButton}
                            >
                                Yes, Delete
                            </button>
                            <button 
                                onClick={() => setDeleteConfirm(null)}
                                style={styles.cancelDeleteButton}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingProduct && (
                <div style={styles.editModal}>
                    <div style={styles.editModalContent}>
                        <div style={styles.editModalHeader}>
                            <h2 style={styles.editTitle}>Edit Product</h2>
                            <button
                                onClick={closeEditModal}
                                style={styles.closeButton}
                            >
                                <MdClose size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProduct} style={styles.editForm}>
                            <div style={styles.imagePreviewContainer}>
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" style={styles.editImagePreview} />
                                ) : (
                                    <div style={styles.editPlaceholderImage}>
                                        📷 Upload Image
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    ref={fileInputRef}
                                    style={styles.fileInput}
                                    className="file-input"
                                />
                            </div>

                            <div style={styles.editInputGroup}>
                                <label style={styles.editLabel}>Product Name:</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editFormData.name}
                                    onChange={handleEditInputChange}
                                    required
                                    style={styles.editInput}
                                    className="product-input"
                                />
                            </div>

                            <div style={styles.editInputGroup}>
                                <label style={styles.editLabel}>Description:</label>
                                <textarea
                                    name="description"
                                    value={editFormData.description}
                                    onChange={handleEditInputChange}
                                    required
                                    style={styles.editTextarea}
                                    className="product-textarea"
                                />
                            </div>

                            <div style={styles.editInputGroup}>
                                <label style={styles.editLabel}>Price:</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={editFormData.price}
                                    onChange={handleEditInputChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    style={styles.editInput}
                                    className="product-input"
                                />
                            </div>

                            <div style={styles.editInputGroup}>
                                <label style={styles.editLabel}>Category:</label>
                                <input
                                    type="text"
                                    name="category"
                                    value={editFormData.category}
                                    onChange={handleEditInputChange}
                                    required
                                    style={styles.editInput}
                                    className="product-input"
                                />
                            </div>

                            <div style={styles.editInputGroup}>
                                <label style={styles.editLabel}>Availability:</label>
                                <select
                                    name="availability"
                                    value={editFormData.availability}
                                    onChange={handleEditInputChange}
                                    style={styles.editSelect}
                                    className="product-select"
                                >
                                    <option value="Available">Available</option>
                                    <option value="Out of Stock">Out of Stock</option>
                                </select>
                            </div>

                            <div style={styles.editButtonRow}>
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    style={styles.cancelEditButton}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        ...styles.saveButton,
                                        opacity: editLoading ? 0.7 : 1,
                                        cursor: editLoading ? 'not-allowed' : 'pointer'
                                    }}
                                    disabled={editLoading}
                                >
                                    {editLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ResponsiveStyle />
        </div>
    );
};

const styles = {
    mainContainer: {
        backgroundColor: '#f7f7f7',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    loadingContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#666',
    },
    header: {
        padding: '7px 15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ff8c00e0',
        color: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.4)',
    },
    backButton: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'transform 0.2s',
    },
    backArrow: {
        fontSize: '20px',
        marginRight: '10px',
        color: 'white',
    },
    headerText: {
        fontSize: '15px',
        fontWeight: '600',
        color: 'white',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
    },
    addButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '6px 12px',
        backgroundColor: 'white',
        color: '#ff8c00',
        border: 'none',
        borderRadius: '6px',
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    },
    contentContainer: {
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        overflowY: 'auto',
        height: 'calc(100vh - 53px)',
    },
    productGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
    },
    productCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.3s, box-shadow 0.3s',
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: '180px',
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    availabilityBadge: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        padding: '5px 10px',
        borderRadius: '20px',
        color: 'white',
        fontSize: '12px',
        fontWeight: '600',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    },
    productInfo: {
        padding: '15px',
    },
    productName: {
        margin: '0 0 8px 0',
        fontSize: '16px',
        fontWeight: '600',
        color: '#333',
    },
    productPrice: {
        margin: '0 0 5px 0',
        fontSize: '18px',
        color: '#ff8c00',
        fontWeight: '700',
    },
    productCategory: {
        margin: '0',
        color: '#666',
        fontSize: '14px',
    },
    productActions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '0 15px 15px',
    },
    editButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '5px',
        padding: '8px 10px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: '14px',
        transition: 'all 0.2s',
    },
    availabilityButton: {
        padding: '8px 10px',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: '14px',
        transition: 'all 0.2s',
    },
    deleteButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '5px',
        padding: '8px 10px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: '14px',
        transition: 'all 0.2s',
    },
    deleteModal: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '1000',
        backdropFilter: 'blur(3px)',
    },
    deleteModalContent: {
        backgroundColor: '#fff',
        padding: '25px',
        borderRadius: '12px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    },
    deleteTitle: {
        color: '#333',
        fontSize: '20px',
        marginTop: '0',
        marginBottom: '15px',
        textAlign: 'center',
    },
    deleteText: {
        fontSize: '15px',
        lineHeight: '1.5',
        color: '#555',
        marginBottom: '20px',
        textAlign: 'center',
    },
    deleteModalActions: {
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
    },
    confirmDeleteButton: {
        padding: '10px 20px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.2s',
    },
    cancelDeleteButton: {
        padding: '10px 20px',
        backgroundColor: '#9e9e9e',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.2s',
    },
    error: {
        backgroundColor: '#fde8e8',
        color: '#e53e3e',
        padding: '12px',
        marginBottom: '20px',
        textAlign: 'center',
        borderRadius: '10px',
        fontSize: '14px',
        boxShadow: '0 2px 4px rgba(229, 62, 62, 0.1)',
    },
    noProducts: {
        textAlign: 'center',
        padding: '40px 20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        margin: '30px auto',
        maxWidth: '500px',
    },
    addFirstButton: {
        marginTop: '20px',
        padding: '12px 25px',
        background: 'linear-gradient(135deg, #fbaa39, #fc753b)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        boxShadow: '0 4px 12px rgba(255, 140, 0, 0.25)',
        transition: 'all 0.3s ease',
    },
    editModal: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '1000',
        backdropFilter: 'blur(4px)',
    },
    editModalContent: {
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '550px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    },
    editModalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 20px',
        borderBottom: '1px solid #eee',
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        zIndex: 1,
    },
    editTitle: {
        margin: '0',
        fontSize: '18px',
        fontWeight: '600',
        color: '#333',
    },
    closeButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#666',
        display: 'flex',
        padding: '5px',
    },
    editForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        padding: '20px',
    },
    imagePreviewContainer: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
    },
    editImagePreview: {
        width: '100%',
        maxWidth: '200px',
        height: '200px',
        objectFit: 'cover',
        borderRadius: '8px',
        border: '1px solid #ddd',
    },
    editPlaceholderImage: {
        width: '100%',
        maxWidth: '200px',
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: '1px dashed #ddd',
        color: '#666',
    },
    editInputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
    editLabel: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#555',
    },
    editInput: {
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        fontSize: '15px',
        backgroundColor: '#f9f9f9',
    },
    editTextarea: {
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        fontSize: '15px',
        minHeight: '100px',
        resize: 'vertical',
        backgroundColor: '#f9f9f9',
    },
    editSelect: {
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        fontSize: '15px',
        backgroundColor: '#f9f9f9',
        appearance: 'none',
        backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23555%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '10px',
    },
    editButtonRow: {
        display: 'flex',
        gap: '15px',
        marginTop: '10px',
    },
    cancelEditButton: {
        flex: 1,
        padding: '12px',
        backgroundColor: '#f0f0f0',
        color: '#555',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: '15px',
    },
    saveButton: {
        flex: 2,
        padding: '12px',
        background: 'linear-gradient(135deg, #fbaa39, #fc753b)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px',
        boxShadow: '0 4px 8px rgba(255, 140, 0, 0.2)',
    },
    fileInput: {
        width: '200px',
    },
};

// Responsive media queries using a style tag
const ResponsiveStyle = () => (
    <style>{`
        * {
            box-sizing: border-box;
        }
        
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
        }
        
        button[style*="addFirstButton"]:hover,
        button[style*="addButton"]:hover {
            box-shadow: 0 6px 15px rgba(255, 140, 0, 0.35);
        }
        
        button[style*="confirmDeleteButton"]:hover {
            background-color: #d32f2f;
        }
        
        button[style*="cancelDeleteButton"]:hover {
            background-color: #757575;
        }
        
        div[style*="productCard"]:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        
        /* Scrollbar styling */
        div[style*="contentContainer"]::-webkit-scrollbar {
            width: 6px;
        }
        
        div[style*="contentContainer"]::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 10px;
        }
        
        div[style*="contentContainer"]::-webkit-scrollbar-thumb {
            background: rgba(255, 140, 0, 0.3);
            border-radius: 10px;
        }
        
        div[style*="contentContainer"]::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 140, 0, 0.5);
        }
        
        @media (max-width: 768px) {
            div[style*="productGrid"] {
                grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
            }
        }
        
        @media (max-width: 480px) {
            div[style*="productGrid"] {
                grid-template-columns: 1fr;
                max-width: 320px;
                margin: 0 auto;
            }
            
            div[style*="header"] {
                padding: 7px 10px;
            }
            
            button[style*="addButton"] {
                font-size: 12px;
                padding: 5px 8px;
            }
        }
    `}</style>
);

export default ProductList;