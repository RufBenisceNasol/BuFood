import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { supabase } from '../supabaseClient';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        const currentUser = data?.session?.user || null;
        setUser(currentUser);
        setReady(true);
      } catch (error) {
        console.error('[ProtectedRoute] Session load error:', error);
        if (isMounted) {
          setUser(null);
          setReady(true);
        }
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user || null);
      setReady(true);
    });

    return () => {
      isMounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Still waiting for Supabase to respond — show loader
  if (!ready || user === undefined) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // No user found after Supabase check
  if (!user) {
    console.warn('[ProtectedRoute] No Supabase session found — redirecting to login once');
    if (location.pathname === '/login') {
      // Avoid re-looping if this guard is ever applied on the login route
      return children;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Optional role restriction
  if (requiredRole) {
    const role = user.user_metadata?.role || null;
    if (!role || role !== requiredRole) {
      console.warn(`[ProtectedRoute] Role mismatch (${role}) → redirecting to /unauthorized`);
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
