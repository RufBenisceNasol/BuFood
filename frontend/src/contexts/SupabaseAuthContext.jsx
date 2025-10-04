import React, { createContext, useContext } from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

/**
 * Context for Supabase authentication
 * Provides auth state and methods throughout the app
 */
const SupabaseAuthContext = createContext(null);

/**
 * Provider component for Supabase authentication
 */
export const SupabaseAuthProvider = ({ children }) => {
  const auth = useSupabaseAuth();

  return (
    <SupabaseAuthContext.Provider value={auth}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

/**
 * Hook to use Supabase auth context
 */
export const useAuth = () => {
  const context = useContext(SupabaseAuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within SupabaseAuthProvider');
  }
  
  return context;
};

export default SupabaseAuthContext;
