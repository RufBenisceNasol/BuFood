import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, customer } from '../api';
import styled, { createGlobalStyle } from 'styled-components';
import { MdArrowBack, MdEdit, MdPerson, MdEmail, MdPhone, MdDateRange, MdHome, MdFavoriteBorder, MdShoppingCart, MdStore } from 'react-icons/md';

const styles = {
  bottomNav: {
    borderRadius: '29px 29px 0 0',
    boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
  }
};
// Styled Components
const MainContainer = styled.div`
  background-color: #ffffff;
  height: 100vh;
  width: 100vw;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overscroll-behavior-y: none;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
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

const Header = styled.div`
  padding: 10px 16px;
  display: flex;
  align-items: center;
  background-color: #ff8c00;
  color: white;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  flex-shrink: 0;
`;

const BackButton = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  font-weight: 500;
`;

const HeaderText = styled.span`
  margin-left: 8px;
  font-size: 18px;
  font-weight: 600;
`;

const ContentContainer = styled.div`
  padding: 10px 0;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 10px 2px;
  background: white;
  margin-bottom: 10px;
`;

const ProfileAvatarWrapper = styled.div`
  position: relative;
  margin-bottom: 15px;
`;

const ProfileAvatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto;
  border: 4px solid white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s;
`;

const UserInfo = styled.div`
  text-align: center;
`;

const UserName = styled.h2`
  margin: 5px 0;
  font-size: 22px;
  font-weight: 600;
  color: #333;
