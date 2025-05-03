import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

// Dynamically import chart component to avoid SSR issues
const Chart = dynamic(
  () => import('lightweight-charts').then(mod => {
    const { createChart } = mod;
    return ({ container, chartData, options, onClick }) => {
      const chartRef = useRef(null);
      const tooltipRef = useRef(null);
      
      useEffect(() => {
        if (!container.current) return;
        
        // Create tooltip element if it doesn't exist
        if (!tooltipRef.current) {
          tooltipRef.current = document.createElement('div');
          tooltipRef.current.className = 'marker-tooltip';
          tooltipRef.current.style.position = 'absolute';
          tooltipRef.current.style.display = 'none';
          document.body.appendChild(tooltipRef.current);
        }
        
        // Create chart instance
        const chart = createChart(container.current, {
          width: container.current.clientWidth,
          height: 500,
          layout: {
            background: { color: options.isDarkMode ? '#1e1e1e' : '#ffffff' },
            textColor: options.isDarkMode ? '#d1d4dc' : '#333333',
          },
          grid: {
            vertLines: { color: options.isDarkMode ? '#2e2e2e' : '#f0f0f0' },
            horzLines: { color: options.isDarkMode ? '#2e2e2e' : '#f0f0f0' },
          },
          timeScale: {
            borderColor: options.isDarkMode ? '#555' : '#ddd',
            timeVisible: true,
          },
          crosshair: {
            mode: 0, // CrosshairMode.Normal
          },
        });
        
        // Add candlestick series
        const candlestick = chart.addCandlestickSeries({
          upColor: '#4CAF50',
          downColor: '#F44336',
          borderVisible: false,
          wickUpColor: '#4CAF50',
          wickDownColor: '#F44336',
        });
        
        // Set the data
        candlestick.setData(chartData);
        
        // Enhanced marker rendering with better tooltips
        if (options.markers && options.markers.length > 0) {
          // Custom marker rendering
          const markers = options.markers.map(marker => {
            // Determine marker style based on type
            const isMissed = marker.text && marker.text.includes('Missed');
            const isIncorrect = marker.text && marker.text.includes('Incorrect');
            
            return {
              ...marker,
              size: isMissed ? 3 : isIncorrect ? 4 : 2,
              // Make sure missed points stand out more
              color: isMissed 
                ? '#FFDF00' // Brighter yellow for missed
                : isIncorrect 
                  ? '#FF4444' // Brighter red for incorrect
                  : marker.color,
              // Add border to incorrect and missed points
              borderColor: isMissed || isIncorrect ? '#FFFFFF' : undefined,
              borderWidth: isMissed || isIncorrect ? 1 : 0
            };
          });
          
          candlestick.setMarkers(markers);
          
          // Add marker tooltip functionality
          chart.subscribeCrosshairMove(param => {
            if (!param.point || !param.time) {
              // Hide tooltip when not hovering a point
              if (tooltipRef.current) {
                tooltipRef.current.style.display = 'none';
              }
              return;
            }
            
            // Find if we're hovering near a marker
            const nearbyMarkers = markers.filter(marker => {
              return Math.abs(marker.time - param.time) < 0.5; // Approximate time match
            });
            
            if (nearbyMarkers.length > 0) {
              // Find closest marker by analyzing price
              const price = candlestick.coordinateToPrice(param.point.y);
              const closestMarker = nearbyMarkers.reduce((closest, marker) => {
                // Estimate marker price position based on position property
                const markerPrice = marker.price || 
                  (marker.position === 'aboveBar' 
                    ? price * 1.01  // Slightly above
                    : marker.position === 'belowBar' 
                      ? price * 0.99  // Slightly below
                      : price);  // In bar
                
                const currentDistance = Math.abs(price - markerPrice);
                const closestDistance = Math.abs(price - (closest?.price || Infinity));
                
                return currentDistance < closestDistance ? marker : closest;
              }, null);
              
              if (closestMarker && Math.abs(param.point.y - param.seriesPrices.get(candlestick)) < 50) {
                // Show tooltip
                const tooltipContent = `
                  <div style="
                    padding: 8px;
                    background: ${options.isDarkMode ? 'rgba(33, 33, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
                    color: ${options.isDarkMode ? '#e0e0e0' : '#333'};
                    border-radius: 4px;
                    font-size: 12px;
                    max-width: 200px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                    border-left: 3px solid ${
                      closestMarker.text?.includes('Missed') 
                        ? '#FFD700' 
                        : closestMarker.text?.includes('Incorrect')
                          ? '#FF4444'
                          : closestMarker.color
                    };
                  ">
                    <div style="font-weight: bold; margin-bottom: 5px;">
                      ${closestMarker.text || 'Point'}
                    </div>
                    <div>
                      Price: ${closestMarker.price?.toFixed(2) || 'N/A'}
                    </div>
                    ${closestMarker.advice ? 
                      `<div style="margin-top: 5px; font-style: italic;">
                        ${closestMarker.advice}
                      </div>` 
                      : ''
                    }
                  </div>
                `;
                
                // Position tooltip near the point
                const tooltipWidth = 200;
                const tooltipHeight = 100;
                const chartRect = chart.chartElement().getBoundingClientRect();
                
                tooltipRef.current.innerHTML = tooltipContent;
                tooltipRef.current.style.display = 'block';
                tooltipRef.current.style.left = `${Math.min(
                  chartRect.left + param.point.x + 10,
                  chartRect.right - tooltipWidth - 10
                )}px`;
                tooltipRef.current.style.top = `${Math.min(
                  chartRect.top + param.point.y - tooltipHeight - 10,
                  chartRect.bottom - tooltipHeight - 10
                )}px`;
              } else {
                // Hide tooltip
                if (tooltipRef.current) {
                  tooltipRef.current.style.display = 'none';
                }
              }
            } else {
              // Hide tooltip
              if (tooltipRef.current) {
                tooltipRef.current.style.display = 'none';
              }
            }
          });
        }
        
        // Set click handler
        chart.subscribeClick(param => {
          if (onClick && param.time) {
            // Convert coordinate to price
            const price = candlestick.coordinateToPrice(param.point.y);
            onClick({ time: param.time, price });
          }
        });
        
        // Store chart reference
        chartRef.current = chart;
        
        // Fit content
        chart.timeScale().fitContent();
        
        // Clean up on unmount
        return () => {
          chart.remove();
          if (tooltipRef.current) {
            document.body.removeChild(tooltipRef.current);
            tooltipRef.current = null;
          }
        };
      }, [container, chartData, options, onClick]);
      
      return null;
    };
  }),
  { ssr: false }
);

