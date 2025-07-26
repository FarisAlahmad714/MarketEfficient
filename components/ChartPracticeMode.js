import React, { useState, useContext, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { ThemeContext } from '../contexts/ThemeContext';
import PracticeChart from './charting_exam/PracticeChart';
import CryptoLoader from './CryptoLoader';

// Styled Components
const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 10px;
  color: ${props => props.darkMode ? '#e0e0e0' : '#333'};
`;

const ControlPanel = styled.div`
  background: ${props => props.darkMode ? '#1e1e1e' : '#f8f9fa'};
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;


const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: ${props => props.darkMode ? '#b0b0b0' : '#555'};
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid ${props => props.darkMode ? '#404040' : '#ddd'};
  border-radius: 6px;
  background: ${props => props.darkMode ? '#2a2a2a' : '#fff'};
  color: ${props => props.darkMode ? '#e0e0e0' : '#333'};
  font-size: 1rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #2196F3;
  }
`;


const Button = styled.button`
  padding: 12px 24px;
  background: ${props => props.primary ? '#2196F3' : 'transparent'};
  color: ${props => props.primary ? '#fff' : (props.darkMode ? '#e0e0e0' : '#333')};
  border: ${props => props.primary ? 'none' : `2px solid ${props.darkMode ? '#404040' : '#ddd'}`};
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.primary ? '#1976D2' : (props.darkMode ? '#333' : '#f0f0f0')};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ToolBar = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding: 20px;
  background: ${props => props.darkMode ? '#1e1e1e' : '#f8f9fa'};
  border-radius: 12px;
  flex-wrap: wrap;
  align-items: center;
`;

const ToolButton = styled.button`
  padding: 10px 20px;
  background: ${props => props.$active ? '#2196F3' : 'transparent'};
  color: ${props => props.$active ? '#fff' : (props.$darkMode ? '#e0e0e0' : '#333')};
  border: 2px solid ${props => props.$active ? '#2196F3' : (props.$darkMode ? '#404040' : '#ddd')};
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.$active ? '#1976D2' : (props.$darkMode ? '#333' : '#f0f0f0')};
    border-color: #2196F3;
  }
`;

const ChartContainer = styled.div`
  position: relative;
  margin-bottom: 30px;
  background: ${props => props.$darkMode ? '#1e1e1e' : 'white'};
  border: 1px solid ${props => props.$darkMode ? '#3a3a3a' : '#e0e0e0'};
  border-radius: 8px;
  padding: 1rem;
  min-height: 600px;
`;

const ResultsPanel = styled.div`
  background: ${props => props.$darkMode ? '#1e1e1e' : '#f8f9fa'};
  border-radius: 12px;
  padding: 25px;
  margin-top: 20px;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${props => props.$darkMode ? '#1e1e1e' : 'white'};
  border-radius: 12px;
  padding: 30px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.h2`
  margin-bottom: 20px;
  color: ${props => props.$darkMode ? '#e0e0e0' : '#333'};
  font-size: 1.8rem;
  text-align: center;
`;

const ScoreDisplay = styled.div`
  text-align: center;
  margin-bottom: 30px;
  
  .score-big {
    font-size: 3rem;
    font-weight: bold;
    color: ${props => {
      const pct = props.$percentage || 0;
      if (pct >= 80) return '#4CAF50';
      if (pct >= 60) return '#FF9800';
      return '#F44336';
    }};
    margin-bottom: 10px;
  }
  
  .score-label {
    font-size: 1.2rem;
    color: ${props => props.$darkMode ? '#b0b0b0' : '#666'};
  }
`;

