// components/CryptoLoader.js
import React, { useContext, useEffect, useState, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { ThemeContext } from '../contexts/ThemeContext';

// Animations
const pulse = keyframes`
  0% { opacity: 0.4; }
  50% { opacity: 0.8; }
  100% { opacity: 0.4; }
`;

const slideUp = keyframes`
  0% { transform: translateY(15px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const drawLine = keyframes`
  0% { width: 0; }
  100% { width: 100%; }
`;

// Enhanced dynamic candle pulse animations
const candlePulseGreen = keyframes`
  0% { transform: scaleY(0.92) rotate(-0.1deg); }
  20% { transform: scaleY(0.98) rotate(0.1deg); }
  40% { transform: scaleY(1.04) rotate(0.2deg); }
  60% { transform: scaleY(1.03) rotate(0.1deg); }
  75% { transform: scaleY(0.97) rotate(-0.1deg); }
  100% { transform: scaleY(0.92) rotate(-0.1deg); }
`;

const candlePulseRed = keyframes`
  0% { transform: scaleY(0.94) rotate(0.1deg); }
  15% { transform: scaleY(1.02) rotate(-0.1deg); }
  35% { transform: scaleY(1.05) rotate(-0.2deg); }
  55% { transform: scaleY(0.98) rotate(-0.1deg); }
  80% { transform: scaleY(0.95) rotate(0.1deg); }
  100% { transform: scaleY(0.94) rotate(0.1deg); }
`;

// Styled Components with fixed props (using $ prefix)
const LoaderContainer = styled.div`
  width: 100%;
  height: ${props => props.height || '400px'};
  position: relative;
  background-color: ${props => props.$isDarkMode ? '#1e1e1e' : '#f8f9fa'};
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
`;

const ChartGrid = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
`;

const HorizontalLine = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background-color: ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
`;

const VerticalLine = styled.div`
  position: absolute;
  top: 10%;
  bottom: 20%;
  width: 1px;
  background-color: ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
`;

const ChartPrice = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  z-index: 2;
  animation: ${slideUp} 0.5s ease-out;
`;

const CurrentPrice = styled.span`
  font-size: 1.8rem;
  font-weight: bold;
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
  margin-bottom: 5px;
`;

const PriceChange = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${props => props.$isPositive ? '#4CAF50' : '#F44336'};
`;

const PriceLabels = styled.div`
  position: absolute;
  right: 20px;
  top: 10%;
  height: 70%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 2;
`;

const PriceLabel = styled.div`
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode ? '#888' : '#999'};
  opacity: 0.7;
`;

const TimeLabels = styled.div`
  position: absolute;
  left: 3%;
  right: 3%;
  bottom: 5%;
  display: flex;
  justify-content: space-between;
  z-index: 2;
`;

const TimeLabel = styled.div`
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode ? '#888' : '#999'};
  opacity: 0.7;
`;

const CandlesContainer = styled.div`
  position: absolute;
  left: 3%;
  right: 3%;
  top: 10%;
  height: 70%;
  display: flex;
  align-items: flex-end;
  z-index: 3;
  justify-content: space-between;
`;

// Enhanced candle styling with dynamic animations
const Candle = styled.div`
  width: 6px;
  background-color: ${props => props.$isUp ? '#4CAF50' : '#F44336'};
  position: relative;
  margin-right: 0;
  transform-origin: bottom;
  
  /* Dynamic animation based on candle direction */
  animation: ${props => props.$isUp ? candlePulseGreen : candlePulseRed} ${props => props.$pulseSpeed}s ease-in-out infinite;
  animation-delay: ${props => props.$delay}s;
  
  &::before, &::after {
    content: '';
    position: absolute;
    left: 50%;
    width: 1px;
    background-color: ${props => props.$isUp ? '#4CAF50' : '#F44336'};
  }
  
  &::before {
    top: 0;
    height: ${props => props.$wickTop}px;
    transform: translateY(-100%);
  }
  
  &::after {
    bottom: 0;
    height: ${props => props.$wickBottom}px;
    transform: translateY(100%);
  }
