// components/CryptoLoader.js - With synchronized price changes and slower candles
import React, { useContext, useEffect, useState, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';

// Animations with full richness
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

// Keep the rich candle animations 
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

// Enhanced price animation for dramatic effect when new candle appears
const priceUpdate = keyframes`
  0% { transform: scale(1); color: inherit; }
  30% { transform: scale(1.15); color: #4CAF50; }
  100% { transform: scale(1); color: inherit; }
`;

// Styled components
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
  
  &.updating {
    animation: ${priceUpdate} 0.8s ease-out;
  }
  
  &:not(.updating) {
    animation: ${pricePulse} 2s ease-in-out infinite;
  }
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

const Candle = styled.div`
  width: 6px;
  background-color: ${props => props.$isUp ? '#4CAF50' : '#F44336'};
  position: relative;
  margin-right: 0;
  transform-origin: bottom;
  opacity: 0;
  animation: ${fadeIn} 0.3s ease-in forwards;
  animation-delay: ${props => props.$delay}s;
  
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

// Loading badge that doesn't interfere with chart visualization
const StatusBadge = styled.div`
  position: absolute;
  bottom: 15px;
  right: 15px;
  padding: 8px 15px;
  background: ${props => props.$isDarkMode ? 
    'linear-gradient(135deg, rgba(30, 30, 30, 0.9), rgba(20, 20, 20, 0.95))' : 
    'linear-gradient(135deg, rgba(250, 250, 250, 0.9), rgba(240, 240, 240, 0.95))'};
  border-radius: 30px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(5px);
  border: 1px solid ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
  z-index: 5;
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, #4CAF50, #2196F3, #4CAF50);
    border-radius: 32px;
    z-index: -1;
    opacity: 0.6;
    filter: blur(5px);
    animation: ${pulse} 3s infinite ease-in-out;
  }
`;

const StatusText = styled.div`
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  white-space: nowrap;
`;

const LoadingDots = styled.span`
  display: inline-block;
  margin-left: 5px;
  
  &::after {
    content: '';
    animation: ${keyframes`
      0% { content: '.'; }
      33% { content: '..'; }
      66% { content: '...'; }
      100% { content: '.'; }
    `} 1.5s infinite steps(1);
  }
`;

const DataIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 6px;
  
  svg {
    animation: ${keyframes`
      0% { transform: translateY(0); }
      50% { transform: translateY(-2px); }
      100% { transform: translateY(0); }
    `} 1.5s infinite ease-in-out;
    color: ${props => props.$isDarkMode ? '#4CAF50' : '#1E88E5'};
  }
`;

