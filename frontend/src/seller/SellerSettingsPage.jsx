import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Avatar,
  IconButton,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch
} from '@mui/material';
import { ArrowBack, DeleteForever, Logout, Notifications, DarkMode, Visibility, VisibilityOff } from '@mui/icons-material';
import { auth } from '../api';
import { getToken, getUser } from '../utils/tokenUtils';
import { supabase } from '../supabaseClient';
import { initPushNotifications } from '../utils/pushNotifications';

const SellerSettingsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [supabaseUser, setSupabaseUser] = useState(null);
  const confirmInputRef = useRef(null);
  const CONFIRM_KEYWORD = 'DELETE';
  const isKeywordValid = (text) => (text || '').trim().toUpperCase() === CONFIRM_KEYWORD.toUpperCase();
  const SHOW_DELETE_ACCOUNT = false; // feature flag to temporarily hide delete UI
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session || null;
        setSupabaseUser(session?.user || null);
        const supabaseToken = session?.access_token || null;
        const legacyToken = getToken();
        if (!supabaseToken && !legacyToken) {
          navigate('/login');
          return;
        }
        try {
          const me = await auth.getMe();
          setUser(me.user || me);
        } catch (e) {
          setUser(getUser() || null);
        }
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        const savedNotifications = localStorage.getItem('notifications') !== 'false';
        setDarkMode(savedDarkMode);
        setNotificationsEnabled(savedNotifications);
      } catch (e) {
        setError('Failed to load account');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  useEffect(() => {
    if (deleteOpen) {
      setTimeout(() => confirmInputRef.current?.focus(), 0);
    }
  }, [deleteOpen]);

  const handleBack = () => navigate('/seller/dashboard');

  const handleLogout = async () => {
    await auth.logout();
    navigate('/login');
  };

  const tryDeleteAccount = async () => {
    // Try legacy JWT path first (most common), then Supabase as fallback
    try {
      await auth.deleteAccount({ supabase: false });
      return true;
    } catch (e1) {
      try {
        await auth.deleteAccount({ supabase: true });
        return true;
      } catch (e2) {
        // Surface the more recent error but include the first as context when available
        const msg1 = typeof e1 === 'string' ? e1 : (e1?.message || '');
        const msg2 = typeof e2 === 'string' ? e2 : (e2?.message || '');
        throw new Error(msg2 || msg1 || 'Failed to delete account');
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!isKeywordValid(confirmText)) {
      setError(`Please type ${CONFIRM_KEYWORD} to confirm.`);
      return;
    }
    if (!password) {
      setError('Please enter your password to confirm deletion.');
      return;
    }
    try {
      setDeleting(true);
      await auth.login(user.email, password);
      await tryDeleteAccount();
      await auth.logout();
      navigate('/login');
    } catch (e) {
      const msg = typeof e === 'string' ? e : (e?.message || 'Failed to delete account');
      setError(msg);
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }} aria-label="Back">
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', background: 'linear-gradient(45deg, #FF8C00 30%, #FF6B00 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Account Settings
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2, display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: '#FF8C00', fontSize: '1.5rem', mr: 2 }}>
          {user?.name?.charAt(0) || 'U'}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{user?.name || 'Seller'}</Typography>
          <Typography variant="body2" color="text.secondary">{user?.email || 'email@example.com'}</Typography>
        </Box>
        <Button onClick={handleLogout} color="inherit" startIcon={<Logout />} sx={{ color: '#FF8C00' }}>Logout</Button>
      </Paper>

      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'text.secondary' }}>Preferences</Typography>
      <Paper elevation={3} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <List disablePadding>
          <ListItem>
            <ListItemIcon><Notifications sx={{ color: '#FF8C00' }} /></ListItemIcon>
            <ListItemText primary="Notifications" />
            <Switch
              edge="end"
              checked={notificationsEnabled}
              onChange={async () => {
                const next = !notificationsEnabled;
                setNotificationsEnabled(next);
                localStorage.setItem('notifications', next.toString());

                if (next) {
                  try {
                    const targetId = supabaseUser?.id || user?.supabaseId || user?.supabase_id || user?.id;
                    if (!targetId) throw new Error('Missing user information for push notifications');
                    await initPushNotifications(targetId);
                  } catch (err) {
                    console.error('Notification permission request failed:', err);
                    setNotificationsEnabled(false);
                    localStorage.setItem('notifications', 'false');
                    setError(err?.message || 'Unable to enable notifications on this device.');
                  }
                }
              }}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#FF8C00', '&:hover': { backgroundColor: 'rgba(255, 140, 0, 0.08)' } },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#FF8C00' },
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><DarkMode sx={{ color: '#FF8C00' }} /></ListItemIcon>
            <ListItemText primary="Dark Mode" />
            <Switch
              edge="end"
              checked={darkMode}
              onChange={() => {
                const next = !darkMode;
                setDarkMode(next);
                localStorage.setItem('darkMode', next.toString());
              }}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#FF8C00', '&:hover': { backgroundColor: 'rgba(255, 140, 0, 0.08)' } },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#FF8C00' },
              }}
            />
          </ListItem>
        </List>
      </Paper>

      {SHOW_DELETE_ACCOUNT && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" color="error" startIcon={<DeleteForever />} onClick={() => {
            if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
            setError('');
            setConfirmText('');
            setPassword('');
            setDeleteOpen(true);
          }}>
            Delete my account
          </Button>
        </Box>
      )}

      {SHOW_DELETE_ACCOUNT && (
      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This will permanently delete your account and all related data (cart, orders, reviews{user?.role === 'Seller' ? ', store and products' : ''}). This action cannot be undone.
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
            To proceed, please confirm by typing the keyword and re-entering your password for {user?.email || 'your account'}.
          </Typography>
          <TextField
            label={`Type "${CONFIRM_KEYWORD}" to confirm`}
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoFocus
            inputRef={confirmInputRef}
            disabled={deleting}
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={deleting}
            sx={{ mt: 2 }}
            InputProps={{
              endAdornment: (
                <IconButton aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(v => !v)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={deleting || !isKeywordValid(confirmText) || !password}>
            {deleting ? 'Deleting...' : 'Delete permanently'}
          </Button>
        </DialogActions>
      </Dialog>
      )}
    </Container>
  );
};

export default SellerSettingsPage;
