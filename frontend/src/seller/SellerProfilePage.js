import React, { useState, useEffect } from 'react';
import { store } from '../api';

const SellerProfilePage = () => {
  const [sellerData, setSellerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSellerProfile();
  }, []);

  const fetchSellerProfile = async () => {
    setLoading(true);
    setError('');
    try {
      // Use getSellerProfile to fetch the seller's profile data
      const data = await store.getSellerProfile();
      setSellerData(data);
      console.log('Fetched seller profile:', data);
    } catch (err) {
      setError(err.message || 'Failed to fetch seller profile');
      console.error('Error fetching seller profile:', err);
      
      // Fallback to getMyStore if getSellerProfile fails
      try {
        const storeData = await store.getMyStore();
        setSellerData(storeData);
        console.log('Fallback: Fetched store data:', storeData);
      } catch (storeErr) {
        console.error('Error fetching fallback store data:', storeErr);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loadingContainer}>Loading...</div>;
  }

  if (error && !sellerData) {
    return <div style={styles.errorContainer}>{error}</div>;
  }

  if (!sellerData) {
    return <div style={styles.errorContainer}>No seller data found</div>;
  }

  return (
    <div style={styles.mainContainer}>
      <div style={styles.header}>
        <div style={styles.backButton}>
          <span style={styles.backArrow}>←</span>
          <span style={styles.headerText}>Seller Profile</span>
        </div>
      </div>

      <div style={styles.scrollContainer}>
        <div style={styles.contentContainer}>
          <div style={styles.profileCard}>
            <div style={styles.profileImageContainer}>
              <img
                src={sellerData.profileImage || '/default-profile.jpg'}
                alt="Profile"
                style={styles.profileImage}
              />
            </div>

            <div style={styles.profileInfo}>
              <h2 style={styles.sellerName}>{sellerData.name || sellerData.sellerName || 'Seller Name'}</h2>
              <div style={styles.roleBadge}>Seller</div>
            </div>

            <div style={styles.infoSection}>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Name</div>
                <div style={styles.infoValue}>{sellerData.name || sellerData.sellerName || 'Not available'}</div>
              </div>

              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Email</div>
                <div style={styles.infoValue}>{sellerData.email || 'Not available'}</div>
              </div>

              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Phone Number</div>
                <div style={styles.infoValue}>{sellerData.contactNumber || 'Not available'}</div>
              </div>

              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Role</div>
                <div style={styles.infoValue}>Seller</div>
              </div>

              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Store Name</div>
                <div style={styles.infoValue}>{sellerData.storeName || (sellerData.store && sellerData.store.storeName) || 'Not available'}</div>
              </div>

              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Member Since</div>
                <div style={styles.infoValue}>
                  {sellerData.createdAt 
                    ? new Date(sellerData.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Not available'}
                </div>
              </div>
            </div>

            <div style={styles.statsSection}>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{sellerData.productsCount || (sellerData.store && sellerData.store.productsCount) || 0}</div>
                <div style={styles.statLabel}>Products</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{sellerData.ordersCount || (sellerData.store && sellerData.store.ordersCount) || 0}</div>
                <div style={styles.statLabel}>Orders</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{sellerData.rating || (sellerData.store && sellerData.store.rating) || '0.0'}</div>
                <div style={styles.statLabel}>Rating</div>
              </div>
            </div>
          </div>

          <div style={styles.actionButtonContainer}>
            <button style={styles.editProfileButton} onClick={() => window.location.href = '/seller/store-settings'}>
              Edit Store Settings
            </button>
          </div>
        </div>
      </div>
      <ResponsiveStyle />
    </div>
  );
};

const styles = {
  mainContainer: {
    backgroundColor: '#f9f9f9',
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  scrollContainer: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch', /* For smooth scrolling on iOS */
    height: 'calc(100vh - 50px)', /* Subtract header height */
    paddingBottom: '30px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100%',
    fontSize: '16px',
    color: '#666',
  },
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100%',
    fontSize: '16px',
    color: '#e53e3e',
    padding: '0 20px',
    textAlign: 'center',
  },
  contentContainer: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
  },
  header: {
    padding: '15px 20px',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    height: '50px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  backArrow: {
    fontSize: '20px',
    marginRight: '10px',
    color: '#333',
  },
  headerText: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#333',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  profileImageContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '30px 0 20px',
    backgroundColor: '#f5f5f5',
  },
  profileImage: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid white',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  profileInfo: {
    textAlign: 'center',
    padding: '0 20px 20px',
    backgroundColor: '#f5f5f5',
  },
  sellerName: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
    margin: '10px 0 5px',
  },
  roleBadge: {
    display: 'inline-block',
    backgroundColor: '#FF8A00',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
  },
  infoSection: {
    padding: '20px',
    borderBottom: '1px solid #eee',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f5f5f5',
  },
  infoLabel: {
    color: '#777',
    fontSize: '15px',
    fontWeight: '500',
  },
  infoValue: {
    color: '#333',
    fontSize: '15px',
    fontWeight: '400',
    textAlign: 'right',
  },
  statsSection: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '20px',
  },
  statBox: {
    textAlign: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
  },
  statLabel: {
    fontSize: '14px',
    color: '#777',
    marginTop: '5px',
  },
  actionButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '20px',
  },
  editProfileButton: {
    backgroundColor: '#FF8A00',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'background-color 0.2s',
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
      overflow: hidden;
    }
    
    html, body, #root {
      height: 100%;
    }
    
    /* Custom scrollbar styles */
    .scrollContainer::-webkit-scrollbar {
      width: 6px;
    }
    
    .scrollContainer::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .scrollContainer::-webkit-scrollbar-thumb {
      background-color: rgba(0,0,0,0.2);
      border-radius: 3px;
    }
    
    button:hover {
      opacity: 0.9;
    }
    
    @media (max-width: 768px) {
      .profileImageContainer {
        padding: 25px 0 15px;
      }
      .profileImage {
        width: 100px;
        height: 100px;
      }
      .sellerName {
        font-size: 22px;
      }
      .statValue {
        font-size: 20px;
      }
    }
    
    @media (max-width: 480px) {
      .contentContainer {
        padding: 15px;
      }
      .infoRow {
        flex-direction: column;
        padding: 10px 0;
      }
      .infoValue {
        text-align: left;
        margin-top: 5px;
      }
      .profileImage {
        width: 90px;
        height: 90px;
      }
      .sellerName {
        font-size: 20px;
      }
      .statValue {
        font-size: 18px;
      }
    }
    
    @media (max-width: 380px) {
      .statsSection {
        flex-direction: column;
        gap: 15px;
      }
      .header {
        padding: 12px 15px;
      }
      .backArrow {
        font-size: 18px;
      }
      .headerText {
        font-size: 16px;
      }
    }
  `}</style>
);

export default SellerProfilePage;
