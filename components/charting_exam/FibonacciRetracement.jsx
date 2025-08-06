import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import ToolPanel from './common/ToolPanel';
import FibonacciSettings from './FibonacciSettings';
import logger from '../../lib/logger';
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
            mode: 1, // Changed from 0 to 1 to enable crosshair
          },
          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: !options.drawingMode,
            horzTouchDrag: !options.drawingMode,
            vertTouchDrag: !options.drawingMode,
          },
          handleScale: {
            axisPressedMouseMove: {
              time: true,
              price: true,
            },
            axisDoubleClickReset: true,
            mouseWheel: true,
            pinch: true,
          },
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
        
        if (options.fibLevels && options.fibLevels.length > 0 && options.startTime && options.endTime) {
          options.fibLevels.forEach(level => {
            const lineSeries = chart.addLineSeries({
              color: level.color,
              lineWidth: level.lineWidth || 1,
              lineStyle: level.lineStyle || 0,
              title: level.title,
            });
            
            let timePoint1 = options.startTime;
            let timePoint2 = options.endTime;
            
            // Skip if time points are not defined
            if (!timePoint1 || !timePoint2) {
              return;
            }
            
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

// Function to get default Fibonacci levels with theme-aware colors
const getDefaultFibonacciLevels = (isDarkMode) => {
  const lineColor = isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
  return [
    { level: 0, label: "0", visible: true, color: lineColor, isKey: false },
    { level: 0.236, label: "0.236", visible: true, color: lineColor, isKey: false },
    { level: 0.382, label: "0.382", visible: true, color: lineColor, isKey: false },
    { level: 0.5, label: "0.5", visible: true, color: '#F0B90B', isKey: true },
    { level: 0.618, label: "0.618", visible: true, color: '#F0B90B', isKey: true },
    { level: 0.65, label: "0.65", visible: false, color: lineColor, isKey: false },
    { level: 0.705, label: "0.705", visible: true, color: '#F0B90B', isKey: true },
    { level: 0.786, label: "0.786", visible: true, color: lineColor, isKey: false },
    { level: 1, label: "1", visible: true, color: lineColor, isKey: false },
    { level: 1.27, label: "1.27", visible: false, color: lineColor, isKey: false },
    { level: 1.414, label: "1.414", visible: false, color: lineColor, isKey: false },
    { level: 1.618, label: "1.618", visible: true, color: lineColor, isKey: false },
    { level: 2, label: "2", visible: false, color: lineColor, isKey: false },
    { level: 2.618, label: "2.618", visible: false, color: lineColor, isKey: false },
    { level: 3.618, label: "3.618", visible: false, color: lineColor, isKey: false },
    { level: 4.236, label: "4.236", visible: false, color: lineColor, isKey: false }
  ];
};

// Styled components
const ChartContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const ChartWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  background-color: ${props => props.$isDarkMode ? '#1e1e1e' : '#ffffff'};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

// Draggable Panel Styles (copied from SwingAnalysis)
const DraggablePanel = styled.div`
  position: absolute;
  width: 280px;
  max-height: 350px;
  background: ${props => props.$isDarkMode ? 'rgba(40, 40, 40, 0.9)' : 'rgba(255, 255, 255, 0.9)'};
  border: 1px solid ${props => props.$isDarkMode ? '#444' : '#ddd'};
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 10;
  overflow-y: auto;
  padding-bottom: 5px;
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};

  @media (max-width: 768px) {
    position: relative;
    width: 100%;
    max-height: none;
    margin-top: 20px;
    margin-bottom: 20px;
    border-radius: 8px;
    left: auto !important;
    top: auto !important;
  }
`;

const PanelHeader = styled.div`
  background: #2196F3;
  color: white;
  padding: 8px;
  text-align: center;
  cursor: move;
  font-weight: bold;

  @media (max-width: 768px) {
    cursor: default;
  }
`;

const PanelContent = styled.div`
  padding: 8px;
`;

const DrawingItem = styled.div`
  margin-bottom: 8px;
  padding: 8px;
  border-bottom: 1px solid ${props => props.$isDarkMode ? '#444' : '#eee'};
  &:last-child {
    border-bottom: none;
  }
  background-color: ${props => props.$isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
  border-radius: 4px;
  
  & > .drawing-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    
    h4 {
      margin: 0;
      color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
      font-size: 0.95rem;
    }
    
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
  
  & > .drawing-details {
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-size: 0.85rem;
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      
      span:first-child {
        color: ${props => props.$isDarkMode ? '#b0b0b0' : '#666'};
      }
      
      span:last-child {
        color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
        font-weight: bold;
      }
    }
  }
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
  pointer-events: none;
  display: ${props => props.$active ? 'block' : 'none'};
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

const FibonacciRetracement = ({ chartData, onDrawingsUpdate, part, chartCount, isDarkMode, isPracticeMode = false, validationResults = null }) => {
  const containerRef = useRef(null);
  const panelRef = useRef(null);
  const [drawings, setDrawings] = useState([]);
  const [drawingMode, setDrawingMode] = useState(isPracticeMode);
  const [startPoint, setStartPoint] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [fibonacciLevels, setFibonacciLevels] = useState(getDefaultFibonacciLevels(isDarkMode));
  const [chartKey, setChartKey] = useState(0);
  const [showClearNotification, setShowClearNotification] = useState(false);
  const [prevPart, setPrevPart] = useState(part);
  const [correctFibs, setCorrectFibs] = useState([]);
  
  // Draggable panel state
  const [panelOffset, setPanelOffset] = useState({ x: 0, y: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  
  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Update Fibonacci levels when theme changes
  useEffect(() => {
    setFibonacciLevels(getDefaultFibonacciLevels(isDarkMode));
  }, [isDarkMode]);
  
  // Set initial panel position
  useEffect(() => {
    if (containerRef.current && panelRef.current && !isMobile) {
      const containerWidth = containerRef.current.clientWidth;
      const panelWidth = panelRef.current.clientWidth;
      setPanelOffset({ x: containerWidth - panelWidth - 10, y: 10 });
    }
  }, [containerRef, panelRef, isMobile]);
  
  useEffect(() => {
    if (prevPart !== part && prevPart !== undefined) {
      clearAllDrawings();
      setStartPoint(null);
      // Keep drawing mode enabled in practice mode when switching parts
      if (!isPracticeMode) {
        setDrawingMode(false);
      }
      setPrevPart(part);
      setShowClearNotification(true);
      setTimeout(() => setShowClearNotification(false), 2000);
      logger.log(`Cleared Part ${prevPart} drawings, now on Part ${part}`);
    }
  }, [part, prevPart, isPracticeMode]);
  
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
    
    // Add user drawings
    drawings.forEach(drawing => {
      if (!drawing.start || !drawing.end || 
          typeof drawing.start.price !== 'number' || 
          typeof drawing.end.price !== 'number') {
        return;
      }
      
      const priceDiff = drawing.start.price - drawing.end.price;
      fibonacciLevels
        .filter(fib => fib.visible)
        .forEach(fib => {
          const level = {
            price: drawing.end.price + priceDiff * fib.level,
            color: fib.color,
            lineWidth: fib.isKey ? 1.5 : 1,
            lineStyle: 0,
            title: `Fib ${fib.label}`
          };
          levels.push(level);
        });
    });
    
    // Add correct answers with different styling
    correctFibs.forEach(drawing => {
      if (!drawing.start || !drawing.end || 
          typeof drawing.start.price !== 'number' || 
          typeof drawing.end.price !== 'number') {
        return;
      }
      
      const priceDiff = drawing.start.price - drawing.end.price;
      fibonacciLevels
        .filter(fib => fib.visible)
        .forEach(fib => {
          const level = {
            price: drawing.end.price + priceDiff * fib.level,
            color: 'rgba(255, 152, 0, 0.8)', // Orange for correct answers
            lineWidth: 2,
            lineStyle: 0,
            title: `Expected ${fib.label}`
          };
          levels.push(level);
        });
    });
    
    return levels;
  }, [drawings, fibonacciLevels, correctFibs]);
  
  const chartOptions = React.useMemo(() => {
    // Combine user drawings with correct answers
    const allDrawings = [...drawings, ...correctFibs];
    
    if (allDrawings.length === 0) {
      return { 
        isDarkMode,
        drawingMode
      };
    }
    
    const latestDrawing = allDrawings[allDrawings.length - 1];
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
  }, [drawings, fibLevels, isDarkMode, drawingMode, correctFibs]);
  
  const chartMarkers = React.useMemo(() => {
    const markers = [];
    
    // User drawings
    drawings.forEach((drawing, index) => {
      if (drawing.start && drawing.start.time) {
        markers.push({
          time: drawing.start.time,
          position: 'belowBar',
          color: '#2196F3',
          shape: 'circle',
          size: 2,
          text: `Start ${index + 1}`
        });
      }
      
      if (drawing.end && drawing.end.time) {
        markers.push({
          time: drawing.end.time,
          position: 'aboveBar',
          color: '#4CAF50',
          shape: 'circle',
          size: 2,
          text: `End ${index + 1}`
        });
      }
    });
    
    // Correct answer markers
    correctFibs.forEach((drawing, index) => {
      if (drawing.start && drawing.start.time) {
        markers.push({
          time: drawing.start.time,
          position: drawing.direction === 'uptrend' ? 'aboveBar' : 'belowBar',
          color: '#FF9800',
          shape: 'circle',
          size: 3,
          text: `Expected Start`
        });
      }
      
      if (drawing.end && drawing.end.time) {
        markers.push({
          time: drawing.end.time,
          position: drawing.direction === 'uptrend' ? 'belowBar' : 'aboveBar',
          color: '#FF9800',
          shape: 'circle',
          size: 3,
          text: `Expected End`
        });
      }
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
  }, [drawings, correctFibs]);
  
  useEffect(() => {
    if (onDrawingsUpdate) {
      onDrawingsUpdate(drawings);
    }
  }, [drawings]); // Removed onDrawingsUpdate to prevent infinite loop

  // Process validation results to show correct answers
  useEffect(() => {
    if (validationResults && validationResults.correctAnswers) {
      // Filter correct answers to only show the one matching current part
      const currentDirection = part === 1 ? 'uptrend' : 'downtrend';
      const correctDrawings = validationResults.correctAnswers
        .filter(answer => answer.direction === currentDirection)
        .map(answer => ({
          start: {
            time: answer.startTime,
            price: answer.startPrice
          },
          end: {
            time: answer.endTime,
            price: answer.endPrice
          },
          direction: answer.direction,
          isCorrect: true
        }));
      setCorrectFibs(correctDrawings);
    } else {
      setCorrectFibs([]);
    }
  }, [validationResults, part]);
  
  // Enhanced dragging logic with proper event handling
  const startPanelDragging = (e) => {
    // Only allow dragging from the panel header
    if (!e.target.className.includes('panel-header') || isMobile) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Record initial positions
    const rect = panelRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // Add global event listeners for smooth dragging
    document.addEventListener('mousemove', handlePanelDrag);
    document.addEventListener('mouseup', stopPanelDragging);
    document.addEventListener('keydown', handleDragEscape);
    
    // Visual feedback
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    
    setIsDragging(true);
  };

  const handlePanelDrag = (e) => {
    if (!isDragging || !containerRef.current || !panelRef.current) return;
    
    e.preventDefault();
    
    // Calculate new position
    const container = containerRef.current;
    const panel = panelRef.current;
    const containerRect = container.getBoundingClientRect();
    
    let newX = e.clientX - containerRect.left - dragOffset.x;
    let newY = e.clientY - containerRect.top - dragOffset.y;
    
    // Boundary constraints with padding
    const padding = 10;
    const maxX = container.offsetWidth - panel.offsetWidth - padding;
    const maxY = container.offsetHeight - panel.offsetHeight - padding;
    
    newX = Math.max(padding, Math.min(newX, maxX));
    newY = Math.max(padding, Math.min(newY, maxY));
    
    setPanelOffset({ x: newX, y: newY });
  };

  const stopPanelDragging = () => {
    if (!isDragging) return;
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handlePanelDrag);
    document.removeEventListener('mouseup', stopPanelDragging);
    document.removeEventListener('keydown', handleDragEscape);
    
    // Reset visual feedback
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    setIsDragging(false);
  };

  const handleDragEscape = (e) => {
    if (e.key === 'Escape') {
      stopPanelDragging();
    }
  };
  
  const handlePointClick = (point) => {
    console.log('Fibonacci click:', { point, drawingMode, startPoint });
    if (!drawingMode) {
      console.log('Drawing mode is false, ignoring click');
      return;
    }
    
    if (!startPoint) {
      const enhancedPoint = enhancePointSelection(point, chartData, part, false);
      console.log('Setting start point:', enhancedPoint);
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
      
      console.log('Creating new drawing:', newDrawing);
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
    // Clear correct fibs in practice mode
    if (isPracticeMode) {
      setCorrectFibs([]);
    }
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

  const removeDrawing = (index) => {
    const newDrawings = [...drawings];
    newDrawings.splice(index, 1);
    setDrawings(newDrawings);
  };

  const toolsConfig = [
    {
      id: 'draw-fibonacci',
      label: drawingMode ? 'Stop Drawing' : 'Draw Fibonacci',
      active: drawingMode
    }
  ];

  const actionsConfig = [
    {
      id: 'undo',
      label: 'Undo',
      onClick: undoLastDrawing,
      disabled: drawings.length === 0 && !startPoint
    },
    {
      id: 'clear-all',
      label: 'Clear All',
      onClick: clearAllDrawings,
      disabled: drawings.length === 0 && !startPoint
    },
    {
      id: 'customize-levels',
      label: showSettings ? 'Hide Settings' : 'Customize Levels',
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
      
      <div style={{ position: 'relative' }}>
        <ChartWrapper $isDarkMode={isDarkMode}>
          <ChartContainer ref={containerRef}>
            {containerRef.current && (
              <Chart 
                key={chartKey}
                container={containerRef} 
                chartData={formattedChartData} 
                options={{
                  isDarkMode,
                  drawingMode,
                  markers: chartMarkers,
                  isPracticeMode,
                  ...chartOptions
                }}
                onClick={handlePointClick}
              />
            )}
          </ChartContainer>
        </ChartWrapper>
        
        <DraggablePanel
          ref={panelRef}
          style={isMobile ? {} : { left: `${panelOffset.x}px`, top: `${panelOffset.y}px` }}
          onMouseDown={startPanelDragging}
          $isDarkMode={isDarkMode}
        >
          <PanelHeader className="panel-header">Fibonacci Retracements</PanelHeader>
          <PanelContent>
            {drawings.length === 0 ? (
              <div style={{ color: isDarkMode ? '#b0b0b0' : '#666', fontSize: '0.9rem' }}>
                <p>Drawing {part === 1 ? 'Uptrend' : 'Downtrend'} Fibonacci</p>
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
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span style={{ display: 'inline-block', background: '#2196F3', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                    Total: {drawings.length}
                  </span>
                  <span style={{ display: 'inline-block', background: part === 1 ? '#4CAF50' : '#F44336', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                    {part === 1 ? 'Uptrend' : 'Downtrend'}
                  </span>
                </div>
                {[...drawings]
                  .sort((a, b) => a.start.time - b.start.time)
                  .map((drawing, index) => (
                    <DrawingItem key={index} $isDarkMode={isDarkMode}>
                      <div className="drawing-header">
                        <h4>{drawing.direction === 'uptrend' ? 'Uptrend' : 'Downtrend'} #{index + 1}</h4>
                        <button onClick={() => removeDrawing(index)}>×</button>
                      </div>
                      <div className="drawing-details">
                        <div className="detail-row">
                          <span>Start:</span>
                          <span>{drawing.start.price.toFixed(2)}</span>
                        </div>
                        <div className="detail-row">
                          <span>End:</span>
                          <span>{drawing.end.price.toFixed(2)}</span>
                        </div>
                        <div className="detail-row">
                          <span>Range:</span>
                          <span>{Math.abs(drawing.start.price - drawing.end.price).toFixed(2)}</span>
                        </div>
                        <div className="detail-row">
                          <span>Date:</span>
                          <span>{formatDate(drawing.start.time)}</span>
                        </div>
                      </div>
                    </DrawingItem>
                  ))}
              </>
            )}
          </PanelContent>
        </DraggablePanel>
      </div>
      
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
    </div>
  );
};

export default FibonacciRetracement;