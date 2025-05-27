import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/PricingPage.module.css';

const PricingPage = ({ user }) => {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [promoCode, setPromoCode] = useState('');
  const [promoValidation, setPromoValidation] = useState(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const plans = {
    monthly: {
      name: 'Monthly Plan',
      price: 29,
      originalPrice: 29,
      interval: 'month',
      features: [
        'Real-time market analysis',
        'Advanced charting tools',
        'AI-powered insights',
        'Portfolio tracking',
        'Email alerts',
        'Premium support'
      ]
    },
    annual: {
      name: 'Annual Plan',
      price: 249,
      originalPrice: 249,
      interval: 'year',
      savings: 99,
      features: [
        'Everything in Monthly',
        '2 months FREE',
        'Priority support',
        'Advanced analytics',
        'Custom indicators',
        'API access'
      ]
    }
  };

  // Validate promo code when entered
  useEffect(() => {
    if (promoCode.length >= 3) {
      validatePromoCode();
    } else {
      setPromoValidation(null);
    }
  }, [promoCode, selectedPlan]);

  const validatePromoCode = async () => {
    setIsValidatingPromo(true);
    try {
      const response = await fetch('/api/payment/validate-promo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token && { 'Authorization': `Bearer ${user.token}` })
        },
        body: JSON.stringify({
          promoCode: promoCode.toUpperCase(),
          plan: selectedPlan
        })
      });

      const data = await response.json();
      
      if (data.valid) {
        setPromoValidation({
          valid: true,
          originalPrice: data.pricing.originalPrice,
          finalPrice: data.pricing.finalPrice,
          savings: data.pricing.savings,
          description: data.promoCode.description
        });
        setError('');
      } else {
        setPromoValidation({ valid: false });
        setError(data.error || 'Invalid promo code');
      }
    } catch (error) {
      console.error('Promo validation error:', error);
      setPromoValidation({ valid: false });
      setError('Failed to validate promo code');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          plan: selectedPlan,
          ...(promoCode && promoValidation?.valid && { promoCode: promoCode.toUpperCase() })
        })
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setError('Failed to start checkout process');
    } finally {
      setIsProcessing(false);
    }
  };

  const getCurrentPrice = (plan) => {
    if (promoValidation?.valid && selectedPlan === plan) {
      return promoValidation.finalPrice / 100;
    }
    return plans[plan].price;
  };

  const getSavings = (plan) => {
    if (promoValidation?.valid && selectedPlan === plan) {
      return promoValidation.savings / 100;
    }
    return plan === 'annual' ? plans[plan].savings : 0;
  };

  return (
    <div className={styles.pricingContainer}>
      <div className={styles.header}>
        <h1>Choose Your Plan</h1>
        <p>Unlock the full potential of MarketEfficient with our premium features</p>
      </div>

      {/* Plan Toggle */}
      <div className={styles.planToggle}>
        <button
          className={`${styles.toggleBtn} ${selectedPlan === 'monthly' ? styles.active : ''}`}
          onClick={() => setSelectedPlan('monthly')}
        >
          Monthly
        </button>
        <button
          className={`${styles.toggleBtn} ${selectedPlan === 'annual' ? styles.active : ''}`}
          onClick={() => setSelectedPlan('annual')}
        >
          Annual
          <span className={styles.savingsBadge}>Save $99</span>
        </button>
      </div>

      {/* Pricing Cards */}
      <div className={styles.pricingCards}>
        {Object.entries(plans).map(([planKey, plan]) => (
          <div
            key={planKey}
            className={`${styles.pricingCard} ${
              selectedPlan === planKey ? styles.selected : ''
            } ${planKey === 'annual' ? styles.popular : ''}`}
            onClick={() => setSelectedPlan(planKey)}
          >
            {planKey === 'annual' && (
              <div className={styles.popularBadge}>Most Popular</div>
            )}
            
            <h3>{plan.name}</h3>
            
            <div className={styles.priceSection}>
              <div className={styles.price}>
                <span className={styles.currency}>$</span>
                <span className={styles.amount}>{getCurrentPrice(planKey)}</span>
                <span className={styles.interval}>/{plan.interval}</span>
              </div>
              
              {getSavings(planKey) > 0 && (
                <div className={styles.savings}>
                  Save ${getSavings(planKey)}
                  {promoValidation?.valid && selectedPlan === planKey && (
                    <span className={styles.promoSavings}>
                      with {promoCode.toUpperCase()}
                    </span>
                  )}
                </div>
              )}
            </div>

            <ul className={styles.features}>
              {plan.features.map((feature, index) => (
                <li key={index}>
                  <span className={styles.checkmark}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Promo Code Section */}
      <div className={styles.promoSection}>
        <h3>Have a promo code?</h3>
        <div className={styles.promoInput}>
          <input
            type="text"
            placeholder="Enter promo code (e.g., WIZDOM, FOXDEN)"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            className={`${styles.promoField} ${
              promoValidation?.valid ? styles.valid : 
              promoValidation?.valid === false ? styles.invalid : ''
            }`}
          />
          {isValidatingPromo && (
            <div className={styles.validating}>Validating...</div>
          )}
          {promoValidation?.valid && (
            <div className={styles.promoSuccess}>
              ✓ {promoValidation.description}
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {/* Checkout Button */}
      <div className={styles.checkoutSection}>
        <button
          className={styles.checkoutBtn}
          onClick={handleCheckout}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : `Get Started - $${getCurrentPrice(selectedPlan)}`}
        </button>
        
        <div className={styles.securityNote}>
          <span className={styles.lockIcon}>🔒</span>
          Secure payment powered by Stripe
        </div>
      </div>

      {/* Features Comparison */}
      <div className={styles.featuresComparison}>
        <h3>Why Choose Premium?</h3>
        <div className={styles.comparisonGrid}>
          <div className={styles.featureItem}>
            <h4>🚀 Real-time Analysis</h4>
            <p>Get instant market insights and alerts</p>
          </div>
          <div className={styles.featureItem}>
            <h4>📊 Advanced Charts</h4>
            <p>Professional-grade charting tools</p>
          </div>
          <div className={styles.featureItem}>
            <h4>🤖 AI Insights</h4>
            <p>Machine learning powered predictions</p>
          </div>
          <div className={styles.featureItem}>
            <h4>📱 Mobile Access</h4>
            <p>Trade and monitor on the go</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage; 