`;

const TrendLine = styled.div`
  position: absolute;
  left: 3%;
  right: 3%;
  top: 40%;
  height: 2px;
  background: linear-gradient(to right, #2196F3, #4CAF50);
  z-index: 2;
  opacity: 0.7;
  animation: ${drawLine} 1.5s ease-out;
`;

const StatusText = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.9rem;
  color: ${props => props.$isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
  text-align: center;
  animation: ${pulse} 2s infinite ease-in-out;
  z-index: 4;
`;

// ForwardRef for proper ref handling
const CryptoLoader = React.forwardRef(({ 
  height = "400px", 
  message = "Loading chart data...", 
  minDisplayTime = 2500 // Minimum time to display in milliseconds 
}, ref) => {
  const { darkMode } = useContext(ThemeContext);
  const [price, setPrice] = useState(21500);
  const [priceChange, setPriceChange] = useState(0.45);
  const [isVisible, setIsVisible] = useState(true);
  const candlesRef = useRef([]);
  const startTimeRef = useRef(Date.now());
  const loaderRef = useRef(null);
  
  // Combine refs
  React.useImperativeHandle(ref, () => ({
    hideLoader: () => {
      const elapsedTime = Date.now() - startTimeRef.current;
      if (elapsedTime < minDisplayTime) {
        // If we haven't shown the loader for the minimum time,
        // wait before hiding it
        const remainingTime = minDisplayTime - elapsedTime;
        setTimeout(() => {
          setIsVisible(false);
        }, remainingTime);
      } else {
        // We've already displayed it long enough, hide immediately
        setIsVisible(false);
      }
    }
  }));
  
  // When component is mounted, record the start time
  useEffect(() => {
    startTimeRef.current = Date.now();
    // Generate candles
    const candles = [];
    let baseHeight = 40;
    let trendDirection = Math.random() > 0.5 ? 1 : -1;
    
    for (let i = 0; i < 25; i++) {
      // Add some trend to make it look more realistic
      if (i % 5 === 0) {
        // Possibly change trend every 5 candles
        if (Math.random() > 0.7) {
          trendDirection *= -1;
        }
      }
      
      // Add randomness with trend bias
      const randomFactor = (Math.random() - 0.4) * trendDirection;
      const height = baseHeight + randomFactor * 60;
      baseHeight = height;
      
      const isUp = trendDirection > 0 ? Math.random() > 0.4 : Math.random() > 0.6;
      
      // Dynamic animation speeds for each candle
      const pulseSpeed = 2 + Math.random() * 3; // 2-5 seconds
      
      candles.push({
        id: i,
        height: Math.max(15, height),
        isUp,
        wickTop: 2 + Math.random() * 15,
        wickBottom: 2 + Math.random() * 15,
        delay: i * 0.05,
        pulseSpeed
      });
    }
    
    candlesRef.current = candles;
    
    // Animate the price
    const priceInterval = setInterval(() => {
      setPrice(prev => {
        const change = Math.random() * 50 - 25;
        const newPrice = prev + change;
        setPriceChange(change > 0 ? +(change / prev * 100).toFixed(2) : -(Math.abs(change) / prev * 100).toFixed(2));
        return +newPrice.toFixed(2);
      });
    }, 1500);
    
    return () => clearInterval(priceInterval);
  }, []);
  
  // If the loader is hidden, return null
  if (!isVisible) return null;
  
  return (
    <LoaderContainer ref={loaderRef} height={height} $isDarkMode={darkMode}>
      <ChartGrid>
        <HorizontalLine $isDarkMode={darkMode} style={{ top: '25%' }} />
        <HorizontalLine $isDarkMode={darkMode} style={{ top: '50%' }} />
        <HorizontalLine $isDarkMode={darkMode} style={{ top: '75%' }} />
        
        <VerticalLine $isDarkMode={darkMode} style={{ left: '20%' }} />
        <VerticalLine $isDarkMode={darkMode} style={{ left: '40%' }} />
        <VerticalLine $isDarkMode={darkMode} style={{ left: '60%' }} />
        <VerticalLine $isDarkMode={darkMode} style={{ left: '80%' }} />
      </ChartGrid>
      
      <ChartPrice>
        <CurrentPrice $isDarkMode={darkMode}>${price.toLocaleString()}</CurrentPrice>
        <PriceChange $isPositive={priceChange >= 0}>
          {priceChange >= 0 ? '+' : ''}{priceChange}%
        </PriceChange>
      </ChartPrice>
      
      <PriceLabels>
        <PriceLabel $isDarkMode={darkMode}>$22,000</PriceLabel>
        <PriceLabel $isDarkMode={darkMode}>$21,500</PriceLabel>
        <PriceLabel $isDarkMode={darkMode}>$21,000</PriceLabel>
        <PriceLabel $isDarkMode={darkMode}>$20,500</PriceLabel>
      </PriceLabels>
      
      <TimeLabels>
        <TimeLabel $isDarkMode={darkMode}>12:00</TimeLabel>
        <TimeLabel $isDarkMode={darkMode}>14:00</TimeLabel>
        <TimeLabel $isDarkMode={darkMode}>16:00</TimeLabel>
        <TimeLabel $isDarkMode={darkMode}>18:00</TimeLabel>
        <TimeLabel $isDarkMode={darkMode}>20:00</TimeLabel>
      </TimeLabels>
      
      <CandlesContainer>
        {candlesRef.current.map(candle => (
          <Candle 
            key={candle.id}
            $isUp={candle.isUp}
            style={{ 
              height: `${candle.height}px`,
            }}
            $wickTop={candle.wickTop}
            $wickBottom={candle.wickBottom}
            $delay={candle.delay}
            $pulseSpeed={candle.pulseSpeed}
          />
        ))}
      </CandlesContainer>
      
      <TrendLine />
      
      {/* Subtle text indicator without any spinner */}
      <StatusText $isDarkMode={darkMode}>{message}</StatusText>
    </LoaderContainer>
  );
});

// Add displayName for debugging
CryptoLoader.displayName = 'CryptoLoader';

export default CryptoLoader;