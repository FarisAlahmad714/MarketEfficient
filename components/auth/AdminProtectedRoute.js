// components/auth/AdminProtectedRoute.js
import { useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../../contexts/AuthContext';

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
        height: '100vh'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #2196F3',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  // Only render children if authenticated and is admin
  return isAuthenticated && user?.isAdmin ? children : null;
};

export default AdminProtectedRoute;