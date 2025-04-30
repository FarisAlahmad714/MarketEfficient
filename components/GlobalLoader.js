// components/GlobalLoader.js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import CryptoLoader from './CryptoLoader';

// Fixed styled components with $ prefix
const LoaderOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: ${props => props.$isFadeOut ? 0 : 1};
  visibility: ${props => props.$isFadeOut ? 'hidden' : 'visible'};
  transition: opacity 0.3s ease, visibility 0.3s ease;
`;

const LoaderContainer = styled.div`
  width: 80%;
  max-width: 600px;
`;

const GlobalLoader = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  
  useEffect(() => {
    // Create a global ID for manual access
    if (typeof window !== 'undefined') {
      window.showGlobalLoader = () => {
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
    <LoaderOverlay $isFadeOut={fadeOut} id="global-loader">
      <LoaderContainer>
        <CryptoLoader 
          message="Loading page..." 
          minDisplayTime={2000} 
        />
      </LoaderContainer>
    </LoaderOverlay>
  );
};

export default GlobalLoader;