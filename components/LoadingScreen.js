// components/LoadingScreen.js
import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import CryptoLoader from './CryptoLoader';

const LoadingScreen = ({ message = 'Loading...' }) => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        maxWidth: '600px',
        width: '80%'
      }}>
        <CryptoLoader message={message} />
      </div>
    </div>
  );
};

export default LoadingScreen;