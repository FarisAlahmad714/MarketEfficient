// pages/_app.js
import Layout from '../components/Layout';
import Head from 'next/head';
import { useEffect, useState, useContext } from 'react';
import { AuthProvider, AuthContext } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import CryptoLoader from '../components/CryptoLoader';
import TrackedPage from "../components/TrackedPage";  
// Define which routes require authentication
const protectedRoutes = [
  '/bias-test', 
  '/bias-test/[assetSymbol]',
  '/chart-exam',
  '/chart-exam/[type]', 
  '/chart-exam/results', 
  '/results/[assetSymbol]',
  '/profile',
  '/dashboard',
  '/sandbox'
];

// Add separate list for admin routes
const adminRoutes = [
  '/admin',
  '/admin/users',
  '/admin/settings',
  '/admin/test-results'
];

function AppContent({ Component, pageProps }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  
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

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);
  
  // Listen for route changes to check authentication
  useEffect(() => {
    // Don't check auth while auth context is still loading
    if (isLoading) {
      return;
    }
    
    // Function to check if current route requires authentication or admin
    const checkAuth = () => {
      const path = router.pathname;
      
      // Check if it's an admin route first
      const isAdminRoute = adminRoutes.some(route => {
        // Handle dynamic routes by checking if the pattern matches
        if (route.includes('[') && route.includes(']')) {
          const routePattern = route.replace(/\[.*?\]/g, '[^/]+');
          const regex = new RegExp(`^${routePattern}$`);
          return regex.test(path);
        }
        return route === path;
      });
      
      if (isAdminRoute) {
        // Need both authentication and admin status
        if (!isAuthenticated) {
          router.push('/auth/login');
          return;
        }
        
        if (isAuthenticated && !user?.isAdmin) {
          router.push('/');
          return;
        }
      } else {
        // Otherwise check if it's a protected route
        const isProtected = protectedRoutes.some(route => {
          // Handle dynamic routes by checking if the pattern matches
          if (route.includes('[') && route.includes(']')) {
            const routePattern = route.replace(/\[.*?\]/g, '[^/]+');
            const regex = new RegExp(`^${routePattern}$`);
            return regex.test(path);
          }
          return route === path;
        });
        
        if (isProtected && !isAuthenticated) {
          // Only need authentication
          router.push('/auth/login');
          return;
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
  }, [router, isAuthenticated, user, isLoading]);
  
  // Show loading state while checking authentication
  if (isLoading || !authChecked) {
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
            message="Initializing application..."
            minDisplayTime={1500}
            height="350px"
          />
        </div>
      </div>
    );
  }
  
  return (
    <TrackedPage>
    <Layout>
      <Component {...pageProps} />
    </Layout>
    </TrackedPage>
  );
}

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>ChartSense - Trading Smarter, Together</title>
        <meta name="description" content="Trading Smarter, Together." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:url" content="https://chartsense.trade" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="ChartSense" />
        <meta property="og:description" content="Trading Smarter, Together." />
        <meta property="og:image" content="https://www.chartsense.trade/images/logo.webp" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@chartsense" />
        <meta name="twitter:title" content="ChartSense" />
        <meta name="twitter:description" content="Trading Smarter, Together." />
        <meta name="twitter:image" content="https://www.chartsense.trade/images/logo.webp" />
        
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Chartsense" />
        <link rel="apple-touch-icon" href="/images/logo.webp" />
      </Head>
      <AppContent Component={Component} pageProps={pageProps} />
      <div id="modal-root"></div>
    </AuthProvider>
  );
}

export default MyApp;