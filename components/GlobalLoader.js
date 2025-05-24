// Enhanced GlobalLoader.js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styled, { keyframes } from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';
import CryptoLoader from './CryptoLoader';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// Styled components
const LoaderOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  background-color: ${props => props.$isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)'};
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: ${props => props.$isFadeOut ? 0 : 1};
  visibility: ${props => props.$isFadeOut ? 'hidden' : 'visible'};
  transition: opacity 0.3s ease, visibility 0.3s ease;
  animation: ${fadeIn} 0.2s ease-out;
`;

const CryptoLoaderContainer = styled.div`
  width: 400px;
  max-width: 90vw;
  height: 300px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
`;

const GlobalLoader = () => {
  const router = useRouter();
  // Safe access to ThemeContext using custom hook
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [message, setMessage] = useState("Loading page...");
  
  useEffect(() => {
    // Modified global loader API
    if (typeof window !== 'undefined') {
      window.showGlobalLoader = (options = {}) => {
        if (options.message) {
          setMessage(options.message);
        } else {
          setMessage("Loading page...");
        }
        
        setFadeOut(false);
        setLoading(true);
      };
      
      window.hideGlobalLoader = () => {
        setFadeOut(true);
        setTimeout(() => {
          setLoading(false);
        }, 300);
      };
    }
    
    const handleStart = (url) => {
      // Don't show loader for hash changes on the same page
      if (router.asPath.split('#')[0] === url.split('#')[0]) return;
      
      // Set appropriate message based on route
      if (url.includes('/chart-exam')) {
        setMessage("Loading chart examination...");
      } else if (url.includes('/bias-test')) {
        setMessage("Preparing bias test...");
      } else if (url.includes('/dashboard')) {
        setMessage("Loading dashboard...");
      } else if (url.includes('/profile')) {
        setMessage("Loading profile...");
      } else if (url.includes('/admin')) {
        setMessage("Loading admin panel...");
      } else if (url === '/') {
        setMessage("Loading market data...");
      } else {
        setMessage("Loading page...");
      }
      
      setFadeOut(false);
      setLoading(true);
    };
    
    const handleComplete = () => {
      // Start fade out
      setFadeOut(true);
      
      // After animation completes, hide loader completely
      setTimeout(() => {
        setLoading(false);
      }, 300);
    };
    
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);
    
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);
  
  if (!loading) return null;
  
  return (
    <LoaderOverlay $isFadeOut={fadeOut} $isDarkMode={darkMode} id="global-loader">
      <CryptoLoaderContainer>
        <CryptoLoader 
          message={message} 
          minDisplayTime={1500} 
          lightMode={false}
          candleCount={18}
          height="300px"
        />
      </CryptoLoaderContainer>
    </LoaderOverlay>
  );
};

export default GlobalLoader;