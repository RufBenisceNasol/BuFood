import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { product } from '../api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdArrowBack, MdEdit } from 'react-icons/md';
import { Modal } from '@mui/material';

const EditProductPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        availability: 'Available',
        estimatedTime: '', // New field for estimated delivery time
        shippingFee: '0', // New field for shipping fee
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const data = await product.getProductById(productId);
                setFormData({
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    category: data.category,
                    availability: data.availability,
                    estimatedTime: data.estimatedTime || '', // Set from product data
                    shippingFee: data.shippingFee || '0', // Set from product data
                });
                setPreviewUrl(data.image);
                setLoading(false);
            } catch (err) {
                setError(err.message || 'Failed to fetch product');
                setLoading(false);
            }
        };
        fetchProduct();
    }, [productId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key]);
            });
            if (selectedImage) {
                submitData.append('image', selectedImage);
            }

            // Update the product
            await product.updateProduct(productId, submitData);
            
            // Delay before verifying update to allow server processing
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Refresh the product data after successful update with cache-busting
            let updatedProduct;
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries) {
                try {
                    // Add timestamp to prevent caching
                    updatedProduct = await product.getProductById(productId);
                    
                    // Verify if image was updated by checking the timestamp in URL
                    let imageUpdated = true;
                    if (selectedImage && updatedProduct.image) {
                        // Simple check - if image URL doesn't contain timestamp parameter yet
                        // this means the server might not have processed the update fully
                        const imageHasTimestamp = updatedProduct.image.includes('?') || 
                                                 updatedProduct.image.includes('&t=') || 
                                                 updatedProduct.image.includes('&_t=');
                        
                        if (!imageHasTimestamp) {
                            // If no timestamp in image URL, it might be server cache
                            imageUpdated = false;
                        }
                    }
                    
                    // If name and other fields are updated and image is updated (if applicable),
                    // we consider the update successful
                    if (updatedProduct.name === formData.name && 
                        updatedProduct.price.toString() === formData.price.toString() &&
                        (selectedImage ? imageUpdated : true)) {
                        break;  // Exit the retry loop if everything is verified
                    }
                    
                    // If update not fully processed, wait and retry
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    retryCount++;
                } catch (err) {
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            // Update local form data with the fetched data
            if (updatedProduct) {
                setFormData({
                    name: updatedProduct.name,
                    description: updatedProduct.description,
                    price: updatedProduct.price,
                    category: updatedProduct.category,
                    availability: updatedProduct.availability,
                    estimatedTime: updatedProduct.estimatedTime || '',
                    shippingFee: updatedProduct.shippingFee || '0',
                });
                
                // Add timestamp to image URL to prevent browser caching
                const imageWithTimestamp = `${updatedProduct.image}${updatedProduct.image.includes('?') ? '&' : '?'}_t=${Date.now()}`;
                setPreviewUrl(imageWithTimestamp);
            }
            
            setSuccess('Product updated successfully!');
            toast.success('Product updated successfully!');
            
            // Increase timeout to ensure server processes the update
            setTimeout(() => {
                // Navigate with state to inform detail page of the update
                navigate(`/seller/product/${productId}`, {
                    state: { 
                        fromEdit: true,
                        timestamp: Date.now(),
                        imageUpdated: selectedImage ? true : false
                    }
                });
            }, 3000); // Increase timeout to 3 seconds
        } catch (err) {
            setError(err.message || 'Failed to update product');
            toast.error(err.message || 'Failed to update product');
        } finally {
            setSaving(false);
        }
    };

    const handleModalOpen = () => setIsModalOpen(true);
    const handleModalClose = () => setIsModalOpen(false);

    if (loading) {
        return <div style={styles.loadingContainer}>Loading...</div>;
    }

    return (
        <div style={styles.mainContainer}>
            <ToastContainer />
            <div style={styles.header}>
                <div style={styles.backButton} onClick={() => navigate(-1)}>
                    <span style={styles.backArrow}>←</span>
                    <span style={styles.headerText}>Edit Product</span>
                </div>
            </div>

            <div style={styles.contentContainer}>
                {error && <div style={styles.error}>{error}</div>}
                {success && <div style={styles.success}>{success}</div>}

                <div style={styles.formContainer}>
                    <form onSubmit={handleSubmit} style={styles.form} className="product-form">
                        <div style={styles.imagePreviewContainer}>
                            {previewUrl ? (
                                <>
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        style={styles.imagePreview}
                                        onClick={handleModalOpen}
                                    />
                                    <Modal open={isModalOpen} onClose={handleModalClose}>
                                        <div style={styles.modalContent}>
                                            <img src={previewUrl} alt="Full Preview" style={styles.modalImage} />
                                        </div>
                                    </Modal>
                                </>
                            ) : (
                                <div style={styles.placeholderImage}>
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

                        <div style={styles.inputGroup}>
                            <label htmlFor="name" style={styles.label}>Product Name:</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                style={styles.input}
                                className="product-input"
                                placeholder="Enter product name"
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label htmlFor="description" style={styles.label}>Description:</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                                style={styles.textarea}
                                className="product-textarea"
                                placeholder="Enter product description"
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label htmlFor="price" style={styles.label}>Price:</label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                required
                                min="0"
                                step="0.01"
                                style={styles.input}
                                className="product-input"
                                placeholder="Enter price"
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label htmlFor="category" style={styles.label}>Category:</label>
                            <input
                                type="text"
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                required
                                style={styles.input}
                                className="product-input"
                                placeholder="Enter category"
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label htmlFor="estimatedTime" style={styles.label}>Estimated Delivery Time (minutes):</label>
                            <input
                                type="number"
                                id="estimatedTime"
                                name="estimatedTime"
                                value={formData.estimatedTime}
                                onChange={handleInputChange}
                                required
                                min="1"
                                style={styles.input}
                                className="product-input"
                                placeholder="Enter estimated delivery time in minutes"
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label htmlFor="shippingFee" style={styles.label}>Shipping Fee:</label>
                            <input
                                type="number"
                                id="shippingFee"
                                name="shippingFee"
                                value={formData.shippingFee}
                                onChange={handleInputChange}
                                required
                                min="0"
                                step="0.01"
                                style={styles.input}
                                className="product-input"
                                placeholder="Enter shipping fee"
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label htmlFor="availability" style={styles.label}>Availability:</label>
                            <select
                                id="availability"
                                name="availability"
                                value={formData.availability}
                                onChange={handleInputChange}
                                style={styles.select}
                                className="product-select"
                            >
                                <option value="Available">Available</option>
                                <option value="Out of Stock">Out of Stock</option>
                            </select>
                        </div>

                        <div style={styles.buttonRow}>
                            <button
                                type="submit"
                                style={{
                                    ...styles.submitButton,
                                    opacity: saving ? 0.7 : 1,
                                    cursor: saving ? 'not-allowed' : 'pointer'
                                }}
                                disabled={saving}
                                className="product-button"
                            >
                                {saving ? 'Updating...' : 'Update Product'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
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
        padding: '7px 10px',
        display: 'flex',
        alignItems: 'center',
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
    contentContainer: {
        overflow: 'auto',
        maxHeight: 'calc(100vh - 60px)',
        paddingBottom: '30px',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: '16px',
        margin: '20px 15px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        transition: 'transform 0.3s, box-shadow 0.3s',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        padding: '25px 24px',
        maxWidth: '600px',
        margin: '0 auto',
    },
    imagePreviewContainer: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '10px',
    },
    imagePreview: {
        width: '100%',
        maxWidth: '200px',
        height: '200px',
        objectFit: 'cover',
        borderRadius: '12px',
        border: '2px solid #eee',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer',
    },
    placeholderImage: {
        width: '100%',
        maxWidth: '200px',
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: '12px',
        border: '2px dashed #ddd',
        color: '#666',
        fontSize: '16px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.09)',
    },
    fileInput: {
        width: '100%',
        maxWidth: '250px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%',
    },
    label: {
        color: '#555',
        fontSize: '15px',
        fontWeight: '500',
    },
    input: {
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid #ddd',
        fontSize: '16px',
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#f9f9f9',
        transition: 'all 0.2s',
    },
    textarea: {
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid #ddd',
        fontSize: '16px',
        minHeight: '120px',
        width: '100%',
        boxSizing: 'border-box',
        resize: 'vertical',
        backgroundColor: '#f9f9f9',
        transition: 'all 0.2s',
    },
    select: {
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid #ddd',
        fontSize: '16px',
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#f9f9f9',
        appearance: 'none',
        backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23555%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095.1c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.9z%22%2F%3E%3C%2Fsvg%3E")',
        backgroundPosition: 'right 15px center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '12px',
        transition: 'all 0.2s',
    },
    buttonRow: {
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        marginTop: '20px',
    },
    submitButton: {
        padding: '14px 28px',
        border: 'none',
        borderRadius: '10px',
        fontSize: '16px',
        fontWeight: '500',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #fbaa39, #fc753b)',
        color: 'white',
        width: '100%',
        maxWidth: '200px',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
    },
    error: {
        backgroundColor: '#fde8e8',
        color: '#e53e3e',
        padding: '12px',
        margin: '15px 15px 0',
        textAlign: 'center',
        borderRadius: '10px',
        fontSize: '14px',
        boxShadow: '0 2px 4px rgba(229, 62, 62, 0.1)',
    },
    success: {
        backgroundColor: '#e6ffed',
        color: '#22543d',
        padding: '12px',
        margin: '15px 15px 0',
        textAlign: 'center',
        borderRadius: '10px',
        fontSize: '14px',
        boxShadow: '0 2px 4px rgba(34, 84, 61, 0.1)',
    },
    modalContent: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    modalImage: {
        maxWidth: '90%',
        maxHeight: '90%',
        borderRadius: '10px',
    },
};

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
        
        .product-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 15px rgba(255, 140, 0, 0.35);
        }
        
        .product-input:focus, .product-textarea:focus, .product-select:focus {
            border-color: #ff8c00e0;
            outline: none;
            box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.15);
            background-color: #fff;
        }
        
        /* Scrollbar styling */
        .contentContainer::-webkit-scrollbar {
            width: 6px;
        }
        
        .contentContainer::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 10px;
        }
        
        .contentContainer::-webkit-scrollbar-thumb {
            background: rgba(255, 140, 0, 0.3);
            border-radius: 10px;
        }
        
        .contentContainer::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 140, 0, 0.5);
        }
        
        @media (max-width: 768px) {
            .form {
                padding: 20px 15px;
            }
            
            .imagePreview, .placeholderImage {
                height: 200px;
            }
        }
    `}</style>
);

export default EditProductPage;