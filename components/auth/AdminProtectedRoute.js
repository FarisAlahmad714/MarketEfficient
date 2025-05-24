// components/auth/AdminProtectedRoute.js
import { useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../../contexts/AuthContext';
import CryptoLoader from '../CryptoLoader';

const AdminProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const router = useRouter();
  
  useEffect(() => {
    // Only redirect if not loading
    if (!isLoading) {
      // Redirect to login if not authenticated
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      
      // Redirect to home if authenticated but not admin
      if (isAuthenticated && !user?.isAdmin) {
        router.push('/');
        return;
      }
    }
  }, [isAuthenticated, isLoading, router, user]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        padding: '20px'
      }}>
        <div style={{
          width: '400px',
          maxWidth: '100%',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <CryptoLoader 
            message="Verifying admin access..."
            minDisplayTime={1500}
            height="350px"
          />
        </div>
      </div>
    );
  }
  
  // Only render children if authenticated and is admin
  return isAuthenticated && user?.isAdmin ? children : null;
};

export default AdminProtectedRoute;