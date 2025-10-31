import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { supabase } from '../supabaseClient';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data?.session?.user || null;
        if (mounted) setUser(sessionUser);
        setChecking(false);
        setReady(true);
      } catch (err) {
        console.error('[ProtectedRoute] Failed to load Supabase session:', err);
        if (mounted) setReady(true);
      }
    };

    initAuth();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user || null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  if (!ready || checking) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    console.warn('[ProtectedRoute] No user → redirecting to /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const role = user.user_metadata?.role || user.role;
    console.log('[ProtectedRoute] Detected role:', role);
    if (!role || role !== requiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export const CustomerRoute = ({ children }) => (
  <ProtectedRoute requiredRole="Customer">{children}</ProtectedRoute>
);

export const SellerRoute = ({ children }) => (
  <ProtectedRoute requiredRole="Seller">{children}</ProtectedRoute>
);

export default ProtectedRoute;
