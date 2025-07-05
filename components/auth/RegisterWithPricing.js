import React, { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import EmailVerificationNotice from './EmailVerificationNotice';
import styles from '../../styles/RegisterWithPricing.module.css';
import debounce from 'lodash.debounce';
import storage from '../../lib/storage';

const RegisterWithPricing = () => {
  // Registration form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  const [csrfToken, setCsrfToken] = useState('');
  const [restoredToken, setRestoredToken] = useState(null);

  const { darkMode } = useContext(ThemeContext);
  const { register } = useContext(AuthContext);
  const router = useRouter();

  const plans = {
    monthly: {
      name: 'Monthly Plan',
      price: 39,
      originalPrice: 39,
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
      price: 360,
      originalPrice: 360,
      interval: 'year',
      savings: 108,
      description: 'Best value - save $108 a year!',
      features: [
        'Everything in Monthly',
        'Save $108 a year',
        'Priority support',
        'Advanced analytics',
        'Custom indicators',
        'API access',
      ],
    },
  };

  // Fetch CSRF token on component mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/auth/csrf-token');
        const data = await response.json();
        setCsrfToken(data.csrfToken);
      } catch (error) {
        setError('Could not initialize secure session. Please refresh the page.');
      }
    };
    fetchCsrfToken();
  }, []);

  // Check for cancelled checkout session on page load
  useEffect(() => {
    const restoreSession = async (token) => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch('/api/auth/get-pending-registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (response.ok) {
          setName(data.name || '');
          setEmail(data.email || '');
          setSelectedPlan(data.plan || 'monthly');
          setPromoCode(data.promoCode || '');
          setRestoredToken(token);
          setCurrentStep(2);
          setError('Your previous session has been restored. Please confirm your plan and proceed.');
          // Clear the URL now that state is set
          router.replace('/auth/register', undefined, { shallow: true });
        } else {
          throw new Error(data.error);
        }
      } catch (err) {
        setError(err.message || 'Could not restore your previous session. Please start again.');
        // Clear the URL on failure too
        router.replace('/auth/register', undefined, { shallow: true });
      } finally {
        setIsLoading(false);
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const cancelled = urlParams.get('cancelled');
    const token = urlParams.get('token');
    
    if (cancelled === 'true' && token) {
      restoreSession(token);
    }
  }, [router]);

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
          'X-CSRF-Token': csrfToken,
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
      let tokenToUse = restoredToken;

      // If we are not in a restored session, we need to register first to get a token.
      if (!tokenToUse) {
        const registerResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({
            name,
            email,
            password,
            plan: selectedPlan,
            promoCode: promoCode.toUpperCase() || undefined,
          }),
        });

        const registerData = await registerResponse.json();
        
        if (!registerResponse.ok) {
          setError(registerData.error || 'Registration failed. Please try again.');
          setIsLoading(false);
          return;
        }

        if (registerData.requiresPayment) {
          tokenToUse = registerData.tempToken;
        } else {
          // This case handles free promo codes or other non-payment scenarios
          setRegisteredUserData({ name, email });
          setShowEmailVerification(true);
          setSuccess(registerData.message || 'Registration successful! Please check your email.');
          setIsLoading(false);
          return;
        }
      }

      // At this point, we must have a token to proceed to checkout
      if (tokenToUse) {
        const checkoutResponse = await fetch('/api/payment/create-checkout-registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({
            plan: selectedPlan,
            promoCode: promoCode ? promoCode.toUpperCase() : null,
            tempToken: tokenToUse,
          }),
        });

        const checkoutData = await checkoutResponse.json();

        if (checkoutData.url) {
          storage.setItem('registrationToken', tokenToUse);
          window.location.href = checkoutData.url;
        } else {
          setError(checkoutData.error || 'Failed to create checkout session');
        }
      } else {
        setError('Could not obtain a registration session token. Please try again.');
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
            <p>Start your trading journey with ChartSense</p>

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
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: '45px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: darkMode ? '#b0b0b0' : '#666',
                      padding: '4px',
                      fontSize: '16px'
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? '👁️‍🗨️' : '👁️'}
                  </button>
                </div>
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
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={confirmPassword && !passwordMatch ? styles.invalid : ''}
                    style={{ paddingRight: '45px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: darkMode ? '#b0b0b0' : '#666',
                      padding: '4px',
                      fontSize: '16px'
                    }}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
                  </button>
                </div>
                {confirmPassword && !passwordMatch && (
                  <p className={styles.errorText}>Passwords don't match</p>
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