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

// Enhanced dynamic candle pulse animations with more variety
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

const fadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

const pricePulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
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
  animation: ${fadeIn} 0.5s ease-in;
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
  animation: ${fadeIn} 1s ease-in;
`;

const VerticalLine = styled.div`
  position: absolute;
  top: 10%;
  bottom: 20%;
  width: 1px;
  background-color: ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
  animation: ${fadeIn} 1s ease-in;
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
  animation: ${pricePulse} 2s ease-in-out infinite;
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
  animation: ${fadeIn} 1.2s ease-in;
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
  animation: ${fadeIn} 1.2s ease-in;
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
  opacity: 0;
  animation: ${fadeIn} 0.3s ease-in forwards;
  animation-delay: ${props => props.$delay}s;
  
  /* Dynamic animation based on candle direction */
  &.animated {
    animation: ${props => props.$isUp ? candlePulseGreen : candlePulseRed} ${props => props.$pulseSpeed}s ease-in-out infinite;
    animation-delay: ${props => props.$delay}s;
    opacity: 1;
  }
  
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
  opacity: 0;
  transform-origin: left;
  animation: ${drawLine} 2.5s ease-out forwards, ${fadeIn} 0.8s ease-in forwards;
  animation-delay: 0.5s;
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
  minDisplayTime = 2500, // Minimum time to display in milliseconds 
  candleCount = 32 // More candles for a richer visualization
}, ref) => {
  const { darkMode } = useContext(ThemeContext);
  
  // Pre-calculate random price range for initial state
  const getRandomPriceData = () => {
    const priceRanges = [
      { min: 15000, max: 25000 },   // Bitcoin-like range
      { min: 1000, max: 2500 },     // Ethereum-like range
      { min: 0.5, max: 2 },         // XRP-like range
      { min: 50, max: 150 },        // Solana-like range
      { min: 5, max: 15 }           // Polkadot-like range
    ];
    
    const selectedRange = priceRanges[Math.floor(Math.random() * priceRanges.length)];
    const randomPrice = selectedRange.min + Math.random() * (selectedRange.max - selectedRange.min);
    
    // Format based on range
    let formattedPrice;
    if (selectedRange.min < 1) {
      formattedPrice = +randomPrice.toFixed(4);
    } else if (selectedRange.min < 100) {
      formattedPrice = +randomPrice.toFixed(2);
    } else {
      formattedPrice = Math.round(randomPrice);
    }
    
    return { 
      price: formattedPrice, 
      priceRange: selectedRange 
    };
  };
  
  // Get initial random price data
  const initialPriceData = getRandomPriceData();
  
  // Initialize states with random values
  const [price, setPrice] = useState(initialPriceData.price);
  const [priceRange, setPriceRange] = useState(initialPriceData.priceRange);
  const [priceChange, setPriceChange] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [candles, setCandles] = useState([]);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [priceLabels, setPriceLabels] = useState([]);
  const [timeLabels, setTimeLabels] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const startTimeRef = useRef(Date.now());
  const loaderRef = useRef(null);
  const priceIntervalRef = useRef(null);
  const candleAnimationTimerRef = useRef(null);
  const candleUpdateIntervalRef = useRef(null);
  
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
  
  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
      if (candleAnimationTimerRef.current) clearTimeout(candleAnimationTimerRef.current);
      if (candleUpdateIntervalRef.current) clearInterval(candleUpdateIntervalRef.current);
    };
  }, []);
  
  // Generate time labels
  useEffect(() => {
    // Generate time labels dynamically
    const now = new Date();
    const labels = [];
    for (let i = 0; i < 5; i++) {
      const time = new Date(now);
      time.setHours(time.getHours() - (4 - i) * 2);
      labels.push(time.getHours() + ':00');
    }
    setTimeLabels(labels);
  }, []);
  
  // Generate and animate candles
  useEffect(() => {
    startTimeRef.current = Date.now();
    
    // Generate candles
    const generatedCandles = [];
    let baseHeight = 40;
    let trendDirection = Math.random() > 0.5 ? 1 : -1;
    
    for (let i = 0; i < candleCount; i++) {
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
      
      generatedCandles.push({
        id: i,
        height: Math.max(15, height),
        isUp,
        wickTop: 2 + Math.random() * 15,
        wickBottom: 2 + Math.random() * 15,
        delay: i * 0.03, // Faster sequential appearance
        pulseSpeed,
        animated: false // Will be set to true sequentially
      });
    }
    
    setCandles(generatedCandles);
    
    // Start sequential animation of candles
    let animatedCount = 0;
    const animateCandles = () => {
      if (animatedCount < generatedCandles.length) {
        setCandles(prevCandles => {
          const newCandles = [...prevCandles];
          if (newCandles[animatedCount]) {
            newCandles[animatedCount] = { ...newCandles[animatedCount], animated: true };
          }
          return newCandles;
        });
        animatedCount++;
        candleAnimationTimerRef.current = setTimeout(animateCandles, 50);
      } else {
        setAnimationStarted(true);
      }
    };
    
    // Start animation after a small delay
    setTimeout(animateCandles, 300);
    
    // Add some influence from the candles
    const lastCandlesAvg = generatedCandles
      .slice(-5)
      .reduce((sum, candle) => sum + candle.height, 0) / 5;
    
    // Adjust price based on candle pattern but keep within the selected range
    const priceAdjustment = lastCandlesAvg * (priceRange.max - priceRange.min) / 100;
    let finalPrice = price + priceAdjustment;
    
    // Keep within range
    finalPrice = Math.max(priceRange.min, Math.min(priceRange.max, finalPrice));
    
    // Set the price with appropriate decimal places based on the range
    if (priceRange.min < 1) {
      // For very low prices (like XRP), use more decimal places
      setPrice(+finalPrice.toFixed(4));
    } else if (priceRange.min < 100) {
      // For medium range prices
      setPrice(+finalPrice.toFixed(2));
    } else {
      // For high value coins like BTC, round to whole numbers
      setPrice(Math.round(finalPrice));
    }
    
    // Generate dynamic price labels
    const dynamicPriceLabels = [];
    const priceStep = priceRange.min < 1 ? 
      priceRange.max / 4 : 
      (priceRange.max - priceRange.min) / 4;
      
    for (let i = 0; i < 4; i++) {
      let labelPrice = finalPrice + (2 - i) * priceStep;
      
      // Format label price based on range
      if (priceRange.min < 1) {
        dynamicPriceLabels.push(+labelPrice.toFixed(4));
      } else if (priceRange.min < 100) {
        dynamicPriceLabels.push(+labelPrice.toFixed(2));
      } else {
        dynamicPriceLabels.push(Math.round(labelPrice));
      }
    }
    setPriceLabels(dynamicPriceLabels);
    
    // Mark as initialized
    setIsInitialized(true);
    
    // Animate the price with random fluctuations more frequently
    priceIntervalRef.current = setInterval(() => {
      setPrice(prev => {
        // More volatile price changes
        const volatility = 0.005; // 0.5% volatility per update
        const change = prev * (Math.random() * volatility * 2 - volatility);
        const newPrice = prev + change;
        
        // Set price change as percentage
        const changePercent = (change / prev * 100);
        setPriceChange(changePercent.toFixed(2));
        
        // Format based on price range
        if (prev < 1) {
          return +newPrice.toFixed(4);
        } else if (prev < 100) {
          return +newPrice.toFixed(2);
        } else {
          return Math.round(newPrice);
        }
      });
    }, 800); // More frequent updates
    
    // Periodically update some candles to create a dynamic chart effect
    candleUpdateIntervalRef.current = setInterval(() => {
      setCandles(prevCandles => {
        const newCandles = [...prevCandles];
        
        // Update 2-4 random candles
        const numUpdates = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numUpdates; i++) {
          const randomIndex = Math.floor(Math.random() * newCandles.length);
          const candle = newCandles[randomIndex];
          
          if (candle) {
            // Randomly change direction sometimes
            const newIsUp = Math.random() > 0.6 ? !candle.isUp : candle.isUp;
            
            // Adjust height
            const heightChange = (Math.random() - 0.5) * 30;
            const newHeight = Math.max(15, candle.height + heightChange);
            
            newCandles[randomIndex] = {
              ...candle,
              isUp: newIsUp,
              height: newHeight,
              pulseSpeed: 1 + Math.random() * 4, // vary animation speed
              wickTop: 2 + Math.random() * 15,
              wickBottom: 2 + Math.random() * 15,
            };
          }
        }
        
        return newCandles;
      });
    }, 1200); // Update candles every 1.2 seconds
    
    return () => {
      clearInterval(priceIntervalRef.current);
      clearTimeout(candleAnimationTimerRef.current);
      clearInterval(candleUpdateIntervalRef.current);
    };
  }, [candleCount, price, priceRange]);
  
  // If the loader is hidden, return null
  if (!isVisible) return null;
  
  // Don't render until fully initialized
  if (!isInitialized) return (
    <LoaderContainer ref={loaderRef} height={height} $isDarkMode={darkMode} style={{ justifyContent: 'center', alignItems: 'center' }}>
      {/* Minimal placeholder while initializing */}
    </LoaderContainer>
  );
  
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
        <PriceChange $isPositive={parseFloat(priceChange) >= 0}>
          {parseFloat(priceChange) >= 0 ? '+' : ''}{Math.abs(parseFloat(priceChange)).toFixed(2)}%
        </PriceChange>
      </ChartPrice>
      
      <PriceLabels>
        {priceLabels.map((label, index) => (
          <PriceLabel key={index} $isDarkMode={darkMode}>${label.toLocaleString()}</PriceLabel>
        ))}
      </PriceLabels>
      
      <TimeLabels>
        {timeLabels.map((label, index) => (
          <TimeLabel key={index} $isDarkMode={darkMode}>{label}</TimeLabel>
        ))}
      </TimeLabels>
      
      <CandlesContainer>
        {candles.map(candle => (
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
            className={candle.animated ? 'animated' : ''}
          />
        ))}
      </CandlesContainer>
      
      {animationStarted && <TrendLine />}
      
      <StatusText $isDarkMode={darkMode}>
        {message}
      </StatusText>
    </LoaderContainer>
  );
});

// Add displayName for debugging
CryptoLoader.displayName = 'CryptoLoader';

export default CryptoLoader;