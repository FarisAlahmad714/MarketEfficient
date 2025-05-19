import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { FaCog, FaRuler } from 'react-icons/fa';
import FibonacciSettings from './FibonacciSettings'; // New import

// Dynamically import chart component to avoid SSR issues
const Chart = dynamic(
  () => import('lightweight-charts').then(mod => {
    const { createChart } = mod;
    return ({ container, chartData, options, onClick }) => {
      const chartRef = useRef(null);
      
      useEffect(() => {
        if (!container.current) return;
        
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
          // FIX #1: Disable price scale zooming when in drawing mode
          handleScroll: !options.drawingMode,
          handleScale: !options.drawingMode,
        });
        
        // FIX #1: Additional fix to disable price scale in drawing mode
        if (options.drawingMode) {
          chart.priceScale('right').applyOptions({
            autoScale: false
          });
        }
        
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
        
        // Add line series for Fibonacci levels if provided
        if (options.fibLevels && options.fibLevels.length > 0) {
          options.fibLevels.forEach(level => {
            const lineSeries = chart.addLineSeries({
              color: level.color,
              lineWidth: level.lineWidth || 1,
              lineStyle: level.lineStyle || 0, // LineStyle.Solid
              title: level.title,
            });
            
            // FIX #2: Ensure times are in ascending order and have sufficient gap
            let timePoint1 = options.startTime;
            let timePoint2 = options.endTime;
            
            // Ensure times have a minimum gap
            if (Math.abs(timePoint1 - timePoint2) < 60) {
              if (timePoint1 < timePoint2) {
                timePoint2 = timePoint1 + 60;
              } else {
                timePoint1 = timePoint2 + 60;
              }
            }
            
            // Create data points in ascending time order
            const data = timePoint1 <= timePoint2 
              ? [
                  { time: timePoint1, value: level.price },
                  { time: timePoint2, value: level.price }
                ]
              : [
                  { time: timePoint2, value: level.price },
                  { time: timePoint1, value: level.price }
                ];
            
            lineSeries.setData(data);
          });
        }
        
        // Set markers if available
        if (options.markers && options.markers.length > 0) {
          // Sort markers by time in ascending order to prevent errors
          const sortedMarkers = [...options.markers].sort((a, b) => a.time - b.time);
          
          // FIX #2: Ensure no duplicate marker times
          for (let i = 1; i < sortedMarkers.length; i++) {
            if (sortedMarkers[i].time <= sortedMarkers[i-1].time) {
              sortedMarkers[i].time = sortedMarkers[i-1].time + 60; // Add 1 minute gap
            }
          }
          
          candlestick.setMarkers(sortedMarkers);
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
        };
      }, [container, chartData, options, onClick]);
      
      return null;
    };
  }),
  { ssr: false }
);

// Default Fibonacci levels with TradingView-like options
const DEFAULT_FIBONACCI_LEVELS = [
  { level: 0, label: "0", visible: true, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 0.236, label: "0.236", visible: true, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 0.382, label: "0.382", visible: true, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 0.5, label: "0.5", visible: true, color: '#F0B90B', isKey: true },
  { level: 0.618, label: "0.618", visible: true, color: '#F0B90B', isKey: true },
  { level: 0.65, label: "0.65", visible: false, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 0.705, label: "0.705", visible: true, color: '#F0B90B', isKey: true },
  { level: 0.786, label: "0.786", visible: true, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 1, label: "1", visible: true, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 1.27, label: "1.27", visible: false, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 1.414, label: "1.414", visible: false, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 1.618, label: "1.618", visible: true, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 2, label: "2", visible: false, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 2.618, label: "2.618", visible: false, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 3.618, label: "3.618", visible: false, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 4.236, label: "4.236", visible: false, color: 'rgba(255, 255, 255, 0.5)', isKey: false }
];

// Styled components
const ChartContainer = styled.div`
  width: 100%;
  margin-bottom: 20px;
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

// New button for Fibonacci settings
const SettingsButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
`;

// MODIFIED: Moved FibPanel from inside chart to outside
const FibPanel = styled.div`
  margin-top: 20px;
  background-color: ${props => props.$isDarkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
  border-radius: 8px;
  padding: 15px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
`;