// Fixed forwardRef implementation
const CryptoLoader = React.forwardRef(function CryptoLoader(props, ref) {
  const { 
    height = "400px", 
    message = "Loading chart data...", 
    minDisplayTime = 2500,
    candleCount = 26,
    lightMode = false
  } = props;
  
  // Safe access to ThemeContext using custom hook
  const { darkMode } = useTheme();
  
  // Get initial random price data
  const getRandomPriceData = () => {
    const priceRanges = [
      { min: 15000, max: 25000 },
      { min: 1000, max: 2500 },
      { min: 0.5, max: 2 },
      { min: 50, max: 150 },
      { min: 5, max: 15 }
    ];
    
    const selectedRange = priceRanges[Math.floor(Math.random() * priceRanges.length)];
    const randomPrice = selectedRange.min + Math.random() * (selectedRange.max - selectedRange.min);
    
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
  
  const [price, setPrice] = useState(initialPriceData.price);
  const [priceRange, setPriceRange] = useState(initialPriceData.priceRange);
  const [priceChange, setPriceChange] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [candles, setCandles] = useState([]);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [priceLabels, setPriceLabels] = useState([]);
  const [timeLabels, setTimeLabels] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPriceUpdating, setIsPriceUpdating] = useState(false);
  
  const startTimeRef = useRef(Date.now());
  const priceIntervalRef = useRef(null);
  const candleAnimationTimerRef = useRef(null);
  const candleUpdateIntervalRef = useRef(null);
  
  // Handle ref for external control
  useEffect(() => {
    if (ref) {
      ref.current = {
        hideLoader: () => {
          const elapsedTime = Date.now() - startTimeRef.current;
          if (elapsedTime < minDisplayTime) {
            setTimeout(() => {
              setIsLoading(false);
            }, minDisplayTime - elapsedTime);
          } else {
            setIsLoading(false);
          }
        }
      };
    }
    
    return () => {
      if (ref) {
        ref.current = null;
      }
    };
  }, [minDisplayTime, ref]);
  
  // Initialize time labels
  useEffect(() => {
    const now = new Date();
    const labels = [];
    for (let i = 0; i < 5; i++) {
      const time = new Date(now);
      time.setHours(time.getHours() - (4 - i) * 2);
      labels.push(time.getHours() + ':00');
    }
    setTimeLabels(labels);
  }, []);
  
  // Generate and animate candles with synchronized price updates
  useEffect(() => {
    startTimeRef.current = Date.now();
    
    // Generate candles
    const generatedCandles = [];
    let baseHeight = 40;
    let trendDirection = Math.random() > 0.5 ? 1 : -1;
    
    for (let i = 0; i < candleCount; i++) {
      if (i % 5 === 0) {
        if (Math.random() > 0.7) {
          trendDirection *= -1;
        }
      }
      
      const randomFactor = (Math.random() - 0.4) * trendDirection;
      const height = baseHeight + randomFactor * 60;
      baseHeight = height;
      
      const isUp = trendDirection > 0 ? Math.random() > 0.4 : Math.random() > 0.6;
      const pulseSpeed = 2 + Math.random() * 3;
      
      generatedCandles.push({
        id: i,
        height: Math.max(15, height),
        isUp,
        wickTop: 2 + Math.random() * 15,
        wickBottom: 2 + Math.random() * 15,
        // SLOWED DOWN candle appearance - important for your request
        delay: i * 0.18, // Slower sequential appearance 
        pulseSpeed,
        animated: false
      });
    }
    
    setCandles(generatedCandles);
    setIsInitialized(true);
    
    // Generate initial price labels
    const dynamicPriceLabels = [];
    const priceStep = priceRange.min < 1 ? 
      priceRange.max / 4 : 
      (priceRange.max - priceRange.min) / 4;
      
    for (let i = 0; i < 4; i++) {
      let labelPrice = price + (2 - i) * priceStep;
      
      if (priceRange.min < 1) {
        dynamicPriceLabels.push(+labelPrice.toFixed(4));
      } else if (priceRange.min < 100) {
        dynamicPriceLabels.push(+labelPrice.toFixed(2));
      } else {
        dynamicPriceLabels.push(Math.round(labelPrice));
      }
    }
    setPriceLabels(dynamicPriceLabels);
    
    // Start sequential animation of candles with synchronized price updates
    let animatedCount = 0;
    const animateCandles = () => {
      if (animatedCount < generatedCandles.length) {
        // Update candle animation state
        setCandles(prevCandles => {
          const newCandles = [...prevCandles];
          if (newCandles[animatedCount]) {
            newCandles[animatedCount] = { ...newCandles[animatedCount], animated: true };
          }
          return newCandles;
        });
        
        // KEY CHANGE: Synchronize price change with each new candle appearance
        const candle = generatedCandles[animatedCount];
        
        // Trigger price update animation
        setIsPriceUpdating(true);
        setTimeout(() => setIsPriceUpdating(false), 800);
        
        // Calculate price change based on candle characteristics (SYNCHRONIZED)
        // Green candles (isUp: true) = positive price movement
        // Red candles (isUp: false) = negative price movement
        const volatilityFactor = 0.005 + (Math.random() * 0.01);
        const priceDirection = candle.isUp ? 1 : -1; // Sync with candle color
        const changeMagnitude = price * volatilityFactor * priceDirection;
        
        // Update price with dramatic movement in sync with new candle
        setPrice(prev => {
          const newPrice = prev + changeMagnitude;
          
          if (prev < 1) {
            return +newPrice.toFixed(4);
          } else if (prev < 100) {
            return +newPrice.toFixed(2);
          } else {
            return Math.round(newPrice);
          }
        });
        
        // Set price change as percentage
        const changePercent = (changeMagnitude / price * 100);
        setPriceChange(changePercent.toFixed(2));
        
        animatedCount++;
        
        // Schedule next candle animation with a dramatic pause
        candleAnimationTimerRef.current = setTimeout(animateCandles, 300);
      } else {
        setAnimationStarted(true);
        
        // After all candles are loaded, start periodic updates
        if (!lightMode) {
          candleUpdateIntervalRef.current = setInterval(() => {
            // First determine the price movement direction
            const priceDirection = Math.random() > 0.5 ? 1 : -1; // 1 for up, -1 for down
            const newIsUp = priceDirection > 0; // Sync candle color with price direction
            
            // Update a random candle with synchronized color
            setCandles(prevCandles => {
              const newCandles = [...prevCandles];
              const randomIndex = Math.floor(Math.random() * newCandles.length);
              const candle = newCandles[randomIndex];
              
              if (candle) {
                const heightChange = (Math.random() - 0.5) * 30;
                const newHeight = Math.max(15, candle.height + heightChange);
                
                newCandles[randomIndex] = {
                  ...candle,
                  isUp: newIsUp, // Use synchronized color
                  height: newHeight,
                  pulseSpeed: 1 + Math.random() * 4,
                  wickTop: 2 + Math.random() * 15,
                  wickBottom: 2 + Math.random() * 15,
                };
              }
              
              return newCandles;
            });
            
            // Trigger price update animation
            setIsPriceUpdating(true);
            setTimeout(() => setIsPriceUpdating(false), 800);
            
            // Update price with synchronized movement
            setPrice(prev => {
              const volatilityFactor = 0.003 + (Math.random() * 0.007); // 0.3% to 1%
              const changeMagnitude = prev * volatilityFactor * priceDirection; // Use same direction
              const newPrice = prev + changeMagnitude;
              
              // Set price change as percentage (synchronized with candle direction)
              const changePercent = (changeMagnitude / prev * 100);
              setPriceChange(changePercent.toFixed(2));
              
              if (prev < 1) {
                return +newPrice.toFixed(4);
              } else if (prev < 100) {
                return +newPrice.toFixed(2);
              } else {
                return Math.round(newPrice);
              }
            });
          }, 2000);
        }
      }
    };
    
    // Start animation after a small delay
    setTimeout(animateCandles, 300);
    
    // Clean up all intervals on unmount
    return () => {
      if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
      if (candleAnimationTimerRef.current) clearTimeout(candleAnimationTimerRef.current);
      if (candleUpdateIntervalRef.current) clearInterval(candleUpdateIntervalRef.current);
    };
  }, []);  // Only run once on mount
  
  if (!isVisible) return null;
  
  if (!isInitialized) {
    return (
      <LoaderContainer height={height} $isDarkMode={darkMode}>
        <StatusText $isDarkMode={darkMode}>
          <DataIcon $isDarkMode={darkMode}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </DataIcon>
          {message}
          <LoadingDots />
        </StatusText>
      </LoaderContainer>
    );
  }
  
  return (
    <LoaderContainer height={height} $isDarkMode={darkMode}>
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
        <CurrentPrice 
          $isDarkMode={darkMode} 
          className={isPriceUpdating ? 'updating' : ''}
        >
          ${price.toLocaleString()}
        </CurrentPrice>
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
            style={{ height: `${candle.height}px` }}
            $wickTop={candle.wickTop}
            $wickBottom={candle.wickBottom}
            $delay={candle.delay}
            $pulseSpeed={candle.pulseSpeed}
            className={candle.animated ? 'animated' : ''}
          />
        ))}
      </CandlesContainer>
      
      {animationStarted && <TrendLine />}
      
      {isLoading && (
        <StatusBadge $isDarkMode={darkMode}>
          <StatusText $isDarkMode={darkMode}>
            <DataIcon $isDarkMode={darkMode}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </DataIcon>
            {message}
            <LoadingDots />
          </StatusText>
        </StatusBadge>
      )}
    </LoaderContainer>
  );
});

// Add displayName for debugging
CryptoLoader.displayName = 'CryptoLoader';

export default CryptoLoader;