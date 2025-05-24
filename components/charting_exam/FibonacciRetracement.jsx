import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import ToolPanel from './common/ToolPanel';
import FibonacciSettings from './FibonacciSettings';

// Dynamically import chart component to avoid SSR issues
const Chart = dynamic(
  () => import('lightweight-charts').then(mod => {
    const { createChart } = mod;
    return ({ container, chartData, options, onClick }) => {
      const chartRef = useRef(null);
      
      useEffect(() => {
        if (!container.current) return;
        
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
            mode: 0,
          },
          handleScroll: !options.drawingMode,
          handleScale: !options.drawingMode,
        });
        
        if (options.drawingMode) {
          chart.priceScale('right').applyOptions({
            autoScale: false
          });
        }
        
        const candlestick = chart.addCandlestickSeries({
          upColor: '#4CAF50',
          downColor: '#F44336',
          borderVisible: false,
          wickUpColor: '#4CAF50',
          wickDownColor: '#F44336',
        });
        
        candlestick.setData(chartData);
        
        if (options.fibLevels && options.fibLevels.length > 0) {
          options.fibLevels.forEach(level => {
            const lineSeries = chart.addLineSeries({
              color: level.color,
              lineWidth: level.lineWidth || 1,
              lineStyle: level.lineStyle || 0,
              title: level.title,
            });
            
            let timePoint1 = options.startTime;
            let timePoint2 = options.endTime;
            
            if (Math.abs(timePoint1 - timePoint2) < 60) {
              if (timePoint1 < timePoint2) {
                timePoint2 = timePoint1 + 60;
              } else {
                timePoint1 = timePoint2 + 60;
              }
            }
            
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
        
        if (options.markers && options.markers.length > 0) {
          const sortedMarkers = [...options.markers].sort((a, b) => a.time - b.time);
          
          for (let i = 1; i < sortedMarkers.length; i++) {
            if (sortedMarkers[i].time <= sortedMarkers[i-1].time) {
              sortedMarkers[i].time = sortedMarkers[i-1].time + 60;
            }
          }
          
          candlestick.setMarkers(sortedMarkers);
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

const ClearNotification = styled.div`
  position: absolute;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.$isDarkMode ? '#333' : '#fff'};
  color: ${props => props.$isDarkMode ? '#fff' : '#333'};
  padding: 10px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  z-index: 1000;
  animation: fadeInOut 2s ease-in-out;
  
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    20% { opacity: 1; transform: translateX(-50%) translateY(0); }
    80% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
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
  
  const exactCandle = chartData.find(c => 
    c && (c.time === point.time || 
    (c.date && Math.floor(new Date(c.date).getTime() / 1000) === point.time))
  );
  
  if (!exactCandle) return point;
  
  const clickedPrice = point.price;
  let adjustedPrice = clickedPrice;
  
  if (clickedPrice > exactCandle.high) {
    adjustedPrice = exactCandle.high;
  } else if (clickedPrice < exactCandle.low) {
    adjustedPrice = exactCandle.low;
  }
  
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
  const [fibonacciLevels, setFibonacciLevels] = useState(DEFAULT_FIBONACCI_LEVELS);
  const [chartKey, setChartKey] = useState(0);
  const [showClearNotification, setShowClearNotification] = useState(false);
  const [prevPart, setPrevPart] = useState(part);
  
  useEffect(() => {
    if (prevPart !== part && prevPart !== undefined) {
      clearAllDrawings();
      setStartPoint(null);
      setDrawingMode(false);
      setPrevPart(part);
      setShowClearNotification(true);
      setTimeout(() => setShowClearNotification(false), 2000);
      console.log(`Cleared Part ${prevPart} drawings, now on Part ${part}`);
    }
  }, [part, prevPart]);
  
  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [drawingMode, fibonacciLevels]);
  
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
  
  const fibLevels = React.useMemo(() => {
    const levels = [];
    
    drawings.forEach(drawing => {
      const priceDiff = drawing.start.price - drawing.end.price;
      fibonacciLevels
        .filter(fib => fib.visible)
        .forEach(fib => {
          const level = {
            price: drawing.end.price + priceDiff * fib.level,
            color: fib.color || 'rgba(255, 255, 255, 0.5)',
            lineWidth: fib.isKey ? 1.5 : 1,
            lineStyle: 0,
            title: `Fib ${fib.label}`
          };
          levels.push(level);
        });
    });
    
    return levels;
  }, [drawings, fibonacciLevels]);
  
  const chartOptions = React.useMemo(() => {
    if (drawings.length === 0) {
      return { 
        isDarkMode,
        drawingMode
      };
    }
    
    const latestDrawing = drawings[drawings.length - 1];
    let startTime = latestDrawing.start.time;
    let endTime = latestDrawing.end.time;
    
    if (Math.abs(startTime - endTime) < 60) {
      if (startTime < endTime) {
        endTime = startTime + 60;
      } else {
        startTime = endTime + 60;
      }
    }
    
    return {
      isDarkMode,
      drawingMode,
      fibLevels,
      startTime: startTime,
      endTime: endTime
    };
  }, [drawings, fibLevels, isDarkMode, drawingMode]);
  
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
    
    const processedMarkers = [];
    const seen = new Set();
    
    markers.forEach(marker => {
      if (!seen.has(marker.time)) {
        seen.add(marker.time);
        processedMarkers.push(marker);
      } else {
        marker.time += 60;
        seen.add(marker.time);
        processedMarkers.push(marker);
      }
    });
    
    return processedMarkers.sort((a, b) => a.time - b.time);
  }, [drawings]);
  
  useEffect(() => {
    if (onDrawingsUpdate) {
      onDrawingsUpdate(drawings);
    }
  }, [drawings, onDrawingsUpdate]);
  
  const handlePointClick = (point) => {
    if (!drawingMode) return;
    
    if (!startPoint) {
      const enhancedPoint = enhancePointSelection(point, chartData, part, false);
      setStartPoint({
        time: enhancedPoint.time,
        price: enhancedPoint.price
      });
    } else {
      const enhancedPoint = enhancePointSelection(point, chartData, part, true);
      let endTime = enhancedPoint.time;
      
      if (Math.abs(endTime - startPoint.time) < 60) {
        endTime = startPoint.time + 60;
      }
      
      const newDrawing = {
        start: startPoint,
        end: {
          time: endTime,
          price: enhancedPoint.price
        },
        direction: part === 1 ? 'uptrend' : 'downtrend'
      };
      
      setDrawings([...drawings, newDrawing]);
      setStartPoint(null);
    }
  };
  
  const toggleDrawingMode = () => {
    setDrawingMode(!drawingMode);
    if (drawingMode) {
      setStartPoint(null);
    }
  };
  
  const undoLastDrawing = () => {
    if (drawings.length > 0) {
      const newDrawings = [...drawings];
      newDrawings.pop();
      setDrawings(newDrawings);
    }
    if (startPoint) {
      setStartPoint(null);
    }
  };
  
  const clearAllDrawings = () => {
    setDrawings([]);
    setStartPoint(null);
  };
  
  const toggleSettings = () => {
    setShowSettings(prev => !prev);
  };
  
  const formatDate = (time) => {
    if (!time) return "N/A";
    try {
      const date = new Date(time * 1000);
      return date.toLocaleDateString();
    } catch (err) {
      return "Invalid Date";
    }
  };

  const handleFibLevelsChange = (newLevels) => {
    setFibonacciLevels(newLevels);
    if (drawings.length > 0) {
      setChartKey(prevKey => prevKey + 1);
    }
  };

  const toolsConfig = [
    {
      id: 'draw-fibonacci',
      label: drawingMode ? 'Stop Drawing' : 'Draw Fibonacci',
      icon: 'fa-ruler',
      active: drawingMode
    }
  ];

  const actionsConfig = [
    {
      id: 'undo',
      label: 'Undo',
      icon: 'fa-undo',
      onClick: undoLastDrawing,
      disabled: drawings.length === 0 && !startPoint
    },
    {
      id: 'clear-all',
      label: 'Clear All',
      icon: 'fa-trash-alt',
      onClick: clearAllDrawings,
      disabled: drawings.length === 0 && !startPoint
    },
    {
      id: 'customize-levels',
      label: showSettings ? 'Hide Settings' : 'Customize Levels',
      icon: 'fa-cog',
      onClick: toggleSettings
    }
  ];

  const handleToolSelect = (toolId) => {
    if (toolId === 'draw-fibonacci') {
      toggleDrawingMode();
    }
  };

  return (
    <div>
      {showClearNotification && (
        <ClearNotification $isDarkMode={isDarkMode}>
          Previous drawings cleared for Part {part}
        </ClearNotification>
      )}
      
      <ToolPanel
        title={part === 1 ? "Uptrend Fibonacci Retracement" : "Downtrend Fibonacci Retracement"}
        description={part === 1
          ? "Draw Fibonacci retracement from a swing high to a swing low in an uptrend."
          : "Draw Fibonacci retracement from a swing low to a swing high in a downtrend."}
        selectedTool={drawingMode ? 'draw-fibonacci' : null}
        onToolSelect={handleToolSelect}
        tools={toolsConfig}
        actions={actionsConfig}
        isDarkMode={isDarkMode}
      />
      
      {showSettings && (
        <div style={{ margin: '15px 0' }}>
          <FibonacciSettings 
            isDarkMode={isDarkMode}
            levels={fibonacciLevels}
            onLevelsChange={handleFibLevelsChange}
          />
        </div>
      )}
      
      <ChartContainer>
        <ChartWrapper ref={containerRef}>
          {containerRef.current && (
            <Chart 
              key={chartKey}
              container={containerRef} 
              chartData={formattedChartData} 
              options={{
                isDarkMode,
                drawingMode,
                markers: chartMarkers,
                ...chartOptions
              }}
              onClick={handlePointClick}
            />
          )}
          
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
      
      <FibonacciInfoGrid>
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
              <div key={index} style={{ padding: '8px', marginBottom: '10px', backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: isDarkMode ? '#e0e0e0' : '#333', fontSize: '0.95rem' }}>
                  {drawing.direction === 'uptrend' ? 'Uptrend' : 'Downtrend'} #{index + 1}
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.85rem' }}>
                  <span style={{ color: isDarkMode ? '#b0b0b0' : '#666' }}>Start:</span>
                  <span style={{ color: isDarkMode ? '#e0e0e0' : '#333', fontWeight: 'bold' }}>{drawing.start.price.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.85rem' }}>
                  <span style={{ color: isDarkMode ? '#b0b0b0' : '#666' }}>End:</span>
                  <span style={{ color: isDarkMode ? '#e0e0e0' : '#333', fontWeight: 'bold' }}>{drawing.end.price.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.85rem' }}>
                  <span style={{ color: isDarkMode ? '#b0b0b0' : '#666' }}>Date Range:</span>
                  <span style={{ color: isDarkMode ? '#e0e0e0' : '#333', fontWeight: 'bold' }}>{formatDate(drawing.start.time)} - {formatDate(drawing.end.time)}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button
                    style={{ background: 'none', border: 'none', color: isDarkMode ? '#e0e0e0' : '#555', cursor: 'pointer', fontSize: '1rem' }}
                    onClick={() => {
                      const newDrawings = [...drawings];
                      newDrawings.splice(index, 1);
                      setDrawings(newDrawings);
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = isDarkMode ? '#fff' : '#000'}
                    onMouseOut={(e) => e.currentTarget.style.color = isDarkMode ? '#e0e0e0' : '#555'}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </FibPanel>
        
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