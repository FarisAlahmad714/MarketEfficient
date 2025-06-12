// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import storage from '../lib/storage';

export const AuthContext = createContext();

// Helper function to get a cookie by name
function getCookie(name) {
  if (typeof document === 'undefined') {
    return null; 
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [csrfTokenValue, setCsrfTokenValue] = useState(null); // New state for CSRF token
  const router = useRouter();
  
  // Get current pathname and avoid router dependency in auth initialization
  const currentPath = router?.asPath;

  if (process.env.NODE_ENV === 'development') {
    console.log('[AuthContext] Component rendering/re-rendering. Initial isLoading:', isLoading);
  }

  const wrappedSetIsLoading = (value) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthContext] setIsLoading CALLED. New value:', value, 'Current user:', user ? 'SET' : 'NULL', 'IsAuthenticated:', isAuthenticated);
    }
    setIsLoading(value);
  };

  // Memoize secureApiCall to prevent recreation on every render
  const secureApiCall = useCallback(async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add CSRF token for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)) {
      if (csrfTokenValue) { // Use CSRF token from state
        headers['X-CSRF-Token'] = csrfTokenValue;
      } else {
        // Fallback or error, though ideally csrfTokenValue should always be set by initializeApp
        if (process.env.NODE_ENV === 'development') {
          console.warn('[AuthContext] CSRF token not available in state for secureApiCall. Check initialization.');
        }
      }
    }

    // Add auth token if available
    const token = await storage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Always include cookies
    });
  }, [csrfTokenValue]); // Only recreate when CSRF token changes
  
  useEffect(() => {
    const initializeApp = async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthContext] initializeApp: STARTING. Setting isLoading to true.');
      }
      wrappedSetIsLoading(true);
      try {
        // Fetch CSRF token first
        try {
          const csrfResponse = await fetch('/api/auth/csrf-token');
          if (csrfResponse.ok) {
            const csrfData = await csrfResponse.json();
            setCsrfTokenValue(csrfData.csrfToken); // Store fetched token in state
            // Cookie is also set by the API route, which is fine. The state value gives us immediate access.
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.error('[AuthContext] Failed to fetch CSRF token, status:', csrfResponse.status);
            }
            setCsrfTokenValue(null); // Ensure it's null if fetch fails
          }
        } catch (csrfError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[AuthContext] Error fetching CSRF token:', csrfError);
          }
          setCsrfTokenValue(null); // Ensure it's null on error
        }

        const token = await storage.getItem('auth_token');
        
        if (token) {
          // If a token exists, try to verify it by fetching user data
          const response = await secureApiCall('/api/auth/me', { // secureApiCall will now include X-CSRF-Token
            method: 'GET'
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setIsAuthenticated(true);
            if (process.env.NODE_ENV === 'development') {
              console.log('[AuthContext] initializeApp: /api/auth/me SUCCESS. User set. isAuthenticated=true');
            }
          } else {
            // Token is invalid or expired, or /me endpoint failed
            await storage.removeItem('auth_token');
            setUser(null); // Clear user state
            setIsAuthenticated(false); // Ensure not authenticated
            if (process.env.NODE_ENV === 'development') {
              console.log('[AuthContext] initializeApp: /api/auth/me FAILED or token invalid. User cleared. isAuthenticated=false. Status:', response.status);
            }
            // Optionally, redirect to login if preferred on auth failure
            // router.push('/auth/login'); 
          }
        } else {
          // No token found, user is not logged in
          setUser(null);
          setIsAuthenticated(false);
          if (process.env.NODE_ENV === 'development') {
            console.log('[AuthContext] initializeApp: No token found. User cleared. isAuthenticated=false.');
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[AuthContext] initializeApp: CATCH BLOCK ERROR:', error);
        }
        // Generic error handling: ensure user is not authenticated and token is cleared
        setUser(null);
        setIsAuthenticated(false);
        try {
          await storage.removeItem('auth_token'); // Attempt to clear any potentially stale token
        } catch (storageError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[AuthContext] Failed to clear auth_token during error handling:', storageError);
          }
        }
      } finally {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthContext] initializeApp: FINALLY BLOCK. Setting isLoading to false.');
        }
        wrappedSetIsLoading(false);
      }
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthContext] useEffect for initializeApp FIRED.');
    }
    initializeApp();
  }, []); // Empty dependency array ensures this runs once on mount
  
  // Memoize register function
  const register = useCallback(async (name, email, password, promoCode) => {
    try {
      const response = await secureApiCall('/api/auth/register', {
        method: 'POST',
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
      if (process.env.NODE_ENV === 'development') {
        console.error('Registration failed:', error);
      }
      throw error;
    }
  }, [secureApiCall]);
  
  // Memoize login function
  const login = useCallback(async (email, password) => {
    try {
      const csrfToken = getCookie('csrf_token'); // Get CSRF token

      const headers = {
        'Content-Type': 'application/json',
      };

      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      } else {
        // This warning is for development; server will enforce CSRF
        console.warn('CSRF token cookie not found. Login may be blocked by CSRF protection.');
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: headers, // Use updated headers
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
      if (process.env.NODE_ENV === 'development') {
        console.error('Login failed:', error);
      }
      return { 
        success: false, 
        message: 'An error occurred during login'
      };
    }
  }, [router]);
  
  // Memoize logout function
  const logout = useCallback(async () => {
    try {
      await secureApiCall('/api/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Logout failed:', error);
      }
    } finally {
      // Use storage wrapper for cleanup
      await storage.removeItem('auth_token');
      await storage.removeItem('registrationTempToken');
      // Clear CSRF cookie
      document.cookie = 'csrf_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      setUser(null);
      setIsAuthenticated(false);
      router.push('/');
    }
  }, [secureApiCall, router]);
  
  // Memoize additional helper methods
  const refreshToken = useCallback(async () => {
    try {
      const response = await secureApiCall('/api/auth/me', {
        method: 'GET'
      });
      
      return response.ok;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Token refresh failed:', error);
      }
      return false;
    }
  }, [secureApiCall]);
  
  // Method to check if user has valid session
  const hasValidSession = useCallback(async () => {
    const token = await storage.getItem('auth_token');
    return !!token && isAuthenticated;
  }, [isAuthenticated]);
  
  // Method to get current auth token (useful for API calls)
  const getAuthToken = useCallback(async () => {
    return await storage.getItem('auth_token');
  }, []);
  
  // Export the secure API call function for use in other components
  // const makeSecureRequest = secureApiCall; // This was exporting the old one, now it's part of the context value

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    register,
    login,
    logout,
    refreshToken,
    hasValidSession,
    getAuthToken,
    makeSecureRequest: secureApiCall // Expose the new secureApiCall bound to the provider's instance and state
  }), [
    user,
    isAuthenticated,
    isLoading,
    register,
    login,
    logout,
    refreshToken,
    hasValidSession,
    getAuthToken,
    secureApiCall
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};