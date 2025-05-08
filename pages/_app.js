import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

// Define which routes require authentication
const protectedRoutes = [
  '/bias-test', 
  '/bias-test/[assetSymbol]',
  '/chart-exam',
  '/chart-exam/[type]', 
  '/chart-exam/results', 
  '/results/[assetSymbol]',
  '/admin' 
];

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  
  useEffect(() => {
    // Add FontAwesome script if it's not already present
    if (!document.querySelector('#fontawesome-script')) {
      const script = document.createElement('script');
      script.id = 'fontawesome-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js';
      script.integrity = 'sha512-Tn2m0TIpgVyTzzvmxLNuqbSJH3JP8jm+Cy3hvHrW7ndTDcJ1w5mBiksqDBb8GpE2ksktFvDB/ykZ0mDpsZj20w==';
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
      document.head.appendChild(script);
    }
  }, []);
  
  // Listen for route changes to check authentication
  useEffect(() => {
    // Function to check if current route requires authentication
    const checkAuth = () => {
      const path = router.pathname;
      const isProtected = protectedRoutes.some(route => {
        // Handle dynamic routes by checking if the pattern matches
        if (route.includes('[') && route.includes(']')) {
          const routePattern = route.replace(/\[.*?\]/g, '[^/]+');
          const regex = new RegExp(`^${routePattern}$`);
          return regex.test(path);
        }
        return route === path;
      });
      
      if (isProtected) {
        // Check if user is authenticated
        const token = localStorage.getItem('auth_token');
        if (!token) {
          // Redirect to login if not authenticated
          router.push('/auth/login');
        }
      }
      
      setAuthChecked(true);
    };
    
    checkAuth();
    
    // Set up route change listeners
    router.events.on('routeChangeComplete', checkAuth);
    return () => {
      router.events.off('routeChangeComplete', checkAuth);
    };
  }, [router]);
  
  // Show loading state while checking authentication
  if (!authChecked) {
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
  
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}

export default MyApp;