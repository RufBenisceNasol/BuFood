import React, { useState, useEffect } from 'react';
import { store } from '../api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StoreSettings = () => {
    const [storeData, setStoreData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        storeName: '',
        image: null,
        bannerImage: null
    });

    useEffect(() => {
        fetchStoreData();
    }, []);

    const fetchStoreData = async () => {
        try {
            const data = await store.getMyStore();
            setStoreData(data);
            setFormData({
                storeName: data.storeName,
                image: null,
                bannerImage: null
            });
        } catch (err) {
            setError(err.message || 'Failed to fetch store data');
            toast.error(err.message || 'Failed to fetch store data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setFormData(prev => ({
                ...prev,
                [name]: files[0]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updatedFormData = new FormData();
            if (formData.storeName !== storeData.storeName) {
                updatedFormData.append('storeName', formData.storeName);
            }
            if (formData.image) {
                updatedFormData.append('image', formData.image);
            }
            if (formData.bannerImage) {
                updatedFormData.append('bannerImage', formData.bannerImage);
            }

            await store.updateStore(storeData._id, updatedFormData);
            await fetchStoreData();
            setIsEditing(false);
            toast.success('Store updated successfully');
        } catch (err) {
            setError(err.message || 'Failed to update store');
            toast.error(err.message || 'Failed to update store');
        }
    };

    if (loading) {
        return <div className="store-settings-container">Loading...</div>;
    }

    return (
        <div className="store-settings-container" style={styles.container}>
            <ToastContainer position="top-right" autoClose={3000} />
            
            <div className="store-header" style={styles.header}>
                <h1 style={styles.title}>Store Settings</h1>
                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    style={styles.editButton}
                >
                    {isEditing ? 'Cancel' : 'Edit Store'}
                </button>
            </div>

            {error && <div className="error-message" style={styles.errorMessage}>{error}</div>}

            {isEditing ? (
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div className="form-group" style={styles.formGroup}>
                        <label htmlFor="storeName" style={styles.label}>Store Name</label>
                        <input
                            type="text"
                            id="storeName"
                            name="storeName"
                            value={formData.storeName}
                            onChange={handleInputChange}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div className="form-group" style={styles.formGroup}>
                        <label htmlFor="bannerImage" style={styles.label}>Banner Image</label>
                        <input
                            type="file"
                            id="bannerImage"
                            name="bannerImage"
                            onChange={handleInputChange}
                            style={styles.fileInput}
                            accept="image/*"
                        />
                    </div>

                    <div className="form-group" style={styles.formGroup}>
                        <label htmlFor="image" style={styles.label}>Store Logo</label>
                        <input
                            type="file"
                            id="image"
                            name="image"
                            onChange={handleInputChange}
                            style={styles.fileInput}
                            accept="image/*"
                        />
                    </div>

                    <button type="submit" style={styles.submitButton}>
                        Save Changes
                    </button>
                </form>
            ) : (
                <div className="store-info" style={styles.storeInfo}>
                    <div className="banner-image-container" style={styles.bannerContainer}>
                        <img 
                            src={storeData.bannerImage} 
                            alt="Store Banner"
                            style={styles.bannerImage}
                        />
                    </div>
                    <div className="store-image-container" style={styles.imageContainer}>
                        <img 
                            src={storeData.image} 
                            alt={storeData.storeName}
                            style={styles.storeImage}
                        />
                    </div>
                    <div className="store-details" style={styles.storeDetails}>
                        <h2 style={styles.storeName}>{storeData.storeName}</h2>
                        <p style={styles.productCount}>
                            Total Products: {storeData.products ? storeData.products.length : 0}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        maxWidth: '800px',
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
    editButton: {
        padding: '10px 20px',
        backgroundColor: '#ff8c00e0',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
    },
    form: {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    formGroup: {
        marginBottom: '20px'
    },
    label: {
        display: 'block',
        marginBottom: '5px',
        color: '#666',
        fontSize: '14px'
    },
    input: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '16px'
    },
    fileInput: {
        width: '100%'
    },
    submitButton: {
        padding: '10px 20px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px'
    },
    storeInfo: {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    bannerContainer: {
        width: '100%',
        height: '200px',
        marginBottom: '20px',
        overflow: 'hidden',
        borderRadius: '10px'
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    imageContainer: {
        width: '100%',
        height: '200px',
        marginBottom: '20px',
        overflow: 'hidden',
        borderRadius: '10px'
    },
    storeImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    storeDetails: {
        textAlign: 'center'
    },
    storeName: {
        margin: '0 0 10px 0',
        fontSize: '24px',
        color: '#333'
    },
    productCount: {
        margin: '0',
        color: '#666'
    },
    errorMessage: {
        backgroundColor: '#ffebee',
        color: '#f44336',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '20px'
    }
};

export default StoreSettings;