const FeedbackList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 20px 0;
  
  li {
    padding: 10px 15px;
    margin-bottom: 10px;
    border-radius: 6px;
    background: ${props => props.$darkMode ? '#2a2a2a' : '#f5f5f5'};
    color: ${props => props.$darkMode ? '#e0e0e0' : '#333'};
    font-size: 1rem;
    
    &.correct {
      border-left: 4px solid #4CAF50;
    }
    
    &.incorrect {
      border-left: 4px solid #F44336;
    }
    
    &.warning {
      border-left: 4px solid #FF9800;
    }
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 30px;
`;

const Note = styled.div`
  background: ${props => props.$darkMode ? '#333' : '#e3f2fd'};
  color: ${props => props.$darkMode ? '#90caf9' : '#1976d2'};
  padding: 15px;
  border-radius: 6px;
  margin-top: 20px;
  font-size: 0.95rem;
  text-align: center;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ChartPracticeMode = () => {
  const { darkMode } = useContext(ThemeContext);
  const chartRef = useRef(null);
  const previousAssetRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState('btc');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1day');
  const [activeTool, setActiveTool] = useState('swings');
  const [activePart, setActivePart] = useState(1); // For multi-part tools
  const [drawings, setDrawings] = useState({
    swings: [],
    fibonacci: { part1: [], part2: [] }, // Uptrend/Downtrend
    fvg: { part1: [], part2: [] } // Bullish/Bearish
  });
  const [validationResults, setValidationResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Asset options
  const cryptoAssets = [
    { value: 'btc', label: 'Bitcoin (BTC)', type: 'crypto' },
    { value: 'eth', label: 'Ethereum (ETH)', type: 'crypto' },
    { value: 'sol', label: 'Solana (SOL)', type: 'crypto' },
    { value: 'bnb', label: 'Binance Coin (BNB)', type: 'crypto' }
  ];

  const stockAssets = [
    { value: 'aapl', label: 'Apple (AAPL)', type: 'equity' },
    { value: 'nvda', label: 'NVIDIA (NVDA)', type: 'equity' },
    { value: 'tsla', label: 'Tesla (TSLA)', type: 'equity' },
    { value: 'gld', label: 'Gold ETF (GLD)', type: 'equity' }
  ];

  const commodityAssets = [
    { value: 'gc=f', label: 'Gold Futures (GC=F)', type: 'commodity' },
    { value: 'si=f', label: 'Silver Futures (SI=F)', type: 'commodity' },
    { value: 'cl=f', label: 'Crude Oil WTI (CL=F)', type: 'commodity' },
    { value: 'ng=f', label: 'Natural Gas (NG=F)', type: 'commodity' }
  ];

  const allAssets = [...cryptoAssets, ...stockAssets, ...commodityAssets];

  const timeframeOptions = [
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1day', label: 'Daily' },
    { value: '1week', label: 'Weekly' }
  ];

  // Auto-load chart when asset or timeframe changes
  useEffect(() => {
    if (selectedAsset) {
      // Check if we're changing timeframe only (not asset)
      const isTimeframeChange = previousAssetRef.current === selectedAsset;
      previousAssetRef.current = selectedAsset;
      
      // Preserve validation results and drawings when changing timeframe, clear when changing asset
      fetchChartData(
        isTimeframeChange && validationResults !== null,  // preserve validation
        isTimeframeChange  // preserve drawings on timeframe change
      );
    }
  }, [selectedAsset, selectedTimeframe]);

  // Fetch chart data
  const fetchChartData = async (preserveValidation = false, preserveDrawings = false) => {
    if (!selectedAsset) {
      return;
    }

    setLoading(true);
    
    // Only clear validation results if not preserving them
    if (!preserveValidation) {
      setShowResults(false);
      setValidationResults(null);
    }
    
    // Only clear drawings if not preserving them
    if (!preserveDrawings) {
      setDrawings({ 
        swings: [], 
        fibonacci: { part1: [], part2: [] }, 
        fvg: { part1: [], part2: [] } 
      });
    }

    try {
      const assetInfo = allAssets.find(a => a.value === selectedAsset);
      const response = await fetch('/api/charting-exam/practice-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: selectedAsset,
          assetType: assetInfo.type,
          timeframe: selectedTimeframe
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || 'Failed to fetch chart data');
      }

      setChartData(data.chartData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      alert('Error fetching chart data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle drawing updates
  const handleDrawingUpdate = (tool, newDrawings) => {
    if (tool === 'swings') {
      setDrawings(prev => ({
        ...prev,
        swings: newDrawings
      }));
    } else {
      // For multi-part tools (fibonacci, fvg)
      const partKey = `part${activePart}`;
      setDrawings(prev => ({
        ...prev,
        [tool]: {
          ...prev[tool],
          [partKey]: newDrawings
        }
      }));
    }
  };

  // Validate drawings
  const validateDrawings = async () => {
    if (!chartData) {
      alert('Please wait for chart data to load');
      return;
    }

    // Get drawings based on tool type
    let drawingsToValidate;
    if (activeTool === 'swings') {
      drawingsToValidate = drawings.swings;
    } else {
      // For multi-part tools, combine both parts for validation
      drawingsToValidate = [
        ...drawings[activeTool].part1,
        ...drawings[activeTool].part2
      ];
    }

    if (!drawingsToValidate || drawingsToValidate.length === 0) {
      alert('Please draw on the chart before validating');
      return;
    }

    setLoading(true);
    
    try {
      const endpoint = `/api/charting-exam/practice-validate`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: activeTool,
          drawings: drawingsToValidate,
          chartData,
          timeframe: selectedTimeframe,
          includeMultiPart: activeTool !== 'swings' // Flag for multi-part validation
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || 'Validation failed');
      }

      setValidationResults(data);
      setShowResults(true);
      setShowModal(true);
    } catch (error) {
      console.error('Error validating drawings:', error);
      alert('Error validating: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset current tool
  const resetTool = () => {
    console.log('=== RESET TOOL CALLED ===');
    console.log('Active tool:', activeTool);
    console.log('Chart ref:', chartRef.current);
    
    if (activeTool === 'swings') {
      console.log('Clearing swings...');
      setDrawings(prev => {
        console.log('Previous drawings:', prev);
        return {
          ...prev,
          swings: []
        };
      });
      // Clear all drawings and feedback markers if ref is available
      if (chartRef.current) {
        console.log('Chart ref methods:', Object.keys(chartRef.current || {}));
        if (chartRef.current.clearAll) {
          console.log('Calling clearAll on ref');
          chartRef.current.clearAll();
        } else {
          console.log('clearAll method not found on ref!');
        }
      } else {
        console.log('Chart ref is null!');
      }
    } else {
      const partKey = `part${activePart}`;
      setDrawings(prev => ({
        ...prev,
        [activeTool]: {
          ...prev[activeTool],
          [partKey]: []
        }
      }));
    }
    console.log('Setting showResults to false');
    setShowResults(false);
    console.log('Setting validationResults to null');
    setValidationResults(null);
    setShowModal(false);
  };

  // Close modal and continue practicing
  const closeModal = () => {
    setShowModal(false);
    // Keep results visible on chart
  };

  // Try again - clear everything
  const tryAgain = () => {
    setShowModal(false);
    setShowResults(false);
    setValidationResults(null);
    resetTool();
  };

  // Handle tool change - clear everything
  const handleToolChange = (newTool) => {
    console.log('Switching from', activeTool, 'to', newTool);
    
    // Clear all drawings
    setDrawings({ 
      swings: [], 
      fibonacci: { part1: [], part2: [] }, 
      fvg: { part1: [], part2: [] } 
    });
    
    // Clear validation states
    setShowResults(false);
    setValidationResults(null);
    setShowModal(false);
    
    // Clear chart-specific drawings if ref is available
    if (chartRef.current && chartRef.current.clearAll) {
      chartRef.current.clearAll();
    }
    
    // Set the new tool
    setActiveTool(newTool);
  };

  return (
    <Container>
      <Header>
        <Title $darkMode={darkMode}>Chart Analysis Practice Mode</Title>
      </Header>

      <ControlPanel $darkMode={darkMode}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <Label $darkMode={darkMode} style={{ margin: 0 }}>Select Asset:</Label>
          <Select 
            $darkMode={darkMode}
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            style={{ maxWidth: '300px' }}
          >
            <option value="">Choose an asset...</option>
            <optgroup label="Cryptocurrency">
              {cryptoAssets.map(asset => (
                <option key={asset.value} value={asset.value}>
                  {asset.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Stocks">
              {stockAssets.map(asset => (
                <option key={asset.value} value={asset.value}>
                  {asset.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Commodities">
              {commodityAssets.map(asset => (
                <option key={asset.value} value={asset.value}>
                  {asset.label}
                </option>
              ))}
            </optgroup>
          </Select>
          {selectedAsset && (
            <p style={{
              fontSize: '0.9rem',
              color: '#4CAF50',
              margin: 0
            }}>
              Live data loaded
            </p>
          )}
        </div>
      </ControlPanel>

      {chartData && (
        <>
          <ToolBar $darkMode={darkMode}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
              {/* Tool Selection */}
              <ToolButton
                $active={activeTool === 'swings'}
                $darkMode={darkMode}
                onClick={() => handleToolChange('swings')}
              >
                Swing Points
              </ToolButton>
              <ToolButton
                $active={activeTool === 'fibonacci'}
                $darkMode={darkMode}
                onClick={() => handleToolChange('fibonacci')}
              >
                Fibonacci
              </ToolButton>
              <ToolButton
                $active={activeTool === 'fvg'}
                $darkMode={darkMode}
                onClick={() => handleToolChange('fvg')}
              >
                Fair Value Gaps
              </ToolButton>
              
              {/* Part Selector for multi-part tools */}
              {(activeTool === 'fibonacci' || activeTool === 'fvg') && (
                <div style={{ 
                  marginLeft: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderLeft: `1px solid ${darkMode ? '#404040' : '#ddd'}`,
                  paddingLeft: '20px'
                }}>
                  <Label $darkMode={darkMode} style={{ margin: 0, fontSize: '0.9rem' }}>
                    Part:
                  </Label>
                  <ToolButton
                    $active={activePart === 1}
                    $darkMode={darkMode}
                    onClick={() => setActivePart(1)}
                    style={{ padding: '6px 15px', fontSize: '0.9rem' }}
                  >
                    {activeTool === 'fibonacci' ? 'Uptrend' : 'Bullish'}
                  </ToolButton>
                  <ToolButton
                    $active={activePart === 2}
                    $darkMode={darkMode}
                    onClick={() => setActivePart(2)}
                    style={{ padding: '6px 15px', fontSize: '0.9rem' }}
                  >
                    {activeTool === 'fibonacci' ? 'Downtrend' : 'Bearish'}
                  </ToolButton>
                </div>
              )}
              
              {/* Timeframe Selector */}
              <div style={{ 
                marginLeft: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderLeft: `1px solid ${darkMode ? '#404040' : '#ddd'}`,
                paddingLeft: '20px'
              }}>
                <Label $darkMode={darkMode} style={{ margin: 0, fontSize: '0.9rem' }}>
                  Timeframe:
                </Label>
                <Select
                  $darkMode={darkMode}
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  style={{ minWidth: '100px', padding: '6px 10px' }}
                >
                  {timeframeOptions.map(tf => (
                    <option key={tf.value} value={tf.value}>
                      {tf.label}
                    </option>
                  ))}
                </Select>
              </div>
              
              {/* Action Buttons */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                <Button $darkMode={darkMode} onClick={resetTool}>
                  Clear {activeTool === 'swings' ? 'Swings' : activeTool === 'fibonacci' ? 'Fibonacci' : 'FVG'}
                </Button>
                <Button $primary $darkMode={darkMode} onClick={validateDrawings}>
                  Validate
                </Button>
              </div>
            </div>
          </ToolBar>

          <ChartContainer $darkMode={darkMode}>
            <PracticeChart
              ref={chartRef}
              chartData={chartData}
              activeTool={activeTool}
              activePart={activePart}
              onDrawingUpdate={(drawings) => handleDrawingUpdate(activeTool, drawings)}
              existingDrawings={
                activeTool === 'swings' 
                  ? drawings.swings 
                  : drawings[activeTool][`part${activePart}`]
              }
              validationResults={showResults ? validationResults : null}
              darkMode={darkMode}
              height={500}
            />
          </ChartContainer>

          {/* Modal for results */}
          {showModal && validationResults && (
            <Modal onClick={closeModal}>
              <ModalContent $darkMode={darkMode} onClick={(e) => e.stopPropagation()}>
                <ModalHeader $darkMode={darkMode}>
                  Validation Results
                </ModalHeader>
                
                <ModalActions>
                  <Button $darkMode={darkMode} onClick={() => {
                    setShowModal(false);
                    setShowResults(true);
                  }}>
                    View Results on Chart
                  </Button>
                  <Button $primary $darkMode={darkMode} onClick={tryAgain}>
                    Try Again
                  </Button>
                </ModalActions>
                
                <ScoreDisplay $darkMode={darkMode} $percentage={validationResults.percentage}>
                  <div className="score-big">
                    {validationResults.percentage || 0}%
                  </div>
                  <div className="score-label">
                    {validationResults.score} / {validationResults.totalExpectedPoints} points
                  </div>
                </ScoreDisplay>
                
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <p style={{ fontSize: '1.1rem', color: darkMode ? '#b0b0b0' : '#666' }}>
                    {validationResults.message}
                  </p>
                </div>

                {validationResults.feedback && validationResults.feedback.length > 0 && (
                  <div>
                    <h3 style={{ 
                      marginBottom: '15px', 
                      color: darkMode ? '#e0e0e0' : '#333',
                      fontSize: '1.2rem'
                    }}>
                      Detailed Feedback:
                    </h3>
                    <FeedbackList $darkMode={darkMode}>
                      {validationResults.feedback.map((item, idx) => {
                        const isCorrect = item.includes('✓');
                        const isIncorrect = item.includes('✗');
                        const isWarning = item.includes('⚠');
                        
                        return (
                          <li 
                            key={idx} 
                            className={
                              isCorrect ? 'correct' : 
                              isIncorrect ? 'incorrect' : 
                              isWarning ? 'warning' : ''
                            }
                          >
                            {item}
                          </li>
                        );
                      })}
                    </FeedbackList>
                  </div>
                )}

                {validationResults.correctAnswers && validationResults.correctAnswers.length > 0 && (
                  <Note $darkMode={darkMode}>
                    <strong>Click "View Results on Chart" to see the validation</strong><br />
                    Green/Blue = Correct | Yellow = Missed | Red = Incorrect
                  </Note>
                )}
              </ModalContent>
            </Modal>
          )}
        </>
      )}

      {loading && (
        <LoadingOverlay>
          <div style={{
            background: darkMode ? '#1e1e1e' : 'white',
            padding: '30px',
            borderRadius: '12px',
            textAlign: 'center',
            minWidth: '400px',
            maxWidth: '600px',
            width: '90%',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <CryptoLoader 
              height="250px"
              message="Loading chart data..."
              lightMode={false}
            />
            <p style={{ 
              marginTop: '20px', 
              color: darkMode ? '#e0e0e0' : '#333',
              fontSize: '1.1rem',
              fontWeight: '500'
            }}>
              Preparing practice environment...
            </p>
          </div>
        </LoadingOverlay>
      )}
    </Container>
  );
};

export default ChartPracticeMode;