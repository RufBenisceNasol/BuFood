import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api';
import styled, { createGlobalStyle } from 'styled-components';
import { MdArrowBack, MdEdit, MdPerson, MdEmail, MdPhone, MdDateRange } from 'react-icons/md';

// Styled Components
const MainContainer = styled.div`
  background-color: #ffffff;
  height: 100vh;
  height: 100dvh;
  width: 100vw;
  max-width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overscroll-behavior-y: none;
`;

const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px 80px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
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
  padding: 20px 0;
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
  padding: 30px 20px 20px;
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

  if (loading) {
    return (
      <LoadingContainer>
        Loading...
      </LoadingContainer>
    );
  }

  if (error && !userData) {
    return (
      <ErrorContainer>
        {error}
      </ErrorContainer>
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
        <BackButton onClick={() => navigate(-1)}>
          <MdArrowBack size={24} />
        </BackButton>
        <h2 style={{ margin: '0 auto', fontSize: '18px', fontWeight: '600' }}>My Profile</h2>
        <div style={{ width: '40px' }}></div> {/* For balance */}
      </Header>

      <ScrollContent>
        <ContentContainer>
          <AvatarSection>
            <ProfileAvatarWrapper>
              <ProfileAvatar>
                {userData.name && (
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
                )}
              </ProfileAvatar>
            </ProfileAvatarWrapper>
            <UserInfo>
              <UserName>{userData.name}</UserName>
              <RoleBadge>{userData.role}</RoleBadge>
            </UserInfo>
          </AvatarSection>

          <FormContainer>
            <ProfileDetails>
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
              <DetailItem>
                <DetailLabel>
                  <DetailIcon><MdDateRange /></DetailIcon>
                  Member Since
                </DetailLabel>
                <DetailValue>
                  {userData.createdAt || userData.memberSince
                    ? new Date(userData.createdAt || userData.memberSince).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : '—'}
                </DetailValue>
              </DetailItem>
              <ButtonRow>
                <EditButton>
                  <MdEdit />
                  Edit Profile
                </EditButton>
              </ButtonRow>
            </ProfileDetails>
          </FormContainer>
        </ContentContainer>
      </ScrollContent>
    </MainContainer>
  );
};

export default ProfilePage; 