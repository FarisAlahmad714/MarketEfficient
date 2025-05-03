import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

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
        
        // Add line series for Fibonacci levels if provided
        if (options.fibLevels && options.fibLevels.length > 0) {
          options.fibLevels.forEach(level => {
            const lineSeries = chart.addLineSeries({
              color: level.color,
              lineWidth: level.lineWidth || 1,
              lineStyle: level.lineStyle || 0, // LineStyle.Solid
              title: level.title,
            });
            
            // Ensure times are in ascending order
            const timePoint1 = options.startTime;
            const timePoint2 = options.endTime;
            
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

// Fibonacci levels
const FIBONACCI_LEVELS = [
  { level: 0, label: "0" },
  { level: 0.236, label: "0.236" },
  { level: 0.382, label: "0.382" },
  { level: 0.5, label: "0.5" },
  { level: 0.618, label: "0.618" },
  { level: 0.786, label: "0.786" },
  { level: 1, label: "1" },
  { level: 1.272, label: "1.272" },
  { level: 1.618, label: "1.618" }
];

// Styled components
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

const FibPanel = styled.div`
  position: absolute;
  right: 20px;
  top: 20px;
  background-color: ${props => props.$isDarkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
  border-radius: 8px;
  padding: 15px;
  width: 250px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 10;
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

const FibGuidelinesWrapper = styled.div`
  margin-top: 20px;
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

// Helper function to generate Fibonacci colors
const getFibColors = (isDarkMode) => {
  return [
    { level: 0, color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' },
    { level: 0.236, color: '#FFEB3B' }, // Yellow
    { level: 0.382, color: '#FFC107' }, // Amber
    { level: 0.5, color: '#FF9800' },   // Orange
    { level: 0.618, color: '#FF5722' }, // Deep Orange
    { level: 0.786, color: '#F44336' }, // Red
    { level: 1, color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' },
    { level: 1.272, color: '#E91E63' }, // Pink
    { level: 1.618, color: '#9C27B0' }  // Purple
  ];
};

/**
 * Get guidelines text based on current part
 * @param {Number} part - Current exam part (1 for uptrend, 2 for downtrend)
 * @returns {String} Guidelines text
 */
function getFibGuidelines(part) {
  if (part === 1) {
    return `For UPTREND Fibonacci Retracement:
1. Find a significant UPTREND (price moving from low to high)
2. Place your START point at a major SWING LOW
3. Place your END point at a major SWING HIGH
4. Key levels to watch: 0.382, 0.5, 0.618`;
  } else {
    return `For DOWNTREND Fibonacci Retracement:
1. Find a significant DOWNTREND (price moving from high to low)
2. Place your START point at a major SWING HIGH
3. Place your END point at a major SWING LOW
4. Key levels to watch: 0.382, 0.5, 0.618`;
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
  // Find the nearest candle
  const candle = chartData.find(c => 
    c.time === point.time || 
    Math.floor(new Date(c.date).getTime() / 1000) === point.time
  );
  
  if (!candle) return point;
  
  // Look at a small window of candles around the clicked point
  const lookbackWindow = 2;
  const surroundingCandles = [];
  
  // Get surrounding candles for better point selection
  chartData.forEach(c => {
    const candleTime = c.time || Math.floor(new Date(c.date).getTime() / 1000);
    const pointTime = point.time;
    
    if (Math.abs(candleTime - pointTime) <= lookbackWindow * 86400) { // Within N days
      surroundingCandles.push(c);
    }
  });
  
  // For uptrend start point (low) or downtrend end point (low)
  if ((part === 1 && !isEndPoint) || (part === 2 && isEndPoint)) {
    // Find the lowest low in surrounding candles
    let lowestLow = candle.low;
    let lowestTime = candle.time || Math.floor(new Date(candle.date).getTime() / 1000);
    
    surroundingCandles.forEach(c => {
      if (c.low < lowestLow) {
        lowestLow = c.low;
        lowestTime = c.time || Math.floor(new Date(c.date).getTime() / 1000);
      }
    });
    
    return {
      time: lowestTime,
      price: lowestLow
    };
  } 
  // For uptrend end point (high) or downtrend start point (high)
  else {
    // Find the highest high in surrounding candles
    let highestHigh = candle.high;
    let highestTime = candle.time || Math.floor(new Date(c.date).getTime() / 1000);
    
    surroundingCandles.forEach(c => {
      if (c.high > highestHigh) {
        highestHigh = c.high;
        highestTime = c.time || Math.floor(new Date(c.date).getTime() / 1000);
      }
    });
    
    return {
      time: highestTime,
      price: highestHigh
    };
  }
}

const FibonacciRetracement = ({ chartData, onDrawingsUpdate, part, chartCount, isDarkMode }) => {
  const containerRef = useRef(null);
  const [drawings, setDrawings] = useState([]);
  const [drawingMode, setDrawingMode] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [fibColors] = useState(getFibColors(isDarkMode));
  
  // Prepare chart data in the format needed by lightweight-charts
  const formattedChartData = React.useMemo(() => {
    if (!chartData) return [];
    
    return chartData.map(candle => ({
      time: candle.time || Math.floor(new Date(candle.date).getTime() / 1000),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close
    }));
  }, [chartData]);
  
  // Generate Fibonacci levels for all drawings
  const fibLevels = React.useMemo(() => {
    const levels = [];
    
    drawings.forEach(drawing => {
      const priceDiff = drawing.end.price - drawing.start.price;
      
      FIBONACCI_LEVELS.forEach(fib => {
        const level = {
          price: drawing.start.price + priceDiff * fib.level,
          color: fibColors.find(c => c.level === fib.level)?.color || '#FFFFFF',
          lineWidth: 1,
          lineStyle: 0, // LineStyle.Solid
          title: `Fib ${fib.label}`
        };
        
        levels.push(level);
      });
    });
    
    return levels;
  }, [drawings, fibColors]);
  
  // Create chart options including Fibonacci levels
  const chartOptions = React.useMemo(() => {
    if (drawings.length === 0) {
      return { isDarkMode };
    }
    
    const latestDrawing = drawings[drawings.length - 1];
    
    return {
      isDarkMode,
      fibLevels,
      startTime: latestDrawing.start.time,
      endTime: latestDrawing.end.time
    };
  }, [drawings, fibLevels, isDarkMode]);
  
  // Create markers from start and end points
  const chartMarkers = React.useMemo(() => {
    const markers = [];
    
    drawings.forEach(drawing => {
      markers.push({
        time: drawing.start.time,
        position: 'belowBar',
        color: '#2196F3',
        shape: 'circle',
        size: 2,
        text: 'Start'
      });
      
      markers.push({
        time: drawing.end.time,
        position: 'aboveBar',
        color: '#4CAF50',
        shape: 'circle',
        size: 2,
        text: 'End'
      });
    });
    
    // Sort markers by time to ensure they're in ascending order
    return markers.sort((a, b) => a.time - b.time);
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
      
      // Create new drawing
      const newDrawing = {
        start: startPoint,
        end: {
          time: enhancedPoint.time,
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
    const date = new Date(time * 1000);
    return date.toLocaleDateString();
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
      
      <ChartWrapper ref={containerRef}>
        {containerRef.current && (
          <Chart 
            container={containerRef} 
            chartData={formattedChartData} 
            options={{
              isDarkMode,
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
              Now click to set the {part === 1 ? 'high' : 'low'} point
            </p>
          ) : (
            <p>
              Click to set the start point ({part === 1 ? 'low' : 'high'})
            </p>
          )}
          
          <div style={{ 
            marginTop: '10px', 
            fontSize: '0.8rem',
            color: isDarkMode ? '#b0b0b0' : '#666'
          }}>
            Tip: Look for significant {part === 1 ? 'low-to-high' : 'high-to-low'} moves
          </div>
        </FibInfoOverlay>
        
        <FibPanel $isDarkMode={isDarkMode}>
          <h3 style={{ 
            marginTop: 0, 
            fontSize: '1rem', 
            marginBottom: '10px',
            color: isDarkMode ? '#e0e0e0' : '#333'
          }}>
            Fibonacci Retracements
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
      </ChartWrapper>
      
      {/* Educational Guidelines */}
      <FibGuidelinesWrapper $isDarkMode={isDarkMode}>
        <h3>Fibonacci Retracement Guidelines</h3>
        <p>{getFibGuidelines(part)}</p>
      </FibGuidelinesWrapper>
    </div>
  );
};

export default FibonacciRetracement;