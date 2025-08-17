import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api';
import { getToken, getUser } from '../utils/tokenUtils';
import {
  Container,
  Box,
  Typography,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Switch,
  IconButton,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Lock,
  Notifications,
  Help,
  ExitToApp,
  Edit,
  LocationOn,
  Phone,
  ChevronRight,
  DarkMode
} from '@mui/icons-material';

const SettingsPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        // Check if user is logged in by looking at localStorage token
        const token = getToken();
        
        if (!token) {
          // If no token, redirect to login
          navigate('/login');
          return;
        }
        
        // Get user preferences from localStorage or set defaults
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        const savedNotifications = localStorage.getItem('notifications') !== 'false';
        
        setDarkMode(savedDarkMode);
        setNotificationsEnabled(savedNotifications);
        
        // Get user data from API using auth.getMe instead of userApi
        try {
          const userData = await auth.getMe();
          setUser(userData.user || userData);
        } catch (err) {
          console.error('Failed to fetch user data:', err);
          // Fallback to localStorage user
          const localUser = getUser() || {};
          setUser(localUser);
        }
        
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [navigate]);

  // Ask for browser notification permission when enabling notifications
  const requestNotificationPermission = async () => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return { ok: false, reason: 'Notifications are not supported in this browser.' };
      }
      const permission = await Notification.requestPermission();
      return { ok: permission === 'granted', permission };
    } catch (e) {
      return { ok: false, reason: 'Failed to request notification permission.' };
    }
  };

  const handleGoBack = () => {
    navigate('/customer/home');
  };

  const navigateToProfile = () => {
    navigate('/customer/profile');
  };

  const navigateToChangePassword = () => {
    navigate('/customer/change-password');
  };

  const handleToggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', newValue.toString());
    // Apply dark mode to the app (implementation depends on your app's theme system)
  };

  const handleToggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    if (newValue) {
      // Attempt to enable: request permission first
      const result = await requestNotificationPermission();
      if (!result.ok) {
        setError(result.reason || 'Notifications permission was not granted.');
        setNotificationsEnabled(false);
        localStorage.setItem('notifications', 'false');
        return;
      }
    }
    setNotificationsEnabled(newValue);
    localStorage.setItem('notifications', newValue.toString());
  };

  const handleGetHelp = () => {
    // Open help section or contact support
    window.open('mailto:support@bufood.com', '_blank');
  };

  const handleLogout = async () => {
    await auth.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#FF8C00' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton 
          onClick={handleGoBack}
          sx={{ mr: 2 }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" 
          sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #FF8C00 30%, #FF6B00 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Settings
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Avatar 
          sx={{ 
            width: 64, 
            height: 64, 
            bgcolor: '#FF8C00', 
            fontSize: '1.5rem',
            mr: 2
          }}
        >
          {user?.name?.charAt(0) || 'U'}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email || 'email@example.com'}
          </Typography>
        </Box>
        <IconButton 
          onClick={navigateToProfile}
          sx={{ color: '#FF8C00' }}
        >
          <Edit />
        </IconButton>
      </Paper>


      <Typography 
        variant="h6" 
        sx={{ 
          mb: 2, 
          fontWeight: 'bold', 
          color: 'text.secondary' 
        }}
      >
        Preferences
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          mb: 4,
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <List disablePadding>
          <ListItem>
            <ListItemIcon>
              <Notifications sx={{ color: '#FF8C00' }} />
            </ListItemIcon>
            <ListItemText primary="Notifications" />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={notificationsEnabled}
                onChange={handleToggleNotifications}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#FF8C00',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 140, 0, 0.08)',
                    },
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#FF8C00',
                  },
                }}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>



      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button
          variant="contained"
          color="error"
          startIcon={<ExitToApp />}
          onClick={handleLogout}
          sx={{ px: 4 }}
        >
          Logout
        </Button>
      </Box>
    </Container>
  );
};

export default SettingsPage;