// Styled components with $-prefixed props
const MarkerTooltip = styled.div`
  position: absolute;
  background-color: ${props => props.$isDarkMode ? 'rgba(33, 33, 33, 0.9)' : 'rgba(255, 255, 255, 0.9)'};
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 100;
  pointer-events: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  max-width: 200px;
  border: 1px solid ${props => props.$type === 'correct' 
    ? '#4CAF50' 
    : props.$type === 'incorrect' 
      ? '#F44336' 
      : '#FFD700'};
  opacity: 0;
  transition: opacity 0.2s;
  
  &.visible {
    opacity: 1;
  }
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 500px;
  position: relative;
`;

const ToolBar = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: ${props => props.$active 
    ? (props.$isDarkMode ? '#3f51b5' : '#2196F3') 
    : (props.$isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
  };
  color: ${props => props.$active 
    ? 'white' 
    : (props.$isDarkMode ? '#e0e0e0' : '#333')
  };
  border: none;
  border-radius: 4px;
  font-weight: ${props => props.$active ? 'bold' : 'normal'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$active 
      ? (props.$isDarkMode ? '#3f51b5' : '#2196F3') 
      : (props.$isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)')
    };
  }
`;

const DangerButton = styled(Button)`
  background-color: ${props => props.$isDarkMode ? '#d32f2f' : '#ffcdd2'};
  color: ${props => props.$isDarkMode ? 'white' : '#d32f2f'};
  
  &:hover {
    background-color: ${props => props.$isDarkMode ? '#b71c1c' : '#ffb3b3'};
  }
