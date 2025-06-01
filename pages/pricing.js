import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../contexts/AuthContext';
import PricingPage from '../components/PricingPage';
import logger from '../lib/logger'; // Adjust the path to your logger utility

export default function Pricing() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const { cancelled, email, plan, tempToken } = router.query;

  // Store tempToken for registration flow
  useEffect(() => {
    if (cancelled === 'true' && tempToken) {
      logger.log('Cancelled checkout:', { email, plan, tempToken });
      localStorage.setItem('registrationTempToken', tempToken);
    }
  }, [cancelled, email, plan, tempToken]);

  // Handle plan selection and initiate checkout
  const handlePlanSelect = async (selectedPlan, promoCode) => {
    const storedToken = localStorage.getItem('registrationTempToken');
    if (!isAuthenticated && !storedToken) {
      console.error('No auth or temp token, redirecting to register');
      router.push('/auth/register');
      return;
    }

    try {
      logger.log('Initiating checkout for plan:', selectedPlan, { isAuthenticated });
      const response = await fetch('/api/payment/create-checkout-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        console.error('Checkout failed:', data.error);
        return data.error || 'Failed to create checkout session';
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
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
        isRegistrationFlow={!!tempToken || !!localStorage.getItem('registrationTempToken')}
      />
    </div>
  );
}