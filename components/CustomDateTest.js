import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaChartLine, FaArrowRight, FaInfoCircle } from 'react-icons/fa';
import { useRouter } from 'next/router';
import { ThemeContext } from '../contexts/ThemeContext';

// Styled Components
const Container = styled(motion.div)`
  background: ${({ darkMode }) => 
    darkMode 
      ? 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f7f9fc 100%)'};
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 60px;
  box-shadow: ${({ darkMode }) => 
    darkMode 
      ? '0 10px 30px rgba(0, 0, 0, 0.5)' 
      : '0 10px 30px rgba(0, 0, 0, 0.1)'};
  border: 1px solid ${({ darkMode }) => 
    darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #00c4ff, #00ff88, #ff0080);
    border-radius: 20px 20px 0 0;
  }
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ darkMode }) => (darkMode ? '#FFFFFF' : '#1A1A1A')};
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 15px;

  svg {
    color: #00c4ff;
  }
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: ${({ darkMode }) => (darkMode ? '#a0a0a0' : '#666')};
  line-height: 1.6;
`;

const FormContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ darkMode }) => (darkMode ? '#d0d0d0' : '#444')};
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Select = styled.select`
  padding: 12px 16px;
  background: ${({ darkMode }) => (darkMode ? '#2a2a2a' : '#f5f5f5')};
  border: 2px solid ${({ darkMode }) => (darkMode ? '#3a3a3a' : '#e0e0e0')};
  border-radius: 10px;
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#333')};
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #00c4ff;
  }

  &:focus {
    outline: none;
    border-color: #00c4ff;
    box-shadow: 0 0 0 3px rgba(0, 196, 255, 0.1);
  }
`;

const DateInput = styled.input`
  padding: 12px 16px;
  background: ${({ darkMode }) => (darkMode ? '#2a2a2a' : '#f5f5f5')};
  border: 2px solid ${({ darkMode }) => (darkMode ? '#3a3a3a' : '#e0e0e0')};
  border-radius: 10px;
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#333')};
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #00c4ff;
  }

  &:focus {
    outline: none;
    border-color: #00c4ff;
    box-shadow: 0 0 0 3px rgba(0, 196, 255, 0.1);
  }

  &::-webkit-calendar-picker-indicator {
    filter: ${({ darkMode }) => (darkMode ? 'invert(1)' : 'none')};
    cursor: pointer;
  }
`;

const StartButton = styled.button`
  background: linear-gradient(135deg, #00c4ff 0%, #00ff88 100%);
  color: #fff;
  border: none;
  padding: 16px 40px;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 auto;
  transition: all 0.3s ease;
  box-shadow: 0 5px 20px rgba(0, 196, 255, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 196, 255, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
    box-shadow: none;
  }

  svg {
    transition: transform 0.3s ease;
  }

  &:hover svg {
    transform: translateX(3px);
  }
`;

const InfoBox = styled.div`
  background: ${({ darkMode }) => 
    darkMode ? 'rgba(0, 196, 255, 0.1)' : 'rgba(0, 196, 255, 0.05)'};
  border: 1px solid ${({ darkMode }) => 
    darkMode ? 'rgba(0, 196, 255, 0.3)' : 'rgba(0, 196, 255, 0.2)'};
  border-radius: 12px;
  padding: 16px 20px;
  margin-top: 30px;
  display: flex;
  align-items: flex-start;
  gap: 15px;

  svg {
    color: #00c4ff;
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const InfoText = styled.p`
  font-size: 0.9rem;
  color: ${({ darkMode }) => (darkMode ? '#d0d0d0' : '#666')};
  line-height: 1.5;
  margin: 0;
`;

const ValidationMessage = styled.p`
  color: #ff4d4d;
  font-size: 0.85rem;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const DateConstraintInfo = styled.div`
  font-size: 0.8rem;
  color: ${({ darkMode }) => (darkMode ? '#a0a0a0' : '#666')};
  margin-top: 5px;
  line-height: 1.4;
`;

