import { useState, useEffect, useCallback } from 'react';
import { supabase, onAuthStateChange } from '../config/supabase';
import { 
  loginUser, 
  logoutUser, 
  registerUser, 
  getCurrentUser,
  getStoredUser 
} from '../services/supabaseAuthService';

/**
 * Custom hook for Supabase authentication
 * Manages auth state and provides auth methods
 */
export const useSupabaseAuth = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);

        if (currentSession) {
          // Get user data from backend
          try {
            const userData = await getCurrentUser();
            setUser(userData);
          } catch (err) {
            // Fallback to stored user data
            const storedUser = getStoredUser();
            setUser(storedUser);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state changed:', event);
      setSession(currentSession);

      if (currentSession) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Register new user
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await registerUser(userData);
      return result;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Login user
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const result = await loginUser({ email, password });
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await logoutUser();
      setUser(null);
      setSession(null);
    } catch (err) {
      setError(err.message || 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Error refreshing user:', err);
      throw err;
    }
  }, []);

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!session,
    register,
    login,
    logout,
    refreshUser,
  };
};

export default useSupabaseAuth;
