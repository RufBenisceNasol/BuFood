import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { CircularProgress, Box } from '@mui/material';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role if required
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

/**
 * Customer-only protected route
 */
export const CustomerRoute = ({ children }) => {
  return <ProtectedRoute requiredRole="Customer">{children}</ProtectedRoute>;
};

/**
 * Seller-only protected route
 */
export const SellerRoute = ({ children }) => {
  return <ProtectedRoute requiredRole="Seller">{children}</ProtectedRoute>;
};

export default ProtectedRoute;
