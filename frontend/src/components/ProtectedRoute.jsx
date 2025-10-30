import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { supabase } from '../supabaseClient';

// Protected Route using Supabase session directly
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data?.session?.user || null);
      setReady(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user || null);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  if (!ready) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const role = user.user_metadata?.role || user.role;
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