// Asset options
const assetOptions = {
  crypto: [
    { value: 'btc', label: 'Bitcoin (BTC/USD)' },
    { value: 'eth', label: 'Ethereum (ETH/USD)' },
    { value: 'sol', label: 'Solana (SOL/USD)' },
    { value: 'bnb', label: 'Binance Coin (BNB/USD)' }
  ],
  stocks: [
    { value: 'nvda', label: 'NVIDIA (NVDA)' },
    { value: 'aapl', label: 'Apple (AAPL)' },
    { value: 'tsla', label: 'Tesla (TSLA)' },
    { value: 'gld', label: 'SPDR Gold (GLD)' }
  ],
  commodities: [
    { value: 'xau', label: 'Gold (XAU/USD)' },
    { value: 'cl', label: 'Crude Oil (CL)' },
    { value: 'xag', label: 'Silver (XAG/USD)' },
    { value: 'ng', label: 'Natural Gas (NG)' }
  ]
};

// Timeframe options with setup and outcome candle counts (matching bias test logic)
const timeframeOptions = [
  { 
    value: '4h', 
    label: '4 Hour', 
    setupCandles: 120,    // 120 * 4 hours = 20 days
    outcomeCandles: 30,   // 30 * 4 hours = 5 days
    minDaysAgo: 7,        // Minimum 7 days ago for outcome
    candleHours: 4
  },
  { 
    value: 'daily', 
    label: 'Daily', 
    setupCandles: 90,     // 90 days
    outcomeCandles: 20,   // 20 days
    minDaysAgo: 25,       // Minimum 25 days ago
    candleHours: 24
  },
  { 
    value: 'weekly', 
    label: 'Weekly', 
    setupCandles: 52,     // 52 weeks = ~1 year
    outcomeCandles: 16,   // 16 weeks = ~4 months
    minDaysAgo: 120,      // Minimum 120 days ago
    candleHours: 168      // 24 * 7
  },
  { 
    value: 'monthly', 
    label: 'Monthly', 
    setupCandles: 36,     // 36 months = 3 years
    outcomeCandles: 12,   // 12 months = 1 year
    minDaysAgo: 400,      // Minimum 400 days ago
    candleHours: 720      // 24 * 30 (approximate)
  }
];