const FibInfoOverlay = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: ${props => props.$isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)'};
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  max-width: 250px;
  border-left: 3px solid ${props => props.$direction === 'uptrend' ? '#4CAF50' : '#F44336'};
  font-size: 0.9rem;
  line-height: 1.4;
  z-index: 50;
  display: ${props => props.$active ? 'block' : 'none'};
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  margin-top: 5px;
  margin-bottom: 15px;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.85rem;
  background-color: ${props => props.$active
    ? (props.$isDarkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)')
    : 'transparent'
  };
  color: ${props => props.$active
    ? '#4CAF50'
    : (props.$isDarkMode ? '#b0b0b0' : '#666')
  };
  border: 1px solid ${props => props.$active ? '#4CAF50' : 'transparent'};
`;

const FibItem = styled.div`
  padding: 8px;
  margin-bottom: 10px;
  background-color: ${props => props.$isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
  border-radius: 4px;
  
  h4 {
    margin: 0 0 8px 0;
    color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
    font-size: 0.95rem;
  }
  
  .fib-data {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 0.85rem;
    
    span:first-child {
      color: ${props => props.$isDarkMode ? '#b0b0b0' : '#666'};
    }
    
    span:last-child {
      color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
      font-weight: bold;
    }
  }
  
  .fib-remove {
    text-align: right;
    
    button {
      background: none;
      border: none;
      color: ${props => props.$isDarkMode ? '#e0e0e0' : '#555'};
      cursor: pointer;
      font-size: 1rem;
      
      &:hover {
        color: ${props => props.$isDarkMode ? '#fff' : '#000'};
      }
    }
  }
`;

// ADDED: A grid layout for Fib panel and Guidelines
const FibonacciInfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  margin-top: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FibGuidelinesWrapper = styled.div`
  background-color: ${props => props.$isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
  padding: 15px;
  border-radius: 8px;
  color: ${props => props.$isDarkMode ? '#b0b0b0' : '#666'};
  font-size: 0.9rem;
  
  h3 {
    color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 1rem;
  }
  
  ul {
    margin: 0;
    padding-left: 20px;
  }
  
  li {
    margin-bottom: 5px;
  }
`;

/**
 * Get guidelines text based on current part
 * @param {Number} part - Current exam part (1 for uptrend, 2 for downtrend)
 * @returns {String} Guidelines text
 */
function getFibGuidelines(part) {
  if (part === 1) {
    return `For UPTREND Fibonacci Retracement:
1. Find a significant UPTREND
2. Place your START point at a major SWING HIGH
3. Place your END point at a major SWING LOW
4. Key levels to watch: 0.5, 0.618, 0.705`;
  } else {
    return `For DOWNTREND Fibonacci Retracement:
1. Find a significant DOWNTREND
2. Place your START point at a major SWING LOW
3. Place your END point at a major SWING HIGH
4. Key levels to watch: 0.5, 0.618, 0.705`;
  }
}

/**
 * Enhanced point selection for better accuracy
 * @param {Object} point - Clicked point
 * @param {Array} chartData - Chart data
 * @param {Number} part - Current part
 * @param {Boolean} isEndPoint - Whether this is an end point
 * @returns {Object} Optimized point
 */
function enhancePointSelection(point, chartData, part, isEndPoint = false) {
  if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
    return point;
  }
  
  // Find the exact candle at the clicked time
  const exactCandle = chartData.find(c => 
    c && (c.time === point.time || 
    (c.date && Math.floor(new Date(c.date).getTime() / 1000) === point.time))
  );
  
  if (!exactCandle) return point; // If no candle found at click time, return original point
  
  // PRECISION ENHANCEMENT: Use the clicked point's price, but ensure it's within the candle range
  const clickedPrice = point.price;
  
  // Keep the price within the candle's range for realism
  // (prevents selecting prices where no actual trading occurred)
  let adjustedPrice = clickedPrice;
  
  // Check if clicked outside high/low range, and only then adjust
  if (clickedPrice > exactCandle.high) {
    adjustedPrice = exactCandle.high;
  } else if (clickedPrice < exactCandle.low) {
    adjustedPrice = exactCandle.low;
  }
  
  // Create enhanced point with minimal adjustment
  return {
    time: exactCandle.time || (exactCandle.date && Math.floor(new Date(exactCandle.date).getTime() / 1000)),
    price: adjustedPrice
  };
}

const FibonacciRetracement = ({ chartData, onDrawingsUpdate, part, chartCount, isDarkMode }) => {
  const containerRef = useRef(null);
  const [drawings, setDrawings] = useState([]);
  const [drawingMode, setDrawingMode] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Add state for fibonacci levels with TradingView-like defaults
  const [fibonacciLevels, setFibonacciLevels] = useState(DEFAULT_FIBONACCI_LEVELS);
  
  // Force chart recreation when drawing mode changes or settings update
  const [chartKey, setChartKey] = useState(0);
  
  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [drawingMode, fibonacciLevels]);
  
  // Prepare chart data in the format needed by lightweight-charts
  const formattedChartData = React.useMemo(() => {
    if (!chartData || !Array.isArray(chartData)) return [];
    
    return chartData.map(candle => ({
      time: candle.time || Math.floor(new Date(candle.date || Date.now()).getTime() / 1000),
      open: candle.open || 0,
      high: candle.high || 0,
      low: candle.low || 0,
      close: candle.close || 0
    }));
  }, [chartData]);
  
  // Generate Fibonacci levels for all drawings
  const fibLevels = React.useMemo(() => {
    const levels = [];
    
    drawings.forEach(drawing => {
      // FIXED: Reverse the price difference calculation so that 
      // level 1 is always at the start point and level 0 is at the end point
      const priceDiff = drawing.start.price - drawing.end.price;
      
      // Only use visible fibonacci levels from settings
      fibonacciLevels
        .filter(fib => fib.visible)
        .forEach(fib => {
          const level = {
            // FIXED: Changed formula to ensure level 1 is at start point
            price: drawing.end.price + priceDiff * fib.level,
            color: fib.color || 'rgba(255, 255, 255, 0.5)',
            lineWidth: fib.isKey ? 1.5 : 1, // Make key levels thicker
            lineStyle: 0, // LineStyle.Solid
            title: `Fib ${fib.label}`
          };
          
          levels.push(level);
        });
    });
    
    return levels;
  }, [drawings, fibonacciLevels]);
  
  // Create chart options including Fibonacci levels
  const chartOptions = React.useMemo(() => {
    if (drawings.length === 0) {
      return { 
        isDarkMode,
        drawingMode  // Pass drawing mode to chart
      };
    }
    
    const latestDrawing = drawings[drawings.length - 1];
    
    // FIX #2: Ensure start and end times are different
    let startTime = latestDrawing.start.time;
    let endTime = latestDrawing.end.time;
    
    // Ensure a minimum gap between times
    if (Math.abs(startTime - endTime) < 60) {
      if (startTime < endTime) {
        endTime = startTime + 60;
      } else {
        startTime = endTime + 60;
      }
    }
    
    return {
      isDarkMode,
      drawingMode,  // Pass drawing mode explicitly
      fibLevels,
      startTime: startTime,
      endTime: endTime
    };
  }, [drawings, fibLevels, isDarkMode, drawingMode]);
  
  // Create markers from start and end points
  const chartMarkers = React.useMemo(() => {
    const markers = [];
    
    drawings.forEach((drawing, index) => {
      markers.push({
        time: drawing.start.time,
        position: 'belowBar',
        color: '#2196F3',
        shape: 'circle',
        size: 2,
        text: `Start ${index + 1}`
      });
      
      markers.push({
        time: drawing.end.time,
        position: 'aboveBar',
        color: '#4CAF50',
        shape: 'circle',
        size: 2,
        text: `End ${index + 1}`
      });
    });
    
    // FIX #2: Ensure no duplicate marker times
    const processedMarkers = [];
    const seen = new Set();
    
    // Filter out markers with duplicate times
    markers.forEach(marker => {
      if (!seen.has(marker.time)) {
        seen.add(marker.time);
        processedMarkers.push(marker);
      } else {
        // If duplicate, add a small offset
        marker.time += 60; // Add 1 minute
        seen.add(marker.time);
        processedMarkers.push(marker);
      }
    });
    
    // Sort markers by time to ensure they're in ascending order
    return processedMarkers.sort((a, b) => a.time - b.time);
  }, [drawings]);
  
  // Update parent component when drawings change
  useEffect(() => {
    if (onDrawingsUpdate) {
      onDrawingsUpdate(drawings);
    }
  }, [drawings, onDrawingsUpdate]);
  
  // Enhanced handle point click on chart
  const handlePointClick = (point) => {
    if (!drawingMode) return;
    
    if (!startPoint) {
      // Set enhanced start point
      const enhancedPoint = enhancePointSelection(point, chartData, part, false);
      
      setStartPoint({
        time: enhancedPoint.time,
        price: enhancedPoint.price
      });
    } else {
      // Set enhanced end point and create Fibonacci drawing
      const enhancedPoint = enhancePointSelection(point, chartData, part, true);
      
      // FIX #2: Ensure end point time is different from start point time
      let endTime = enhancedPoint.time;
      
      if (Math.abs(endTime - startPoint.time) < 60) {
        endTime = startPoint.time + 60; // Add 1 minute if too close
      }
      
      // Create new drawing
      const newDrawing = {
        start: startPoint,
        end: {
          time: endTime,
          price: enhancedPoint.price
        },
        direction: part === 1 ? 'uptrend' : 'downtrend'
      };
      
      // Add new drawing
      setDrawings([...drawings, newDrawing]);
      
      // Reset start point
      setStartPoint(null);
    }
  };
  
  // Toggle drawing mode
  const toggleDrawingMode = () => {
    setDrawingMode(!drawingMode);
    if (drawingMode) {
      // If turning off drawing mode, clear start point
      setStartPoint(null);
    }
  };
  
  // Undo last drawing
  const undoLastDrawing = () => {
    if (drawings.length > 0) {
      const newDrawings = [...drawings];
      newDrawings.pop();
      setDrawings(newDrawings);
    }
    // Also clear startPoint if active
    if (startPoint) {
      setStartPoint(null);
    }
  };
  
  // Clear all drawings
  const clearAllDrawings = () => {
    setDrawings([]);
    setStartPoint(null);
  };
  
  // Remove specific drawing
  const removeDrawing = (index) => {
    const newDrawings = [...drawings];
    newDrawings.splice(index, 1);
    setDrawings(newDrawings);
  };
  
  // Format date
  const formatDate = (time) => {
    if (!time) return "N/A";
    try {
      const date = new Date(time * 1000);
      return date.toLocaleDateString();
    } catch (err) {
      return "Invalid Date";
    }
  };

  // Handle Fibonacci levels changes from the settings panel
  const handleFibLevelsChange = (newLevels) => {
    setFibonacciLevels(newLevels);
    // Redraw chart when levels change
    if (drawings.length > 0) {
      setChartKey(prevKey => prevKey + 1);
    }
  };
  
  return (
    <div>
      <ToolBar>
        <Button 
          onClick={toggleDrawingMode} 
          $active={drawingMode}
          $isDarkMode={isDarkMode}
        >
          {drawingMode ? 'Stop Drawing' : 'Draw Fibonacci'}
        </Button>
        <Button 
          onClick={undoLastDrawing} 
          $isDarkMode={isDarkMode}
          disabled={drawings.length === 0 && !startPoint}
        >
          Undo
        </Button>
        <DangerButton 
          onClick={clearAllDrawings} 
          $isDarkMode={isDarkMode}
          disabled={drawings.length === 0 && !startPoint}
        >
          Clear All
        </DangerButton>
        
        {/* NEW: Settings button for customizing Fibonacci levels */}
        <SettingsButton
          onClick={() => setShowSettings(!showSettings)}
          $active={showSettings}
          $isDarkMode={isDarkMode}
        >
          <FaCog /> {showSettings ? 'Hide Settings' : 'Customize Levels'}
        </SettingsButton>
      </ToolBar>
      
      <StatusBadge $active={drawingMode} $isDarkMode={isDarkMode}>
        {drawingMode ? (
          startPoint ? 
            'Now click to set the end point' : 
            'Click on the chart to set the start point'
        ) : (
          'Click "Draw Fibonacci" to begin'
        )}
      </StatusBadge>
      
      {/* NEW: Show settings panel when toggled */}
      {showSettings && (
        <FibonacciSettings 
          isDarkMode={isDarkMode}
          levels={fibonacciLevels}
          onLevelsChange={handleFibLevelsChange}
        />
      )}
      
      <ChartContainer>
        <ChartWrapper ref={containerRef}>
          {containerRef.current && (
            <Chart 
              key={chartKey} // Force recreation when drawing mode changes
              container={containerRef} 
              chartData={formattedChartData} 
              options={{
                isDarkMode,
                drawingMode, // Pass drawing mode explicitly
                markers: chartMarkers,
                ...chartOptions
              }}
              onClick={handlePointClick}
            />
          )}
          
          {/* Info Overlay during drawing */}
          <FibInfoOverlay
            $isDarkMode={isDarkMode}
            $direction={part === 1 ? 'uptrend' : 'downtrend'}
            $active={drawingMode}
          >
            <h4 style={{ marginTop: 0, marginBottom: '10px' }}>
              Drawing {part === 1 ? 'Uptrend' : 'Downtrend'} Fibonacci
            </h4>
            
            {startPoint ? (
              <p>
                Great! Start point set at {startPoint.price.toFixed(2)}<br />
                Now click to set the {part === 1 ? 'low' : 'high'} point
              </p>
            ) : (
              <p>
                Click to set the start point ({part === 1 ? 'high' : 'low'})
              </p>
            )}
            
            <div style={{ 
              marginTop: '10px', 
              fontSize: '0.8rem',
              color: isDarkMode ? '#b0b0b0' : '#666'
            }}>
              Tip: For {part === 1 ? 'uptrend' : 'downtrend'} Fibonacci, draw from {part === 1 ? 'high to low' : 'low to high'}
            </div>
          </FibInfoOverlay>
        </ChartWrapper>
      </ChartContainer>
      
      {/* MOVED: FibPanel and Guidelines to a grid layout outside the chart */}
      <FibonacciInfoGrid>
        {/* Panel with user's Fibonacci drawings */}
        <FibPanel $isDarkMode={isDarkMode}>
          <h3 style={{ 
            marginTop: 0, 
            fontSize: '1rem', 
            marginBottom: '10px',
            color: isDarkMode ? '#e0e0e0' : '#333'
          }}>
            Your Fibonacci Retracements
          </h3>
          
          {drawings.length === 0 ? (
            <p style={{ color: isDarkMode ? '#b0b0b0' : '#666', fontSize: '0.9rem' }}>
              No retracements drawn yet.
            </p>
          ) : (
            drawings.map((drawing, index) => (
              <FibItem key={index} $isDarkMode={isDarkMode}>
                <h4>{drawing.direction === 'uptrend' ? 'Uptrend' : 'Downtrend'} #{index + 1}</h4>
                <div className="fib-data">
                  <span>Start:</span>
                  <span>{drawing.start.price.toFixed(2)}</span>
                </div>
                <div className="fib-data">
                  <span>End:</span>
                  <span>{drawing.end.price.toFixed(2)}</span>
                </div>
                <div className="fib-data">
                  <span>Date Range:</span>
                  <span>{formatDate(drawing.start.time)} - {formatDate(drawing.end.time)}</span>
                </div>
                <div className="fib-remove">
                  <button onClick={() => removeDrawing(index)}>×</button>
                </div>
              </FibItem>
            ))
          )}
        </FibPanel>
        
        {/* Educational Guidelines - Updated with grading information */}
        <FibGuidelinesWrapper $isDarkMode={isDarkMode}>
          <h3>Fibonacci Retracement Guidelines</h3>
          
          <p style={{ 
            marginBottom: '12px',
            lineHeight: '1.5'
          }}>
            For {part === 1 ? 'UPTREND' : 'DOWNTREND'} Fibonacci:
            {part === 1 
              ? ' Find a significant uptrend, place your START at a swing high and END at a swing low.' 
              : ' Find a significant downtrend, place your START at a swing low and END at a swing high.'}
          </p>
          
          <div style={{ 
            marginTop: '15px', 
            padding: '12px', 
            backgroundColor: isDarkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)',
            borderLeft: '3px solid #2196F3',
            borderRadius: '4px'
          }}>
            <h4 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '1rem',
              color: isDarkMode ? '#e0e0e0' : '#333'
            }}>
              Probability Tool, Not Prediction
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
              There are no "right" or "wrong" retracements - Fibonacci is a <strong>probability tool</strong> that 
              helps identify potential entry and reversal zones. The retracement levels help visualize where price 
              might find support or resistance during market movements.
            </p>
          </div>
          
          <div style={{ 
            marginTop: '15px', 
            padding: '12px', 
            backgroundColor: isDarkMode ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.05)',
            borderLeft: '3px solid #FF9800',
            borderRadius: '4px'
          }}>
            <h4 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '1rem',
              color: isDarkMode ? '#e0e0e0' : '#333'
            }}>
              Grading System
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
              The system grades your accuracy in identifying significant swing points. Points are awarded for placing start and end points near major swings, with some tolerance for precision. You can receive partial credit for points that are close to ideal positions. The goal is to identify the most significant market structure, not exact pixel-perfect placement.
            </p>
          </div>
          
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: isDarkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)',
            borderLeft: '3px solid #4CAF50',
            borderRadius: '4px'
          }}>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Remember: In {part === 1 ? 'uptrend' : 'downtrend'} retracements, the level 1.0 is placed at your start point and 0.0 at your end point. Use the "Customize Levels" button to adjust visible levels based on your strategy.
            </p>
          </div>
        </FibGuidelinesWrapper>
      </FibonacciInfoGrid>
    </div>
  );
};

export default FibonacciRetracement;