// pages/pricing.js
import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { AuthContext } from '../contexts/AuthContext';
import logger from '../lib/logger';
import storage from '../lib/storage';
import CryptoLoader from '../components/CryptoLoader';

// Dynamically import PricingPage to reduce initial bundle size
const PricingPage = dynamic(() => import('../components/PricingPage'), {
  ssr: false,
  loading: () => <CryptoLoader height="400px" message="Loading pricing options..." />
});

export default function Pricing() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const { cancelled, email, plan, tempToken } = router.query;
  const [csrfToken, setCsrfToken] = useState('');

  // Fetch CSRF token on component mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/auth/csrf-token');
        const data = await response.json();
        setCsrfToken(data.csrfToken);
      } catch (error) {
      }
    };
    fetchCsrfToken();
  }, []);

  // Store tempToken for registration flow
  useEffect(() => {
    if (cancelled === 'true' && tempToken) {
      logger.log('Cancelled checkout:', { email, plan, tempToken });
      storage.setItem('registrationTempToken', tempToken);
    }
  }, [cancelled, email, plan, tempToken]);

  // Handle plan selection and initiate checkout
  const handlePlanSelect = async (selectedPlan, promoCode) => {
    // Use storage wrapper instead of direct localStorage
    const storedToken = storage.getItem('registrationTempToken');
    if (!isAuthenticated && !storedToken) {
      router.push('/auth/register');
      return;
    }

    try {
      logger.log('Initiating checkout for plan:', selectedPlan, { isAuthenticated });
      const response = await fetch('/api/payment/create-checkout-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          ...(isAuthenticated && user?.token && { 'Authorization': `Bearer ${user.token}` })
        },
        body: JSON.stringify({
          plan: selectedPlan,
          promoCode: promoCode || '',
          tempToken: isAuthenticated ? '' : storedToken
        })
      });
      const data = await response.json();
      if (data.url) {
        logger.log('Redirecting to Stripe checkout:', data.url);
        window.location.href = data.url;
      } else {
        return data.error || 'Failed to create checkout session';
      }
    } catch (error) {
      return 'Failed to start checkout process';
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Loading...</p>
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
    <div>
      <PricingPage 
        user={user} 
        onPlanSelect={handlePlanSelect}
        isRegistrationFlow={!!tempToken || !!storage.getItem('registrationTempToken')}
      />
    </div>
  );
}