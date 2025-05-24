import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import ToolPanel from './common/ToolPanel'; // Assuming this is available in your project

// Dynamically import chart component to avoid SSR issues
const Chart = dynamic(
  () => import('lightweight-charts').then(mod => {
    const { createChart } = mod;
    return ({ container, chartData, options, onClick }) => {
      const chartRef = useRef(null);
      const tooltipRef = useRef(null);
      
      useEffect(() => {
        if (!container.current) return;
        
        // Create tooltip element if it doesn’t exist
        if (!tooltipRef.current) {
          tooltipRef.current = document.createElement('div');
          tooltipRef.current.className = 'marker-tooltip';
          tooltipRef.current.style.position = 'absolute';
          tooltipRef.current.style.display = 'none';
          document.body.appendChild(tooltipRef.current);
        }
        
        // Create chart instance with updated styling
        const chart = createChart(container.current, {
          width: container.current.clientWidth,
          height: 600,
          layout: {
            background: { color: options.isDarkMode ? '#1e1e1e' : '#ffffff' },
            textColor: options.isDarkMode ? '#d1d4dc' : '#333333',
          },
          grid: {
            vertLines: { visible: false },
            horzLines: { visible: false },
          },
          timeScale: {
            borderColor: options.isDarkMode ? '#555' : '#ddd',
            timeVisible: true,
            secondsVisible: false,
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
        
        // Ensure chart data is sorted by time
        const sortedChartData = [...chartData]
          .filter(candle => candle && typeof candle.time === 'number')
          .sort((a, b) => a.time - b.time);
        
        candlestick.setData(sortedChartData);
        
        // Enhanced marker rendering with better tooltips
        if (options.markers && options.markers.length > 0) {
          const markers = options.markers
            .filter(marker => marker && typeof marker.time === 'number' && !isNaN(marker.time) && marker.time > 0)
            .map(marker => {
              const isMissed = marker.text && marker.text.includes('Missed');
              const isIncorrect = marker.text && marker.text.includes('Incorrect');
              
              return {
                ...marker,
                time: marker.time,
                size: isMissed ? 3 : isIncorrect ? 4 : 2,
                color: isMissed ? '#FFDF00' : isIncorrect ? '#FF4444' : marker.color,
                borderColor: isMissed || isIncorrect ? '#FFFFFF' : undefined,
                borderWidth: isMissed || isIncorrect ? 1 : 0
              };
            });
          
          markers.sort((a, b) => a.time - b.time);
          if (markers.length > 0) {
            candlestick.setMarkers(markers);
          }
          
          chart.subscribeCrosshairMove(param => {
            if (!param.point || !param.time) {
              if (tooltipRef.current) tooltipRef.current.style.display = 'none';
              return;
            }
            
            const nearbyMarkers = markers.filter(marker => Math.abs(marker.time - param.time) < 0.5);
            
            if (nearbyMarkers.length > 0) {
              const price = candlestick.coordinateToPrice(param.point.y);
              const closestMarker = nearbyMarkers.reduce((closest, marker) => {
                const markerPrice = marker.price || (marker.position === 'aboveBar' ? price * 1.01 : marker.position === 'belowBar' ? price * 0.99 : price);
                const currentDistance = Math.abs(price - markerPrice);
                const closestDistance = Math.abs(price - (closest?.price || Infinity));
                return currentDistance < closestDistance ? marker : closest;
              }, null);
              
              if (closestMarker) {
                let priceValue = candlestick.coordinateToPrice(param.point.y) || param.point.y;
                
                if (Math.abs(param.point.y - priceValue) < 50) {
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
                        closestMarker.text?.includes('Missed') ? '#FFD700' :
                        closestMarker.text?.includes('Incorrect') ? '#FF4444' :
                        closestMarker.color
                      };
                    ">
                      <div style="font-weight: bold; margin-bottom: 5px;">
                        ${closestMarker.text || 'Point'}
                      </div>
                      <div>Price: ${closestMarker.price?.toFixed(2) || 'N/A'}</div>
                      ${closestMarker.advice ? `<div style="margin-top: 5px; font-style: italic;">${closestMarker.advice}</div>` : ''}
                    </div>
                  `;
                  const tooltipWidth = 200;
                  const tooltipHeight = 100;
                  const chartRect = chart.chartElement().getBoundingClientRect();
                
                  tooltipRef.current.innerHTML = tooltipContent;
                  tooltipRef.current.style.display = 'block';
                  tooltipRef.current.style.left = `${Math.min(chartRect.left + param.point.x + 10, chartRect.right - tooltipWidth - 10)}px`;
                  tooltipRef.current.style.top = `${Math.min(chartRect.top + param.point.y - tooltipHeight - 10, chartRect.bottom - tooltipHeight - 10)}px`;
                }
              } else {
                if (tooltipRef.current) tooltipRef.current.style.display = 'none';
              }
            } else {
              if (tooltipRef.current) tooltipRef.current.style.display = 'none';
            }
          });
        }
        
        chart.subscribeClick(param => {
          if (onClick && param.time) {
            const price = candlestick.coordinateToPrice(param.point.y);
            onClick({ time: param.time, price });
          }
        });
        
        chartRef.current = chart;
        chart.timeScale().fitContent();
        
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

// Styled Components
const ChartWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 600px;
  border-radius: 8px;
  overflow: hidden;
  background-color: ${props => props.$isDarkMode ? '#1e1e1e' : '#ffffff'};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const MarkerPanel = styled.div`
  position: absolute;
  width: 250px;
  max-height: 300px;
  background: ${props => props.$isDarkMode ? 'rgba(40, 40, 40, 0.9)' : 'rgba(255, 255, 255, 0.9)'};
  border: 1px solid ${props => props.$isDarkMode ? '#444' : '#ddd'};
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 10;
  overflow-y: auto;
  padding-bottom: 5px;
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
`;

const PanelHeader = styled.div`
  background: #2196F3;
  color: white;
  padding: 8px;
  text-align: center;
  cursor: move;
  font-weight: bold;
`;

const PanelContent = styled.div`
  padding: 8px;
`;

const MarkerItem = styled.div`
  margin-bottom: 8px;
  padding: 6px;
  border-bottom: 1px solid ${props => props.$isDarkMode ? '#444' : '#eee'};
  &:last-child {
    border-bottom: none;
  }
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

const NoSwingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  z-index: 5;
`;

const NoSwingMessage = styled.div`
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
`;

const MarkingModeIndicator = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(33, 150, 243, 0.8);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-weight: bold;
  z-index: 100;
  pointer-events: none;
`;

const FeedbackSummary = styled.div`
  background-color: ${props => props.$isDarkMode ? '#282828' : '#ffffff'};
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
  
  h3 {
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 1.1rem;
  }
  
  .stat-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  
  .score {
    font-weight: bold;
    color: ${props => props.$score >= 70 ? '#4CAF50' : props.$score >= 40 ? '#FF9800' : '#F44336'};
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
  const panelRef = useRef(null);
  const [drawings, setDrawings] = useState([]);
  const [markingMode, setMarkingMode] = useState(null);
  const [panelOffset, setPanelOffset] = useState({ x: 0, y: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ x: 0, y: 0 });
  const [feedbackMarkers, setFeedbackMarkers] = useState([]);

  // Define all functions before toolsConfig to avoid ReferenceError
  const undoLastMarker = () => {
    if (drawings.length > 0) {
      if (drawings.length === 1 && drawings[0].no_swings_found) {
        setDrawings([]);
      } else {
        setDrawings(drawings.slice(0, -1));
      }
    }
  };

  const clearAllMarkers = () => {
    setDrawings([]);
  };

  const markNoSwingPoints = () => {
    setDrawings([{ no_swings_found: true, type: 'none' }]);
  };

  // Set initial panel position
  useEffect(() => {
    if (containerRef.current && panelRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const panelWidth = panelRef.current.clientWidth;
      setPanelOffset({ x: containerWidth - panelWidth - 10, y: 10 });
    }
  }, [containerRef, panelRef]);

  // Format chart data
  const formattedChartData = React.useMemo(() => {
    if (!chartData || !Array.isArray(chartData)) {
      console.warn('Invalid chart data provided to SwingAnalysis component');
      return [];
    }
    
    try {
      return chartData
        .filter(candle => {
          if (!candle) return false;
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
          let timeValue = typeof candle.time === 'number' && !isNaN(candle.time) ? candle.time :
                          candle.date ? Math.floor(new Date(candle.date).getTime() / 1000) :
                          Math.floor(Date.now() / 1000) - (86400 * 30) + Math.floor(Math.random() * 86400);
          return {
            time: timeValue,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close
          };
        })
        .sort((a, b) => a.time - b.time);
    } catch (err) {
      console.error('Error formatting chart data:', err);
      return [];
    }
  }, [chartData]);

  // Create chart markers
  const chartMarkers = React.useMemo(() => {
    if (!drawings) return feedbackMarkers.filter(m => m && typeof m.time === 'number' && !isNaN(m.time));
    
    if (drawings.length === 1 && drawings[0].no_swings_found) {
      return feedbackMarkers.filter(m => m && typeof m.time === 'number' && !isNaN(m.time)).sort((a, b) => a.time - b.time);
    }
    
    const userMarkers = drawings
      .filter(point => point && typeof point.time === 'number' && !isNaN(point.time))
      .map(point => ({
        time: point.time,
        position: point.type === 'high' ? 'aboveBar' : 'belowBar',
        color: point.type === 'high' ? '#4CAF50' : '#2196F3',
        shape: 'circle',
        size: 2,
        text: point.type === 'high' ? 'HIGH' : 'LOW'
      }));
    
    userMarkers.sort((a, b) => a.time - b.time);
    const sortedFeedbackMarkers = feedbackMarkers
      .filter(m => m && typeof m.time === 'number' && !isNaN(m.time))
      .sort((a, b) => a.time - b.time);
    
    return [...userMarkers, ...sortedFeedbackMarkers].sort((a, b) => a.time - b.time);
  }, [drawings, feedbackMarkers]);

  // Process validation results
  useEffect(() => {
    if (validationResults && validationResults.feedback) {
      processFeedbackMarkers(validationResults.feedback);
    }
  }, [validationResults]);

  const processFeedbackMarkers = (feedback) => {
    const markers = [];
    
    if (feedback.incorrect) {
      feedback.incorrect
        .filter(item => item.type === 'missed_point' && item.time && typeof item.time === 'number' && !isNaN(item.time))
        .forEach(point => {
          markers.push({
            time: point.time,
            position: point.pointType === 'high' ? 'aboveBar' : 'belowBar',
            color: '#FFD700',
            shape: 'circle',
            size: 3,
            text: `Missed ${point.pointType?.toUpperCase() || 'Point'}`,
            advice: point.advice || 'You missed this significant swing point',
            price: point.price,
            type: 'missed'
          });
        });
      
      feedback.incorrect
        .filter(item => item.type !== 'missed_point' && item.time && typeof item.time === 'number' && !isNaN(item.time))
        .forEach(point => {
          markers.push({
            time: point.time,
            position: 'inBar',
            color: '#FF0000',
            shape: 'square',
            size: 3,
            text: 'Incorrect Point',
            advice: point.advice || 'This is not a significant swing point',
            price: point.price,
            type: 'incorrect'
          });
        });
    }
    
    if (feedback.correct) {
      feedback.correct
        .filter(point => point.time && typeof point.time === 'number' && !isNaN(point.time))
        .forEach(point => {
          markers.push({
            time: point.time,
            position: point.type === 'high' ? 'aboveBar' : 'belowBar',
            color: point.type === 'high' ? '#4CAF50' : '#2196F3',
            shape: 'diamond',
            size: 3,
            text: `Correct ${point.type?.toUpperCase() || 'Point'}`,
            advice: point.advice || 'Correctly identified swing point',
            price: point.price,
            type: 'correct'
          });
        });
    }
    
    const validMarkers = markers.filter(marker => marker && typeof marker.time === 'number' && !isNaN(marker.time) && marker.time > 0);
    validMarkers.sort((a, b) => a.time - b.time);
    setFeedbackMarkers(validMarkers);
  };

  // Update parent component
  useEffect(() => {
    if (onDrawingsUpdate) onDrawingsUpdate(drawings);
  }, [drawings, onDrawingsUpdate]);

  // Define toolsConfig after functions to ensure they’re available
  const toolsConfig = [
    {
      id: 'mark-swing-points',
      label: 'Mark Swing Points',
      icon: 'fa-mouse-pointer',
      active: markingMode === 'mark-swing-points'
    },
    {
      id: 'undo',
      label: 'Undo',
      icon: 'fa-undo',
      onClick: undoLastMarker,
      disabled: drawings.length === 0
    },
    {
      id: 'clear-all',
      label: 'Clear All',
      icon: 'fa-trash',
      onClick: clearAllMarkers,
      disabled: drawings.length === 0
    },
    {
      id: 'no-swings',
      label: 'No Swing Points Found',
      icon: 'fa-ban',
      onClick: markNoSwingPoints,
      disabled: drawings.length === 1 && drawings[0].no_swings_found
    }
  ];

  // Handle tool selection
  const handleToolSelect = (toolId) => {
    const tool = toolsConfig.find(t => t.id === toolId);
    if (tool.onClick) {
      tool.onClick();
    } else {
      setMarkingMode(markingMode === toolId ? null : toolId);
    }
  };

  // Handle point click
  const handlePointClick = (point) => {
    if (markingMode !== 'mark-swing-points') return;
    
    if (!point || typeof point.time !== 'number' || isNaN(point.time)) {
      console.warn('Invalid point clicked:', point);
      return;
    }
    
    const candle = chartData.find(c => c.time === point.time || (c.date && Math.floor(new Date(c.date).getTime() / 1000) === point.time));
    if (!candle) {
      console.warn('No candle found at clicked time point:', point.time);
      return;
    }
    
    const mid = (candle.high + candle.low) / 2;
    let pointType = point.price >= mid ? 'high' : 'low';
    const highThreshold = candle.high - (candle.high - candle.low) * 0.1;
    const lowThreshold = candle.low + (candle.high - candle.low) * 0.1;
    
    if (point.price >= highThreshold) pointType = 'high';
    else if (point.price <= lowThreshold) pointType = 'low';
    
    const pointPrice = pointType === 'high' ? candle.high : candle.low;
    const isDuplicate = drawings.some(d => 
      Math.abs(d.time - point.time) < 86400 && 
      d.type === pointType && 
      Math.abs(d.price - pointPrice) / pointPrice < 0.005
    );
    
    if (!isDuplicate) {
      const newPoint = { time: point.time, price: pointPrice, type: pointType };
      if (typeof newPoint.time === 'number' && !isNaN(newPoint.time) && newPoint.time > 0) {
        setDrawings([...drawings, newPoint]);
      } else {
        console.warn('Invalid point data, not adding:', newPoint);
      }
    }
  };

  // Dragging logic
  const startPanelDragging = (e) => {
    if (e.target.className.includes('panel-header')) {
      setIsDragging(true);
      setCurrentCoords({
        x: e.clientX - panelOffset.x,
        y: e.clientY - panelOffset.y
      });
    }
  };

  const dragPanel = (e) => {
    if (isDragging && containerRef.current && panelRef.current) {
      e.preventDefault();
      const x = e.clientX - currentCoords.x;
      const y = e.clientY - currentCoords.y;
      const container = containerRef.current;
      const panel = panelRef.current;
      const maxX = container.offsetWidth - panel.offsetWidth;
      const maxY = container.offsetHeight - panel.offsetHeight;
      const newX = Math.max(0, Math.min(x, maxX));
      const newY = Math.max(0, Math.min(y, maxY));
      setPanelOffset({ x: newX, y: newY });
    }
  };

  const stopPanelDragging = () => {
    setIsDragging(false);
  };

  // Utility functions
  const removeMarker = (index) => {
    const newDrawings = [...drawings];
    newDrawings.splice(index, 1);
    setDrawings(newDrawings);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <ToolPanel
        title="Swing Point Analysis"
        description="Mark significant swing highs and lows where price changes direction."
        selectedTool={markingMode}
        onToolSelect={handleToolSelect}
        tools={toolsConfig}
        isDarkMode={isDarkMode}
      />
      
      <ChartWrapper $isDarkMode={isDarkMode} ref={containerRef}>
        {markingMode === 'mark-swing-points' && (
          <MarkingModeIndicator $isDarkMode={isDarkMode}>
            Marking Mode Active
          </MarkingModeIndicator>
        )}
        
        {containerRef.current && formattedChartData.length > 0 ? (
          <Chart 
            container={containerRef} 
            chartData={formattedChartData} 
            options={{ isDarkMode, markers: chartMarkers }}
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
            {formattedChartData.length === 0 ? 'No valid chart data available' : 'Chart container not initialized'}
          </div>
        )}
        
        <MarkerPanel
          ref={panelRef}
          style={{ left: `${panelOffset.x}px`, top: `${panelOffset.y}px` }}
          onMouseDown={startPanelDragging}
          onMouseMove={dragPanel}
          onMouseUp={stopPanelDragging}
          onMouseLeave={stopPanelDragging}
          $isDarkMode={isDarkMode}
        >
          <PanelHeader className="panel-header">Swing Points</PanelHeader>
          <PanelContent>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span style={{ display: 'inline-block', background: '#4CAF50', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                    Highs: {drawings.filter(d => d.type === 'high').length}
                  </span>
                  <span style={{ display: 'inline-block', background: '#2196F3', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                    Lows: {drawings.filter(d => d.type === 'low').length}
                  </span>
                </div>
                {[...drawings]
                  .sort((a, b) => a.time - b.time)
                  .map((point, index) => (
                    <MarkerItem key={index} $type={point.type} $isDarkMode={isDarkMode}>
                      <span>{point.type?.toUpperCase()}</span>
                      <div style={{ color: isDarkMode ? '#b0b0b0' : '#666', fontSize: '0.9rem', marginRight: 'auto', marginLeft: '10px' }}>
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
          </PanelContent>
        </MarkerPanel>
        
        {drawings.length === 1 && drawings[0].no_swings_found && (
          <NoSwingOverlay>
            <NoSwingMessage>No Significant Swing Points Found</NoSwingMessage>
          </NoSwingOverlay>
        )}
      </ChartWrapper>
      
      {validationResults && (
        <FeedbackSummary $isDarkMode={isDarkMode} $score={validationResults.matchPercentage || 0}>
          <h3>Analysis Feedback</h3>
          <div className="stat-row">
            <span>Overall Score:</span>
            <span className="score">
              {validationResults.score || 0}/{validationResults.totalExpectedPoints || 0} points ({validationResults.matchPercentage || 0}%)
            </span>
          </div>
          {validationResults.highs !== undefined && (
            <div className="stat-row">
              <span>Swing Highs:</span>
              <span className="score" style={{ color: validationResults.highs >= 70 ? '#4CAF50' : validationResults.highs >= 40 ? '#FF9800' : '#F44336' }}>
                {validationResults.highs || 0}%
              </span>
            </div>
          )}
          {validationResults.lows !== undefined && (
            <div className="stat-row">
              <span>Swing Lows:</span>
              <span className="score" style={{ color: validationResults.lows >= 70 ? '#4CAF50' : validationResults.lows >= 40 ? '#FF9800' : '#F44336' }}>
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
          <p style={{ marginTop: '10px', fontSize: '0.9rem', color: isDarkMode ? '#b0b0b0' : '#666' }}>
            Hover over any point on the chart to see detailed feedback.
          </p>
        </FeedbackSummary>
      )}
      
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