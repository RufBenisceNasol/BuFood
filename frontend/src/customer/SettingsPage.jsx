import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api';
import { getToken, getUser } from '../utils/tokenUtils';
import { supabase } from '../supabaseClient';

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
import { ArrowBack, Notifications, ExitToApp, Edit } from '@mui/icons-material';

const deriveUserFromSession = (sessionUser, defaultRole = 'Customer') => {
  if (!sessionUser) {
    return { role: defaultRole };
  }
  const metadata = sessionUser.user_metadata || {};
  const email = sessionUser.email || metadata.email || '';
  const nameFromMetadata = metadata.name || metadata.fullName || metadata.username;
  const fallbackName = email ? email.split('@')[0] : defaultRole;
  return {
    supabaseId: sessionUser.id,
    role: metadata.role || defaultRole,
    email,
    name: nameFromMetadata || fallbackName || defaultRole,
    profileImage: metadata.profileImage || metadata.avatar_url || metadata.picture || null,
    contactNumber: metadata.contactNumber || metadata.phone || metadata.phoneNumber || ''
  };
};

const mergeUserProfile = (primary = {}, sessionUser, defaultRole = 'Customer') => {
  const sessionDerived = deriveUserFromSession(sessionUser, defaultRole);
  const merged = { ...sessionDerived, ...primary };
  merged.supabaseId = primary.supabaseId || primary.supabase_id || sessionDerived.supabaseId || null;
  merged.email = primary.email || sessionDerived.email || '';
  merged.name = primary.name || sessionDerived.name || (merged.email ? merged.email.split('@')[0] : defaultRole);
  merged.profileImage = primary.profileImage || primary.image || sessionDerived.profileImage || null;
  merged.contactNumber = primary.contactNumber || primary.phone || primary.phoneNumber || sessionDerived.contactNumber || '';
  merged.role = primary.role || sessionDerived.role || defaultRole;
  return merged;
};

const SettingsPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationsBusy, setNotificationsBusy] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        // Check Supabase session and legacy token
        const { data } = await supabase.auth.getSession();
        const session = data?.session || null;
        const sessionUser = session?.user || null;
        setSupabaseUser(sessionUser);
        const supabaseToken = session?.access_token || null;
        const token = getToken();
        
        if (!supabaseToken && !token) {
          navigate('/login');
          return;
        }
        
        // Get user preferences from localStorage or set defaults
        const savedNotifications = localStorage.getItem('notifications') !== 'false';
        
        setNotificationsEnabled(savedNotifications);
        
        // Get user data from API using auth.getMe instead of userApi
        try {
          const userData = await auth.getMe();
          const backendUser = userData?.user || userData || {};
          setUser(mergeUserProfile(backendUser, sessionUser, 'Customer'));
        } catch (err) {
          console.error('Failed to fetch user data:', err);
          // Fallback to localStorage user
          const localUser = getUser() || {};
          const resolved = mergeUserProfile(localUser, sessionUser, 'Customer');
          setUser(Object.keys(resolved).length ? resolved : null);
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

  const handleToggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsBusy(true);
    setError('');
    try {
      if (newValue) {
        // Attempt to enable: request permission first
        const result = await requestNotificationPermission();
        if (!result.ok) {
          throw new Error(result.reason || 'Notifications permission was not granted.');
        }
      }
      setNotificationsEnabled(newValue);
      localStorage.setItem('notifications', newValue.toString());
    } catch (err) {
      console.error('Notification toggle failed:', err);
      setNotificationsEnabled(false);
      localStorage.setItem('notifications', 'false');
      setError(err?.message || 'Unable to update notification settings.');
    } finally {
      setNotificationsBusy(false);
    }
  };

  const handleGetHelp = () => {
    // Open help section or contact support
    window.open('mailto:support@bufood.com', '_blank');
  };

  const handleLogout = async () => {
    await auth.logout();
    navigate('/login');
  };

  const avatarProps = useMemo(() => {
    const profileImage = user?.profileImage || null;
    return profileImage ? { src: profileImage } : {};
  }, [user]);

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
          {...avatarProps}
          sx={{ 
            width: 64, 
            height: 64, 
            bgcolor: '#FF8C00', 
            fontSize: '1.5rem',
            mr: 2
          }}
        >
          {(!avatarProps.src && user?.name?.charAt(0)) || 'U'}
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
                disabled={notificationsBusy || (!supabaseUser && !getToken())}
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