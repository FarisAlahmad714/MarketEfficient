// components/auth/ProtectedRoute.js
import { useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../../contexts/AuthContext';
import CryptoLoader from '../CryptoLoader';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  const router = useRouter();
  
  useEffect(() => {
    // Only redirect if not loading and not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
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
            message="Authenticating..."
            minDisplayTime={1500}
            height="350px"
          />
        </div>
      </div>
    );
  }
  
  // Only render children if authenticated
  return isAuthenticated ? children : null;
};

export default ProtectedRoute;