export default function CustomDateTest() {
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('daily');
  const [selectedDate, setSelectedDate] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Calculate date constraints based on timeframe
  const getDateConstraints = () => {
    const timeframe = timeframeOptions.find(tf => tf.value === selectedTimeframe);
    if (!timeframe) return { min: '', max: '', info: '' };

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    // Calculate required days for setup + outcome
    const outcomeDays = Math.ceil((timeframe.outcomeCandles * timeframe.candleHours) / 24);
    const setupDays = Math.ceil((timeframe.setupCandles * timeframe.candleHours) / 24);
    const totalDaysNeeded = setupDays + outcomeDays;

    // Max date: Must be at least minDaysAgo in the past to have complete outcome data
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() - timeframe.minDaysAgo);

    // Min date: 2 years ago (730 days) or totalDaysNeeded, whichever is larger
    const minDate = new Date(today);
    const daysAgo = Math.max(730, totalDaysNeeded + timeframe.minDaysAgo);
    minDate.setDate(today.getDate() - daysAgo);

    // Account for API data delay (0.3-2 minutes, but we'll be conservative)
    if (timeframe.value === '4h') {
      // For 4h candles, ensure we're not too close to current time
      maxDate.setDate(maxDate.getDate() - 1); // Extra day buffer for 4h candles
    }

    const info = `Setup: ${setupDays} days " Outcome: ${outcomeDays} days " Total: ${totalDaysNeeded} days needed`;

    return {
      min: minDate.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0],
      info: info,
      setupDays,
      outcomeDays,
      totalDaysNeeded
    };
  };

  const validateAndStart = async () => {
    if (!selectedAsset || !selectedDate) {
      setValidationError('Please select an asset and date');
      return;
    }

    setIsValidating(true);
    setValidationError('');

    try {
      const constraints = getDateConstraints();
      const selectedDateObj = new Date(selectedDate);
      const minDateObj = new Date(constraints.min);
      const maxDateObj = new Date(constraints.max);

      // Validate date is within constraints
      if (selectedDateObj < minDateObj || selectedDateObj > maxDateObj) {
        setValidationError(`Date must be between ${minDateObj.toLocaleDateString()} and ${maxDateObj.toLocaleDateString()}`);
        setIsValidating(false);
        return;
      }

      // Generate a unique session ID
      const sessionId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Navigate to the custom test page with parameters
      router.push({
        pathname: '/bias-test/custom',
        query: {
          asset: selectedAsset,
          timeframe: selectedTimeframe,
          date: selectedDate,
          session_id: sessionId,
          mode: 'custom' // Distinguish from regular bias test
        }
      });
    } catch (error) {
      setValidationError('Error starting test. Please try again.');
      console.error('Error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const constraints = getDateConstraints();

  return (
    <Container
      darkMode={darkMode}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Header>
        <Title darkMode={darkMode}>
          <FaCalendarAlt />
          Choose Your Own Date
        </Title>
        <Subtitle darkMode={darkMode}>
          Test your bias on a specific historical date. Select an asset, timeframe, and date to analyze past market movements.
        </Subtitle>
      </Header>

      <FormContainer>
        <FormGroup>
          <Label darkMode={darkMode}>Asset Type</Label>
          <Select 
            darkMode={darkMode}
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
          >
            <option value="">Select an asset...</option>
            <optgroup label="Cryptocurrencies">
              {assetOptions.crypto.map(asset => (
                <option key={asset.value} value={asset.value}>
                  {asset.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Stocks">
              {assetOptions.stocks.map(asset => (
                <option key={asset.value} value={asset.value}>
                  {asset.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Commodities">
              {assetOptions.commodities.map(asset => (
                <option key={asset.value} value={asset.value}>
                  {asset.label}
                </option>
              ))}
            </optgroup>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label darkMode={darkMode}>Timeframe</Label>
          <Select 
            darkMode={darkMode}
            value={selectedTimeframe}
            onChange={(e) => {
              setSelectedTimeframe(e.target.value);
              setSelectedDate(''); // Reset date when timeframe changes
            }}
          >
            {timeframeOptions.map(tf => (
              <option key={tf.value} value={tf.value}>
                {tf.label}
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <Label darkMode={darkMode}>Select Date (End of Setup Period)</Label>
          <DateInput
            type="date"
            darkMode={darkMode}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={constraints.min}
            max={constraints.max}
            disabled={!selectedTimeframe}
          />
          {selectedTimeframe && (
            <DateConstraintInfo darkMode={darkMode}>
              <div>Range: {new Date(constraints.min).toLocaleDateString()} to {new Date(constraints.max).toLocaleDateString()}</div>
              <div>{constraints.info}</div>
            </DateConstraintInfo>
          )}
        </FormGroup>
      </FormContainer>

      {validationError && (
        <ValidationMessage>
          <FaInfoCircle />
          {validationError}
        </ValidationMessage>
      )}

      <StartButton
        onClick={validateAndStart}
        disabled={!selectedAsset || !selectedDate || isValidating}
      >
        <FaChartLine />
        {isValidating ? 'Starting...' : 'Start Analysis'}
        <FaArrowRight />
      </StartButton>

      <InfoBox darkMode={darkMode}>
        <FaInfoCircle />
        <InfoText darkMode={darkMode}>
          <strong>How it works:</strong> Select a date as the end of your setup period. 
          You'll see the chart leading up to that date, make your prediction, 
          then reveal what happened in the outcome period after. 
          The date range adjusts based on your selected timeframe to ensure enough data is available.
        </InfoText>
      </InfoBox>
    </Container>
  );
}