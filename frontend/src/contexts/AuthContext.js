import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, storeAccessAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      // Validate token with server before auto-login
      validateToken(token, userData);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token, userData) => {
    try {
      // Test if token is valid by making an authenticated request
      await authAPI.getCurrentUser();
      setUser(JSON.parse(userData));
    } catch (err) {
      console.error('Token validation failed:', err);
      // Token is invalid, clear localStorage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, rememberMe = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.login(email, password, rememberMe);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return userData;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout API if token exists
      if (localStorage.getItem('token')) {
        await authAPI.logout();
      }
    } catch (err) {
      console.error('Logout API call failed:', err);
      // Continue with logout even if API call fails
    } finally {
      // Always clear local storage and reset state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setError(null);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.register(userData);
      const { token, user: newUser } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      
      return newUser;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin' || user?.role === 'god_mode';
  };

  const isStoreAdmin = (storeId = null) => {
    // System admin and god mode can access any store
    if (user?.role === 'admin' || user?.role === 'god_mode') {
      return true;
    }
    
    // Check if user is admin of a specific store
    if (storeId && user?.managed_stores) {
      return user.managed_stores.includes(parseInt(storeId));
    }
    
    // Check if user is admin of their active store
    return user?.is_store_admin || false;
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.me();
      const userData = response.data.user;
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return userData;
    } catch (err) {
      console.error('Failed to refresh user data:', err);
      // If token is invalid, logout
      if (err.response?.status === 401) {
        logout();
      }
      throw err;
    }
  };

  const requiresStoreSelection = () => {
    return user && !user.active_store_id;
  };

  const hasStoreAccess = () => {
    return user && user.active_store_id;
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    refreshUser,
    requiresStoreSelection,
    hasStoreAccess,
    isAdmin,
    isStoreAdmin,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};