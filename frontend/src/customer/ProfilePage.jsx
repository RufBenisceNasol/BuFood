import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api';
import {
  Container,
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Grid,
  Button,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { ArrowBack, Edit } from '@mui/icons-material';

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
      // Get the raw response first
      const rawResponse = await auth.getMe();
      console.log('Raw API response:', rawResponse);
      
      // Extract the user data from the response
      let data;
      
      // Check all possible locations for user data
      if (rawResponse && typeof rawResponse === 'object') {
        // Try to find user data in common response structures
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
      
      // Ensure required fields have values
      const processedData = {
        ...data,
        name: data.name || data.fullName || data.username || 'User',
        email: data.email || '',
        contactNumber: data.contactNumber || data.phone || data.phoneNumber || '',
        role: data.role || data.userRole || 'User'
      };
      
      setUserData(processedData);
      console.log('Final processed user data:', processedData);
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
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#FF8C00' }} />
      </Box>
    );
  }

  if (error && !userData) {
    return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
  }

  if (!userData) {
    return <Alert severity="warning" sx={{ m: 4 }}>No user data found</Alert>;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={handleGoBack}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" 
          sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #FF8C00 30%, #FF6B00 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          My Profile
        </Typography>
      </Box>

      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: 2,
          transition: 'transform 0.3s, box-shadow 0.3s',
          '&:hover': {
            boxShadow: '0 8px 16px rgba(255, 140, 0, 0.2)'
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Avatar 
            src={userData.profileImage} 
            alt={userData.name} 
            sx={{ 
              width: 120, 
              height: 120, 
              fontSize: '3rem',
              bgcolor: '#FF8C00',
              mb: 2
            }}
          >
            {userData.name && userData.name.trim() ? userData.name.charAt(0).toUpperCase() : '?'}
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            {userData.name || 'User'}
          </Typography>
          <Chip 
            label={userData.role}
            sx={{ 
              bgcolor: '#FF8C00', 
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Full Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {userData.name}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {userData.email || '—'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Contact Number
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {userData.contactNumber || '—'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Role
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {userData.role}
              </Typography>
            </Box>
          </Grid>

          {userData.store && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Store Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {userData.store.storeName || userData.storeName || 'Not available'}
                </Typography>
              </Box>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Member Since
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {userData.createdAt || userData.memberSince
                  ? new Date(userData.createdAt || userData.memberSince).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Not available'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            startIcon={<Edit />}
            sx={{
              bgcolor: '#FF8C00',
              '&:hover': {
                bgcolor: '#FF6B00'
              }
            }}
          >
            Edit Profile
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProfilePage; 