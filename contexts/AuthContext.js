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

  // Debug logging removed for security

  const wrappedSetIsLoading = (value) => {
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
        // CSRF token not available
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
      // Starting app initialization
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
            // Failed to fetch CSRF token
            setCsrfTokenValue(null); // Ensure it's null if fetch fails
          }
        } catch (csrfError) {
          // Error fetching CSRF token
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
            // User authenticated successfully
          } else {
            // Token is invalid or expired, or /me endpoint failed
            await storage.removeItem('auth_token');
            setUser(null); // Clear user state
            setIsAuthenticated(false); // Ensure not authenticated
            // Authentication failed or token invalid
            // Optionally, redirect to login if preferred on auth failure
            // router.push('/auth/login'); 
          }
        } else {
          // No token found, user is not logged in
          setUser(null);
          setIsAuthenticated(false);
          // No authentication token found
        }
      } catch (error) {
        // Authentication initialization error
        // Generic error handling: ensure user is not authenticated and token is cleared
        setUser(null);
        setIsAuthenticated(false);
        try {
          await storage.removeItem('auth_token'); // Attempt to clear any potentially stale token
        } catch (storageError) {
          // Failed to clear auth token
        }
      } finally {
        // Initialization complete
        wrappedSetIsLoading(false);
      }
    };
    
    // Initializing authentication
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
      // Registration error
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
      // Login error
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
      // Logout error
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
      // Token refresh error
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

  // Method to refresh user data from server
  const refreshUserData = useCallback(async () => {
    try {
      // Add cache-busting parameter to force fresh data
      const response = await secureApiCall(`/api/auth/me?_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
        // User data refreshed
        return true;
      } else {
        // Failed to refresh user data
        return false;
      }
    } catch (error) {
      // Error refreshing user data
      return false;
    }
  }, [secureApiCall]);
  
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
    refreshUserData,
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
    refreshUserData,
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