`;

const RoleBadge = styled.div`
  background: linear-gradient(135deg, #fbaa39, #fc753b);
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const FormContainer = styled.div`
  background-color: white;
  border-radius: 16px;
  margin: 0 15px 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
`;

const ProfileDetails = styled.div`
  padding: 20px;
`;

const DetailItem = styled.div`
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
`;

const DetailLabel = styled.div`
  display: flex;
  align-items: center;
  color: #666;
  font-size: 14px;
  flex: 1;
`;

const DetailIcon = styled.span`
  margin-right: 10px;
  color: #ff8c00;
`;

const DetailValue = styled.div`
  font-weight: 500;
  color: #333;
  flex: 1;
  text-align: right;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 25px;
  gap: 10px;
`;

const EditButton = styled.button`
  background: linear-gradient(135deg, #fbaa39, #fc753b);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 25px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 140, 0, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(255, 140, 0, 0.4);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #fff;
  font-size: 16px;
  color: #666;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #fff;
  color: #e53e3e;
  font-size: 16px;
  padding: 20px;
  text-align: center;
`;

const ChangeButton = styled.button`
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0,0,0,0.7);
  color: #fff;
  border: none;
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 13px;
  cursor: pointer;
  z-index: 2;
  transition: background 0.2s;
  &:hover {
    background: #ff8c00;
    color: #fff;
  }
`;

// Responsive styles
const GlobalStyle = createGlobalStyle`
  @media (max-width: 480px) {
    ${DetailItem} {
      flex-direction: column;
      gap: 5px;
    }
    
    ${DetailValue} {
      text-align: left;
    }
  }
`;

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', contactNumber: '', profileImage: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const rawResponse = await auth.getMe();
      console.log('Raw API response:', rawResponse);
      
      let data;
      if (rawResponse && typeof rawResponse === 'object') {
        if (rawResponse.user) {
          data = rawResponse.user;
        } else if (rawResponse.data && rawResponse.data.user) {
          data = rawResponse.data.user;
        } else if (rawResponse.data) {
          data = rawResponse.data;
        } else {
          data = rawResponse;
        }
      } else {
        data = { name: 'Unknown User', email: 'No email available' };
      }
      
      const processedData = {
        ...data,
        name: data.name || data.fullName || data.username || 'User',
        email: data.email || '',
        contactNumber: data.contactNumber || data.phone || data.phoneNumber || '',
        role: data.role || data.userRole || 'User'
      };
      
      setUserData(processedData);
    } catch (err) {
      setError(err.message || 'Failed to fetch user profile');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (userData?.role === 'Seller') {
      navigate('/seller/dashboard');
    } else {      navigate('/customer/home');
    }
  };

  const startEdit = () => {
    setEditData({
      name: userData.name || '',
      contactNumber: userData.contactNumber || '',
      profileImage: userData.profileImage || ''
    });
    setEditing(true);
    setEditError('');
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditError('');
  };

  const handleEditChange = e => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const submitEdit = async e => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const updated = await customer.updateProfile(editData);
      setUserData(prev => ({ ...prev, ...updated.user }));
      setEditing(false);
    } catch (err) {
      setEditError(err.message || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const result = await customer.uploadProfileImage(file);
      // Auto-save profile with new image
      const autoSaveData = {
        name: editData.name,
        contactNumber: editData.contactNumber,
        profileImage: result.imageUrl
      };
      setEditLoading(true);
      const updated = await customer.updateProfile(autoSaveData);
      setUserData(prev => ({ ...prev, ...updated.user }));
      setEditData(prev => ({ ...prev, profileImage: result.imageUrl }));
      setEditLoading(false);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload image');
      setEditLoading(false);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <MainContainer>
        <LoadingContainer>
          Loading...
        </LoadingContainer>
      </MainContainer>
    );
  }

  if (error && !userData) {
    return (
      <MainContainer>
        <ErrorContainer>
          {error}
        </ErrorContainer>
      </MainContainer>
    );
  }

  if (!userData) {
    return (
      <ErrorContainer>
        No user data found
      </ErrorContainer>
    );
  }

  return (
    <MainContainer>
      <GlobalStyle />
      <Header>
        <BackButton onClick={handleGoBack}>
          <MdArrowBack size={24} />
        </BackButton>
        <h2 style={{ margin: '0 auto', fontSize: '18px', fontWeight: '600' }}>My Profile</h2>
        <div style={{ width: '40px' }}></div> {/* For balance */}
      </Header>
      <ScrollableContent>
        <ContentContainer>
          <AvatarSection>
            <ProfileAvatarWrapper>
              <ProfileAvatar>
                {editing ? (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploading}
                      style={{ display: 'none' }}
                      ref={fileInput => (window.profileFileInput = fileInput)}
                    />
                    <ChangeButton type="button" onClick={() => window.profileFileInput && window.profileFileInput.click()}>
                      Change
                    </ChangeButton>
                    {editData.profileImage ? (
                      <img src={editData.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : userData.name ? (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#ff8c00e0',
                        color: 'white',
                        fontSize: '48px',
                        fontWeight: 'bold',
                        borderRadius: '50%'
                      }}>
                        {userData.name.charAt(0).toUpperCase()}
                      </div>
                    ) : null}
                    {uploading && <div style={{ color: '#888', fontSize: 13, marginTop: 6 }}>Uploading...</div>}
                    {uploadError && <div style={{ color: 'red', fontSize: 13, marginTop: 6 }}>{uploadError}</div>}
                  </>
                ) : userData.profileImage ? (
                  <img src={userData.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : userData.name ? (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#ff8c00e0',
                    color: 'white',
                    fontSize: '48px',
                    fontWeight: 'bold'
                  }}>
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                ) : null}
              </ProfileAvatar>
            </ProfileAvatarWrapper>
            <UserInfo>
              <UserName>{userData.name}</UserName>
              <RoleBadge>{userData.role}</RoleBadge>
            </UserInfo>
          </AvatarSection>

          <FormContainer>
          
            <ProfileDetails>
              {editing ? (
                <form onSubmit={submitEdit}>
                  <DetailItem>
                    <DetailLabel>
                      <DetailIcon><MdPerson /></DetailIcon>
                      Full Name
                    </DetailLabel>
                    <DetailValue>
                      <input
                        type="text"
                        name="name"
                        value={editData.name}
                        onChange={handleEditChange}
                        style={{ width: '100%', padding: 6, fontSize: 15 }}
                        required
                      />
                    </DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>
                      <DetailIcon><MdPhone /></DetailIcon>
                      Contact Number
                    </DetailLabel>
                    <DetailValue>
                      <input
                        type="text"
                        name="contactNumber"
                        value={editData.contactNumber}
                        onChange={handleEditChange}
                        style={{ width: '100%', padding: 6, fontSize: 15 }}
                        required
                      />
                    </DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>
                      <DetailIcon><MdEmail /></DetailIcon>
                      Email
                    </DetailLabel>
                    <DetailValue>{userData.email || '—'}</DetailValue>
                  </DetailItem>

                  <ButtonRow>
                    <EditButton type="submit" disabled={editLoading} style={{ minWidth: 120 }}>
                      {editLoading ? 'Saving...' : 'Save'}
                    </EditButton>
                    <EditButton type="button" onClick={cancelEdit} style={{ background: '#ccc', color: '#333' }}>
                      Cancel
                    </EditButton>
                  </ButtonRow>
                  {editError && <div style={{ color: 'red', marginTop: 10 }}>{editError}</div>}
                </form>
              ) : (
                <>
              <DetailItem>
                <DetailLabel>
                  <DetailIcon><MdPerson /></DetailIcon>
                  Full Name
                </DetailLabel>
                <DetailValue>{userData.name || '—'}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>
                  <DetailIcon><MdEmail /></DetailIcon>
                  Email
                </DetailLabel>
                <DetailValue>{userData.email || '—'}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>
                  <DetailIcon><MdPhone /></DetailIcon>
                  Contact Number
                </DetailLabel>
                <DetailValue>{userData.contactNumber || '—'}</DetailValue>
              </DetailItem>

              <ButtonRow>
                    <EditButton type="button" onClick={startEdit}>
                  <MdEdit />
                  Edit Profile
                </EditButton>
              </ButtonRow>
                </>
              )}
            </ProfileDetails>
          
          </FormContainer>
        </ContentContainer>
      </ScrollableContent>
      {/* Bottom Navigation */}
      <div className="bottomNav" style={styles.bottomNav}>
          <div className="navItem" onClick={() => navigate('/customer/home')}>
            <MdHome size={24} />
            <span className="navText">Home</span>
          </div>
          <div className="navItem" onClick={() => navigate('/customer/favorites')}>
            <MdFavoriteBorder size={24} />
            <span className="navText">Favorites</span>
          </div>
          <div className="navItem" onClick={() => navigate('/customer/cart')}>
            <MdShoppingCart size={24} />
            <span className="navText">Cart</span>
          </div>
          <div className="navItem" onClick={() => navigate('/customer/stores')}>
            <MdStore size={24} />
            <span className="navText">Stores</span>
          </div>
          <div className="navItem activeNavItem" onClick={() => navigate('/customer/profile')}>
            <MdPerson size={24} className="activeNavIcon" />
            <span className="navText">Profile</span>
          </div>
        </div>
      
    </MainContainer>
  );
};

export default ProfilePage;