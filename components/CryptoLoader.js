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

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const slideUp = keyframes`
  0% { transform: translateY(5px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const drawLine = keyframes`
  0% { width: 0; }
  100% { width: 100%; }
`;

// Styled Components
const LoaderContainer = styled.div`
  width: 100%;
  height: ${props => props.height || '400px'};
  position: relative;
  background-color: ${props => props.darkMode ? '#1e1e1e' : '#f8f9fa'};
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
  background-color: ${props => props.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
`;

const VerticalLine = styled.div`
  position: absolute;
  top: 10%;
  bottom: 20%;
  width: 1px;
  background-color: ${props => props.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
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
  color: ${props => props.darkMode ? '#e0e0e0' : '#333'};
  margin-bottom: 5px;
`;

const PriceChange = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${props => props.positive ? '#4CAF50' : '#F44336'};
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
  color: ${props => props.darkMode ? '#888' : '#999'};
  opacity: 0.7;
`;

const TimeLabels = styled.div`
  position: absolute;
  left: 5%;
  right: 5%;
  bottom: 5%;
  display: flex;
  justify-content: space-between;
  z-index: 2;
`;

const TimeLabel = styled.div`
  font-size: 0.75rem;
  color: ${props => props.darkMode ? '#888' : '#999'};
  opacity: 0.7;
`;

const CandlesContainer = styled.div`
  position: absolute;
  left: 5%;
  right: 15%;
  top: 10%;
  height: 70%;
  display: flex;
  align-items: flex-end;
  z-index: 3;
`;

const Candle = styled.div`
  width: 6px;
  background-color: ${props => props.isUp ? '#4CAF50' : '#F44336'};
  position: relative;
  margin-right: 12px;
  animation: ${slideUp} 0.5s ease-out;
  animation-delay: ${props => props.delay}s;
  
  &::before, &::after {
    content: '';
    position: absolute;
    left: 50%;
    width: 1px;
    background-color: ${props => props.isUp ? '#4CAF50' : '#F44336'};
  }
  
  &::before {
    top: 0;
    height: ${props => props.wickTop}px;
    transform: translateY(-100%);
  }
  
  &::after {
    bottom: 0;
    height: ${props => props.wickBottom}px;
    transform: translateY(100%);
  }
`;

const TrendLine = styled.div`
  position: absolute;
  left: 5%;
  top: 40%;
  height: 2px;
  background: linear-gradient(to right, #2196F3, #4CAF50);
  z-index: 2;
  opacity: 0.7;
  animation: ${drawLine} 1.5s ease-out;
`;

const LoadingText = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.darkMode ? '#b0b0b0' : '#666'};
  font-weight: 500;
  margin-top: 10px;
  z-index: 4;
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid ${props => props.darkMode ? '#90CAF9' : '#2196F3'};
  border-radius: 50%;
  margin-right: 10px;
  animation: ${spin} 1s linear infinite;
`;

const CryptoLoader = ({ height = "400px", message = "Loading chart data..." }) => {
  const { darkMode } = useContext(ThemeContext);
  const [price, setPrice] = useState(21500);
  const [priceChange, setPriceChange] = useState(0.45);
  const candlesRef = useRef([]);
  
  // Generate initial random candles
  useEffect(() => {
    const generateCandles = () => {
      const candles = [];
      let baseHeight = 40;
      
      for (let i = 0; i < 15; i++) {
        const isUp = Math.random() > 0.4;
        const height = baseHeight + Math.random() * 60;
        baseHeight = height * (1 + (Math.random() * 0.2 - 0.1));
        
        candles.push({
          id: i,
          height,
          isUp,
          wickTop: 2 + Math.random() * 15,
          wickBottom: 2 + Math.random() * 15,
          delay: i * 0.05
        });
      }
      
      candlesRef.current = candles;
    };
    
    generateCandles();
    
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
  
  return (
    <LoaderContainer darkMode={darkMode} height={height}>
      <ChartGrid>
        <HorizontalLine darkMode={darkMode} style={{ top: '25%' }} />
        <HorizontalLine darkMode={darkMode} style={{ top: '50%' }} />
        <HorizontalLine darkMode={darkMode} style={{ top: '75%' }} />
        
        <VerticalLine darkMode={darkMode} style={{ left: '20%' }} />
        <VerticalLine darkMode={darkMode} style={{ left: '40%' }} />
        <VerticalLine darkMode={darkMode} style={{ left: '60%' }} />
        <VerticalLine darkMode={darkMode} style={{ left: '80%' }} />
      </ChartGrid>
      
      <ChartPrice>
        <CurrentPrice darkMode={darkMode}>${price.toLocaleString()}</CurrentPrice>
        <PriceChange positive={priceChange >= 0}>
          {priceChange >= 0 ? '+' : ''}{priceChange}%
        </PriceChange>
      </ChartPrice>
      
      <PriceLabels>
        <PriceLabel darkMode={darkMode}>$22,000</PriceLabel>
        <PriceLabel darkMode={darkMode}>$21,500</PriceLabel>
        <PriceLabel darkMode={darkMode}>$21,000</PriceLabel>
        <PriceLabel darkMode={darkMode}>$20,500</PriceLabel>
      </PriceLabels>
      
      <TimeLabels>
        <TimeLabel darkMode={darkMode}>12:00</TimeLabel>
        <TimeLabel darkMode={darkMode}>14:00</TimeLabel>
        <TimeLabel darkMode={darkMode}>16:00</TimeLabel>
        <TimeLabel darkMode={darkMode}>18:00</TimeLabel>
        <TimeLabel darkMode={darkMode}>20:00</TimeLabel>
      </TimeLabels>
      
      <CandlesContainer>
        {candlesRef.current.map(candle => (
          <Candle 
            key={candle.id}
            isUp={candle.isUp}
            style={{ 
              height: `${candle.height}px`,
            }}
            wickTop={candle.wickTop}
            wickBottom={candle.wickBottom}
            delay={candle.delay}
          />
        ))}
      </CandlesContainer>
      
      <TrendLine />
      
      <LoadingText darkMode={darkMode}>
        <LoadingSpinner darkMode={darkMode} />
        {message}
      </LoadingText>
    </LoaderContainer>
  );
};

export default CryptoLoader;