import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { supabase } from '../supabaseClient';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSession(data?.session || null);
        setReady(true);
      }
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_evt, newSession) => {
      if (mounted) setSession(newSession || null);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  if (!ready) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Not logged in
  if (!session?.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check from user_metadata only
  const role = session.user.user_metadata?.role || null;
  if (requiredRole && role !== requiredRole) {
    console.warn(`[Auth] Access denied for role ${role}, required ${requiredRole}`);
    return <Navigate to="/unauthorized" replace />;
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
