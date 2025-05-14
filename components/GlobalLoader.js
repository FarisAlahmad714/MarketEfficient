// Enhanced GlobalLoader.js
import React, { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/router';
import styled, { keyframes } from 'styled-components';
import { ThemeContext } from '../contexts/ThemeContext';
import CryptoLoader from './CryptoLoader';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const pulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

const LoaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
`;

const SimpleLoader = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
  border-top: 3px solid #2196F3;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  box-shadow: 0 0 15px rgba(33, 150, 243, 0.2);
`;

const LoadingText = styled.div`
  color: ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.9)'};
  font-size: 14px;
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  animation: ${pulse} 2s infinite ease-in-out;
`;

const FancyLoaderContainer = styled.div`
  width: 300px;
  max-width: 80vw;
`;

const GlobalLoader = () => {
  const router = useRouter();
  const { darkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [useFancyLoader, setUseFancyLoader] = useState(false);
  const [message, setMessage] = useState("Loading page...");
  
  useEffect(() => {
    // Add routes that should use the fancy crypto loader
    const fancyLoaderRoutes = ['/chart-exam', '/bias-test'];
    
    // Modified global loader API
    if (typeof window !== 'undefined') {
      window.showGlobalLoader = (options = {}) => {
        if (options.message) {
          setMessage(options.message);
        } else {
          setMessage("Loading page...");
        }
        
        // Allow explicit setting of loader type
        if (options.fancy !== undefined) {
          setUseFancyLoader(options.fancy);
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
      
      // Determine whether to use fancy loader based on route
      const shouldUseFancyLoader = fancyLoaderRoutes.some(route => 
        url.startsWith(route)
      );
      setUseFancyLoader(shouldUseFancyLoader);
      
      // Set appropriate message
      if (shouldUseFancyLoader) {
        if (url.includes('/chart-exam')) {
          setMessage("Loading chart examination...");
        } else if (url.includes('/bias-test')) {
          setMessage("Preparing bias test...");
        } else {
          setMessage("Loading page...");
        }
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
      {useFancyLoader ? (
        <FancyLoaderContainer>
          <CryptoLoader 
            message={message} 
            minDisplayTime={2000} 
            lightMode={true}
            candleCount={22}
          />
        </FancyLoaderContainer>
      ) : (
        <LoaderContainer>
          <SimpleLoader $isDarkMode={darkMode} />
          <LoadingText $isDarkMode={darkMode}>{message}</LoadingText>
        </LoaderContainer>
      )}
    </LoaderOverlay>
  );
};

export default GlobalLoader;