`;

const MarkerPanel = styled.div`
  position: absolute;
  right: 20px;
  top: 20px;
  background-color: ${props => props.$isDarkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
  border-radius: 8px;
  padding: 15px;
  width: 220px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 10;
`;

const MarkerItem = styled.div`
  padding: 8px;
  margin-bottom: 8px;
  background-color: ${props => props.$isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  & > span {
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.8rem;
    font-weight: bold;
    color: white;
    background-color: ${props => props.$type === 'high' ? '#4CAF50' : '#2196F3'};
  }
  
  & > button {
    background: none;
    border: none;
    color: ${props => props.$isDarkMode ? '#e0e0e0' : '#555'};
    cursor: pointer;
    font-size: 1rem;
    
    &:hover {
      color: ${props => props.$isDarkMode ? '#fff' : '#000'};
    }
  }
`;

// Add the FeedbackSummary styled component
const FeedbackSummary = styled.div`
  background-color: ${props => props.$isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  
  h3 {
    margin-top: 0;
    margin-bottom: 10px;
    color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
    font-size: 1.1rem;
  }
  
  .stat-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  
  .score {
    display: inline-block;
    font-weight: bold;
    color: ${props => props.$score >= 70 
      ? '#4CAF50' 
      : props.$score >= 40 
        ? '#FF9800' 
        : '#F44336'};
  }
  
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 15px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
  }
  
  .color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 5px;
  }
`;

const SwingAnalysis = ({ chartData, onDrawingsUpdate, chartCount, isDarkMode, validationResults }) => {
    const containerRef = useRef(null);
    const [drawings, setDrawings] = useState([]);
    const [markingMode, setMarkingMode] = useState(false);
    const [showNoSwingsButton, setShowNoSwingsButton] = useState(false);
    const [feedbackMarkers, setFeedbackMarkers] = useState([]);
     
    // Enhanced chart data preparation with better error handling and validation
    const formattedChartData = React.useMemo(() => {
      if (!chartData || !Array.isArray(chartData)) {
        console.warn('Invalid chart data provided to SwingAnalysis component');
        return [];
      }
      
      try {
        // Filter out any invalid data points and ensure time is properly formatted
        return chartData
          .filter(candle => {
            // Skip any null or undefined items
            if (!candle) return false;
            
            // Check that all required properties exist
            return (
              (typeof candle.time === 'number' || typeof candle.date === 'string') &&
              typeof candle.open === 'number' &&
              typeof candle.high === 'number' &&
              typeof candle.low === 'number' &&
              typeof candle.close === 'number' &&
              !isNaN(candle.open) &&
              !isNaN(candle.high) &&
              !isNaN(candle.low) &&
              !isNaN(candle.close)
            );
          })
          .map(candle => {
            // Convert date string to timestamp if time isn't available
            let timeValue;
            if (typeof candle.time === 'number' && !isNaN(candle.time)) {
              timeValue = candle.time;
            } else if (candle.date) {
              try {
                timeValue = Math.floor(new Date(candle.date).getTime() / 1000);
              } catch (e) {
                console.error('Invalid date format:', candle.date);
                // Use a fallback timestamp (30 days ago + random offset)
                timeValue = Math.floor(Date.now() / 1000) - (86400 * 30) + Math.floor(Math.random() * 86400);
              }
            } else {
              // Last resort fallback
              timeValue = Math.floor(Date.now() / 1000) - (86400 * 30) + Math.floor(Math.random() * 86400);
            }
            
            return {
              time: timeValue,
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close
            };
          })
          .sort((a, b) => a.time - b.time); // Ensure data is sorted by time
      } catch (err) {
        console.error('Error formatting chart data:', err);
        return [];
      }
    }, [chartData]);
    
    // Create markers from drawings - FIXED: sort by time
    const chartMarkers = React.useMemo(() => {
      if (!drawings) return feedbackMarkers;
      
      // Handle the special "no swing points" case
      if (drawings.length === 1 && drawings[0].no_swings_found) {
        return feedbackMarkers;
      }
      
      const userMarkers = drawings.map(point => ({
        time: point.time,
        position: point.type === 'high' ? 'aboveBar' : 'belowBar',
        color: point.type === 'high' ? '#4CAF50' : '#2196F3', // Green for highs, blue for lows
        shape: 'circle',
        size: 2,
        text: point.type === 'high' ? 'HIGH' : 'LOW'
      }));
      
      // Combine user markers with feedback markers, with feedback on top
      return [...userMarkers, ...feedbackMarkers].sort((a, b) => a.time - b.time);
    }, [drawings, feedbackMarkers]);
    
    // Add effect to process validation results when received
    useEffect(() => {
      // Check if a parent component passed down validation results
      if (validationResults && validationResults.feedback) {
        processFeedbackMarkers(validationResults.feedback);
      }
    }, [validationResults]);
    
    // Enhanced processFeedbackMarkers function
    const processFeedbackMarkers = (feedback) => {
      const markers = [];
      
      // Add markers for missed points (in yellow)
      if (feedback.incorrect) {
        feedback.incorrect
          .filter(item => item.type === 'missed_point')
          .forEach(point => {
            markers.push({
              time: point.time,
              position: point.pointType === 'high' ? 'aboveBar' : 'belowBar',
              color: '#FFD700', // Yellow color for missed points
              shape: 'circle',
              size: 3,
              text: `Missed ${point.pointType?.toUpperCase() || 'Point'}`,
              advice: point.advice || 'You missed this significant swing point',
              price: point.price,
              type: 'missed'
            });
          });
      }
      
      // Add markers for incorrect points (in red)
      if (feedback.incorrect) {
        feedback.incorrect
          .filter(item => item.type !== 'missed_point')
          .forEach(point => {
            markers.push({
              time: point.time,
              position: 'inBar', // Position in the middle to make it stand out
              color: '#FF0000', // Red color for incorrect points
              shape: 'square',
              size: 3,
              text: 'Incorrect Point',
              advice: point.advice || 'This is not a significant swing point',
              price: point.price,
              type: 'incorrect'
            });
          });
      }
      
      // Add markers for correct points (for visual reinforcement)
      if (feedback.correct) {
        feedback.correct.forEach(point => {
          markers.push({
            time: point.time,
            position: point.type === 'high' ? 'aboveBar' : 'belowBar',
            color: point.type === 'high' ? '#4CAF50' : '#2196F3', // Keep same colors as user marks
            shape: 'diamond', // Different shape to distinguish from user marks
            size: 3,
            text: `Correct ${point.type?.toUpperCase() || 'Point'}`,
            advice: point.advice || 'Correctly identified swing point',
            price: point.price,
            type: 'correct'
          });
        });
      }
      
      setFeedbackMarkers(markers);
    };
    
    // Update parent component when drawings change
    useEffect(() => {
      if (onDrawingsUpdate) {
        onDrawingsUpdate(drawings);
      }
      
      // Show "No Swing Points" button after user has been marking for a while
      // but hasn't found any points yet
      setShowNoSwingsButton(markingMode && drawings.length === 0);
    }, [drawings, onDrawingsUpdate, markingMode]);
    
    // Enhanced point clicking logic with better validation
    const handlePointClick = (point) => {
      if (!markingMode) return;
      
      // Find the nearest candle
      const candle = chartData.find(c => 
        c.time === point.time || 
        Math.floor(new Date(c.date).getTime() / 1000) === point.time
      );
      
      if (!candle) {
        console.warn('No candle found at clicked time point:', point.time);
        return;
      }
      
      // Improved determination of high/low points
      // Use both price and position relative to candle to determine point type
      const mid = (candle.high + candle.low) / 2;
      let pointType = point.price >= mid ? 'high' : 'low';
      
      // If price is very close to high or low, use that specifically
      const highThreshold = candle.high - (candle.high - candle.low) * 0.1;
      const lowThreshold = candle.low + (candle.high - candle.low) * 0.1;
      
      if (point.price >= highThreshold) {
        pointType = 'high';
      } else if (point.price <= lowThreshold) {
        pointType = 'low';
      }
      
      // Use exact high/low value for precision
      const pointPrice = pointType === 'high' ? candle.high : candle.low;
      
      // Check for duplicates with more tolerance
      const isDuplicate = drawings.some(d => 
        Math.abs(d.time - point.time) < 86400 && // Within 1 day
        d.type === pointType &&
        Math.abs(d.price - pointPrice) / pointPrice < 0.005 // Within 0.5%
      );
      
      if (!isDuplicate) {
        // Add the new point
        setDrawings([...drawings, {
          time: point.time,
          price: pointPrice,
          type: pointType
        }]);
      } else {
        console.log('Duplicate point detected, ignoring');
      }
    };
    
    // Toggle marking mode
    const toggleMarkingMode = () => {
      setMarkingMode(!markingMode);
    };
    
    // Undo last marker
    const undoLastMarker = () => {
      if (drawings.length > 0) {
        // If we have the "no swings found" special entry, clear it completely
        if (drawings.length === 1 && drawings[0].no_swings_found) {
          setDrawings([]);
        } else {
          setDrawings(drawings.slice(0, -1));
        }
      }
    };
    
    // Clear all markers
    const clearAllMarkers = () => {
      setDrawings([]);
    };
    
    // Remove specific marker
    const removeMarker = (index) => {
      const newDrawings = [...drawings];
      newDrawings.splice(index, 1);
      setDrawings(newDrawings);
    };
    
    // Add special "No Swing Points" flag
    const markNoSwingPoints = () => {
      setDrawings([{ no_swings_found: true, type: 'none' }]);
    };
    
    // Format date for display
    const formatDate = (timestamp) => {
      if (!timestamp) return '';
      const date = new Date(timestamp * 1000);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    };
    
    return (
      <div>
        <ToolBar>
          <Button 
            onClick={toggleMarkingMode} 
            $active={markingMode}
            $isDarkMode={isDarkMode}
          >
            {markingMode ? 'Stop Marking' : 'Mark Swing Points'}
          </Button>
          <Button 
            onClick={undoLastMarker} 
            $isDarkMode={isDarkMode}
            disabled={drawings.length === 0}
          >
            Undo
          </Button>
          <DangerButton 
            onClick={clearAllMarkers} 
            $isDarkMode={isDarkMode}
            disabled={drawings.length === 0}
          >
            Clear All
          </DangerButton>
          
          {showNoSwingsButton && (
            <Button
              onClick={markNoSwingPoints}
              $isDarkMode={isDarkMode}
              style={{ marginLeft: 'auto' }}
            >
              No Swing Points Found
            </Button>
          )}
        </ToolBar>
        
        {/* Instructions */}
        <div style={{ 
          backgroundColor: isDarkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)',
          padding: '10px 15px',
          borderRadius: '8px',
          marginBottom: '15px',
          borderLeft: '3px solid #2196F3',
          display: markingMode ? 'block' : 'none'
        }}>
          <p style={{ margin: 0, color: isDarkMode ? '#90caf9' : '#1976d2' }}>
            <strong>Instructions:</strong> Click near the high or low points of candles to mark significant swing points. 
            Mark all major swing highs and lows where price changes direction.
          </p>
        </div>
        
        <ChartWrapper ref={containerRef}>
          {containerRef.current && formattedChartData.length > 0 ? (
            <Chart 
              container={containerRef} 
              chartData={formattedChartData} 
              options={{
                isDarkMode,
                markers: chartMarkers
              }}
              onClick={handlePointClick}
            />
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              backgroundColor: isDarkMode ? '#1e1e1e' : '#f8f9fa',
              color: isDarkMode ? '#b0b0b0' : '#666',
              borderRadius: '8px'
            }}>
              {formattedChartData.length === 0 ? 
                'No valid chart data available' : 
                'Chart container not initialized'}
            </div>
          )}
          
          <MarkerPanel $isDarkMode={isDarkMode}>
            <h3 style={{ 
              marginTop: 0, 
              fontSize: '1rem', 
              marginBottom: '10px',
              color: isDarkMode ? '#e0e0e0' : '#333'
            }}>
              Swing Points
            </h3>
            
            {drawings.length === 0 ? (
              <p style={{ color: isDarkMode ? '#b0b0b0' : '#666', fontSize: '0.9rem' }}>
                No swing points marked yet.
              </p>
            ) : drawings.length === 1 && drawings[0].no_swings_found ? (
              <p style={{ color: isDarkMode ? '#b0b0b0' : '#666', fontSize: '0.9rem' }}>
                You have marked this chart as having no significant swing points.
              </p>
            ) : (
              <>
                {/* Add count by type for better user feedback */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '15px'
                }}>
                  <span style={{ 
                    display: 'inline-block', 
                    background: '#4CAF50', 
                    color: 'white', 
                    padding: '3px 8px', 
                    borderRadius: '12px', 
                    fontSize: '0.8rem'
                  }}>
                    Highs: {drawings.filter(d => d.type === 'high').length}
                  </span>
                  <span style={{ 
                    display: 'inline-block', 
                    background: '#2196F3', 
                    color: 'white', 
                    padding: '3px 8px', 
                    borderRadius: '12px', 
                    fontSize: '0.8rem'
                  }}>
                    Lows: {drawings.filter(d => d.type === 'low').length}
                  </span>
                </div>
                
                {/* Render point list, sorted by time */}
                {[...drawings]
                  .sort((a, b) => a.time - b.time)
                  .map((point, index) => (
                  <MarkerItem key={index} $type={point.type} $isDarkMode={isDarkMode}>
                    <span>{point.type?.toUpperCase()}</span>
                    <div style={{ 
                      color: isDarkMode ? '#b0b0b0' : '#666',
                      fontSize: '0.9rem',
                      marginRight: 'auto',
                      marginLeft: '10px'
                    }}>
                      {formatDate(point.time)}
                    </div>
                    <div style={{ color: isDarkMode ? '#b0b0b0' : '#666' }}>
                      {point.price.toFixed(2)}
                    </div>
                    <button onClick={() => removeMarker(index)}>×</button>
                  </MarkerItem>
                ))}
              </>
            )}
          </MarkerPanel>
        </ChartWrapper>
        
        {/* Add Feedback Summary panel when validation results are available */}
        {validationResults && (
          <FeedbackSummary 
            $isDarkMode={isDarkMode} 
            $score={validationResults.matchPercentage || 0}
          >
            <h3>Analysis Feedback</h3>
            
            <div className="stat-row">
              <span>Overall Score:</span>
              <span className="score">
                {validationResults.score || 0}/{validationResults.totalExpectedPoints || 0} points 
                ({validationResults.matchPercentage || 0}%)
              </span>
            </div>
            
            {validationResults.highs !== undefined && (
              <div className="stat-row">
                <span>Swing Highs:</span>
                <span className="score" style={{ 
                  color: validationResults.highs >= 70 
                    ? '#4CAF50' 
                    : validationResults.highs >= 40 
                      ? '#FF9800' 
                      : '#F44336'
                }}>
                  {validationResults.highs || 0}%
                </span>
              </div>
            )}
            
            {validationResults.lows !== undefined && (
              <div className="stat-row">
                <span>Swing Lows:</span>
                <span className="score" style={{ 
                  color: validationResults.lows >= 70 
                    ? '#4CAF50' 
                    : validationResults.lows >= 40 
                      ? '#FF9800' 
                      : '#F44336'
                }}>
                  {validationResults.lows || 0}%
                </span>
              </div>
            )}
            
            <div className="legend">
              <div className="legend-item">
                <div className="color-dot" style={{ backgroundColor: '#4CAF50' }}></div>
                <span>Correct Highs</span>
              </div>
              <div className="legend-item">
                <div className="color-dot" style={{ backgroundColor: '#2196F3' }}></div>
                <span>Correct Lows</span>
              </div>
              <div className="legend-item">
                <div className="color-dot" style={{ backgroundColor: '#FFDF00' }}></div>
                <span>Missed Points</span>
              </div>
              <div className="legend-item">
                <div className="color-dot" style={{ backgroundColor: '#FF4444' }}></div>
                <span>Incorrect Points</span>
              </div>
            </div>
            
            <p style={{ 
              marginTop: '10px', 
              fontSize: '0.9rem',
              color: isDarkMode ? '#b0b0b0' : '#666' 
            }}>
              Hover over any point on the chart to see detailed feedback.
            </p>
          </FeedbackSummary>
        )}
        
        {/* Add extra explanation about validation */}
        <div style={{ 
          marginTop: '20px',
          backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
          padding: '10px 15px',
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: isDarkMode ? '#b0b0b0' : '#666'
        }}>
          <p><strong>Tip:</strong> Swing points are significant price reversals where a high is higher than surrounding highs, or a low is lower than surrounding lows. Mark these key reversal points to identify market structure.</p>
        </div>
      </div>
    );
  };
  
  export default SwingAnalysis;