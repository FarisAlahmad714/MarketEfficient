// contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import storage from '../lib/storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use storage wrapper instead of direct localStorage
        const token = await storage.getItem('auth_token');
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Use storage wrapper for removal
          await storage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const register = async (name, email, password, promoCode) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, promoCode })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Use storage wrapper for all storage operations
        await storage.setItem('pending_verification_email', email);
        await storage.setItem('pending_verification_name', name);
        await storage.setItem('auth_token', data.token);
        if (data.tempToken) {
          await storage.setItem('registrationTempToken', data.tempToken);
        }
        
        if (data.user.isVerified) {
          setUser(data.user);
          setIsAuthenticated(true);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };
  
  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Use storage wrapper
        await storage.setItem('auth_token', data.token);
        await storage.removeItem('registrationTempToken');
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        if (response.status === 403 && data.needsVerification) {
          return { 
            success: false, 
            needsVerification: true, 
            email: email,
            message: data.message || 'Please verify your email before logging in.'
          };
        }
        
        return { 
          success: false, 
          message: data.error || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        message: 'An error occurred during login'
      };
    }
  };
  
  const logout = async () => {
    try {
      // Get token using storage wrapper
      const token = await storage.getItem('auth_token');
      
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Use storage wrapper for cleanup
      await storage.removeItem('auth_token');
      await storage.removeItem('registrationTempToken');
      setUser(null);
      setIsAuthenticated(false);
      router.push('/');
    }
  };
  
  // Additional helper methods for storage migration
  const refreshToken = async () => {
    try {
      const currentToken = await storage.getItem('auth_token');
      if (!currentToken) return false;
      
      // In the future, this could call a refresh endpoint
      // For now, just validate the current token
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };
  
  // Method to check if user has valid session
  const hasValidSession = async () => {
    const token = await storage.getItem('auth_token');
    return !!token && isAuthenticated;
  };
  
  // Method to get current auth token (useful for API calls)
  const getAuthToken = async () => {
    return await storage.getItem('auth_token');
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      register,
      login,
      logout,
      refreshToken,
      hasValidSession,
      getAuthToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};