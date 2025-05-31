import React, { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import EmailVerificationNotice from './EmailVerificationNotice';
import styles from '../../styles/RegisterWithPricing.module.css';
import debounce from 'lodash.debounce';

const RegisterWithPricing = () => {
  // Registration form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [registeredUserData, setRegisteredUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [emailMessage, setEmailMessage] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isEmailAvailable, setIsEmailAvailable] = useState(true);

  // Pricing state
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [promoCode, setPromoCode] = useState('');
  const [promoValidation, setPromoValidation] = useState(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Account Info, 2: Plan Selection

  const { darkMode } = useContext(ThemeContext);
  const { register } = useContext(AuthContext);
  const router = useRouter();

  const plans = {
    monthly: {
      name: 'Monthly Plan',
      price: 29,
      originalPrice: 29,
      interval: 'month',
      description: 'Full access to all premium features',
      features: [
        'Real-time market analysis',
        'Advanced charting tools',
        'AI-powered insights',
        'Portfolio tracking',
        'Email alerts',
        'Premium support',
      ],
    },
    annual: {
      name: 'Annual Plan',
      price: 249,
      originalPrice: 249,
      interval: 'year',
      savings: 99,
      description: 'Best value - 2 months free!',
      features: [
        'Everything in Monthly',
        '2 months FREE',
        'Priority support',
        'Advanced analytics',
        'Custom indicators',
        'API access',
      ],
    },
  };

  // Validate email format instantly
  const validateEmailFormat = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Check email availability with an API call
  const checkEmailAvailability = async (email) => {
    setIsCheckingEmail(true);
    try {
      const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setIsEmailAvailable(data.isAvailable);
      setEmailMessage(data.isAvailable ? '✅' : 'Email is already in use');
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailMessage('Error checking email');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Debounce the uniqueness check to avoid excessive API calls
  const debouncedCheckEmail = debounce(checkEmailAvailability, 500);

  // Handle email input changes and validation
  useEffect(() => {
    if (email) {
      const isValid = validateEmailFormat(email);
      setIsEmailValid(isValid);
      if (isValid) {
        debouncedCheckEmail(email);
      } else {
        setEmailMessage('Invalid email format');
      }
    } else {
      setEmailMessage('');
      setIsEmailValid(true);
      setIsEmailAvailable(true);
    }
  }, [email]);

  // Validate promo code when entered
  useEffect(() => {
    if (promoCode.length >= 3) {
      validatePromoCode();
    } else {
      setPromoValidation(null);
    }
  }, [promoCode, selectedPlan]);

  // Check if passwords match
  useEffect(() => {
    if (confirmPassword) {
      setPasswordMatch(password === confirmPassword);
    }
  }, [password, confirmPassword]);

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    setPasswordStrength(strength);
  }, [password]);

  const validatePromoCode = async () => {
    setIsValidatingPromo(true);
    try {
      const response = await fetch('/api/payment/validate-promo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promoCode: promoCode.toUpperCase(),
          plan: selectedPlan,
        }),
      });

      const data = await response.json();

      if (data.valid) {
        setPromoValidation({
          valid: true,
          originalPrice: data.pricing.originalPrice,
          finalPrice: data.pricing.finalPrice,
          savings: data.pricing.savings,
          description: data.promoCode.description,
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

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (passwordStrength < 2) {
      setError('Password is too weak. Please use at least 8 characters with a mix of letters, numbers, and symbols.');
      return;
    }

    // Validate email
    if (!isEmailValid) {
      setError('Please enter a valid email address');
      return;
    }

    if (!isEmailAvailable) {
      setError('Email is already in use');
      return;
    }

    // Move to plan selection step
    setCurrentStep(2);
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          promoCode: promoCode.toUpperCase() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.requiresPayment) {
        localStorage.setItem(
          'pendingRegistration',
          JSON.stringify({
            pendingRegistrationId: data.pendingRegistrationId,
            name,
            email,
            plan: selectedPlan,
            promoCode: promoCode ? promoCode.toUpperCase() : null,
          })
        );

        const checkoutResponse = await fetch('/api/payment/create-checkout-pending', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan: selectedPlan,
            promoCode: promoCode ? promoCode.toUpperCase() : null,
            pendingRegistrationId: data.pendingRegistrationId,
          }),
        });

        const checkoutData = await checkoutResponse.json();

        if (checkoutData.url) {
          window.location.href = checkoutData.url;
        } else {
          setError(checkoutData.error || 'Failed to create checkout session');
        }
        return;
      }

      const success = response.ok && !data.requiresPayment;

      if (success) {
        await register(name, email, password, promoCode.toUpperCase() || undefined);
        setRegisteredUserData({ name, email });
        setShowEmailVerification(true);

        if (promoValidation?.valid && promoValidation.finalPrice === 0) {
          setSuccess('Registration successful! Your promo code gives you free access. No payment required!');
        } else {
          setSuccess('Registration successful! Please check your email to verify your account.');
        }
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async (userEmail) => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      return false;
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength < 2) return '#f44336';
    if (passwordStrength < 4) return '#ff9800';
    return '#4caf50';
  };

  const getStrengthText = () => {
    if (passwordStrength < 2) return 'Weak';
    if (passwordStrength < 4) return 'Medium';
    return 'Strong';
  };

  if (showEmailVerification && registeredUserData) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <h2>Registration Successful! 🎉</h2>
          <EmailVerificationNotice
            userEmail={registeredUserData.email}
            userName={registeredUserData.name}
            onResendEmail={handleResendEmail}
            variant="success"
          />
          <div className={styles.loginLink}>
            Already verified your email? <Link href="/auth/login">Login here</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <div className={styles.progressBar}>
          <div className={`${styles.step} ${currentStep >= 1 ? styles.active : ''}`}>
            <span>1</span>
            <p>Account Info</p>
          </div>
          <div className={styles.progressLine}></div>
          <div className={`${styles.step} ${currentStep >= 2 ? styles.active : ''}`}>
            <span>2</span>
            <p>Choose Plan</p>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        {currentStep === 1 && (
          <div className={styles.stepContent}>
            <h2>Create Your Account</h2>
            <p>Start your trading journey with MarketEfficient</p>

            <form onSubmit={handleAccountSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={!isEmailValid || !isEmailAvailable ? styles.invalid : ''}
                />
                {emailMessage && <p className={styles.emailMessage}>{emailMessage}</p>}
                {isCheckingEmail && <p className={styles.checking}>Checking...</p>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {password && (
                  <div className={styles.passwordStrength}>
                    <div className={styles.strengthBar}>
                      <div
                        className={styles.strengthFill}
                        style={{
                          width: `${(passwordStrength / 5) * 100}%`,
                          backgroundColor: getStrengthColor(),
                        }}
                      ></div>
                    </div>
                    <span style={{ color: getStrengthColor() }}>{getStrengthText()}</span>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={confirmPassword && !passwordMatch ? styles.invalid : ''}
                />
                {confirmPassword && !passwordMatch && (
                  <p className={styles.errorText}>Passwords don’t match</p>
                )}
              </div>

              <button
                type="submit"
                className={styles.nextBtn}
                disabled={
                  confirmPassword && !passwordMatch ||
                  !isEmailValid ||
                  !isEmailAvailable ||
                  isCheckingEmail
                }
              >
                Continue to Plan Selection
              </button>
            </form>

            <div className={styles.loginLink}>
              Already have an account? <Link href="/auth/login">Login</Link>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.stepContent}>
            <h2>Choose Your Plan</h2>
            <p>Select the plan that best fits your trading needs</p>

            <div className={styles.planGrid}>
              {Object.entries(plans).map(([planKey, plan]) => (
                <div
                  key={planKey}
                  className={`${styles.planCard} ${
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
                      {planKey !== 'free' && (
                        <span className={styles.interval}>/{plan.interval}</span>
                      )}
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
                  <p className={styles.description}>{plan.description}</p>
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

            <div className={styles.promoSection}>
              <h3>Have a promo code?</h3>
              <div className={styles.promoInput}>
                <input
                  type="text"
                  placeholder="Enter promo code (e.g., WIZDOM420, FOXDEN123)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className={`${styles.promoField} ${
                    promoValidation?.valid
                      ? styles.valid
                      : promoValidation?.valid === false && !isValidatingPromo
                      ? styles.invalid
                      : ''
                  }`}
                />
                {isValidatingPromo && (
                  <div className={styles.validating}>🔄 Validating promo code...</div>
                )}
                {promoValidation?.valid && (
                  <div className={styles.promoSuccess}>
                    ✅ {promoValidation.description}
                    <br />
                    <strong>
                      New Price: ${(promoValidation.finalPrice / 100).toFixed(2)} (Save $
                      {(promoValidation.savings / 100).toFixed(2)})
                    </strong>
                  </div>
                )}
                {promoValidation?.valid === false && !isValidatingPromo && (
                  <div className={styles.promoError}>
                    ❌ Invalid promo code. Please check the code and try again.
                  </div>
                )}
                {!promoCode && (
                  <div className={styles.promoHint}>
                    💡 Get promo codes from your admin or community leaders
                  </div>
                )}
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button className={styles.backBtn} onClick={() => setCurrentStep(1)}>
                Back
              </button>
              <button
                className={styles.submitBtn}
                onClick={handleFinalSubmit}
                disabled={isLoading}
              >
                {isLoading
                  ? 'Processing...'
                  : promoValidation?.valid && promoValidation.finalPrice === 0
                  ? 'Complete Registration (FREE!)'
                  : promoValidation?.valid
                  ? `Continue to Payment - $${getCurrentPrice(selectedPlan)} (${Math.round(
                      ((promoValidation.originalPrice - promoValidation.finalPrice) /
                        promoValidation.originalPrice) *
                        100
                    )}% OFF)`
                  : `Continue to Payment - $${getCurrentPrice(selectedPlan)}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterWithPricing;