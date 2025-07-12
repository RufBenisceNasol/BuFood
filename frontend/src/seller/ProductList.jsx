import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { product } from '../api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdAdd, MdMoreVert, MdEdit, MdDelete } from 'react-icons/md';

const ProductList = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


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



    const handleProductClick = (prod) => {
        navigate(`/seller/product/${prod._id}`);
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
                                <div 
                                    style={styles.imageContainer}
                                    onClick={() => handleProductClick(prod)}
                                >
                                    <img 
                                        src={prod.image} 
                                        alt={prod.name}
                                        style={styles.productImage}
                                    />
                                    <div style={styles.availabilityBadge(prod.availability)}>
                                        {styles.availabilityBadge(prod.availability).label}
                                    </div>
                                </div>
                                <div style={styles.productInfo}>
                                    <h3 style={styles.productName}>{prod.name}</h3>
                                    <div style={styles.productActions}>
                                    </div>
                                </div>
                        </div>
                        ))}
                    </div>
                )}
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

                .productCard {
                    cursor: pointer;
                    transition: transform 0.3s, box-shadow 0.3s;
                }
                
                .productCard:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
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
        height: '60px',
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
    availabilityBadge: (availability) => {
        let bgColor = 'rgba(231, 76, 60, 0.9)';
        let label = 'Out of Stock';
        if (availability === 'Available') {
            bgColor = 'rgba(46, 204, 113, 0.9)';
            label = 'Available';
        } else if (availability === 'Pending') {
            bgColor = 'rgba(255, 140, 0, 0.9)';
            label = 'Pending';
        }
        return {
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: bgColor,
            color: 'white',
            label: label
        };
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
    productActions: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '10px',
        padding: '0 10px',
    },
    switchContainer: {
        display: 'flex',
        alignItems: 'center',
    },
    dropdownContainer: {
        position: 'relative',
    },
    moreButton: {
        background: 'none',
        border: 'none',
        padding: '5px',
        cursor: 'pointer',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s',
    },
    dropdown: {
        position: 'absolute',
        right: '0',
        top: '100%',
        backgroundColor: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        padding: '5px 0',
        zIndex: 1000,
        minWidth: '120px',
    },
    dropdownItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 15px',
        width: '100%',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        color: '#333',
        fontSize: '14px',
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
};

export default ProductList;