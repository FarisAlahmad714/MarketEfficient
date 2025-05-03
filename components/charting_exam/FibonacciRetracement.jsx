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
            lineSeries.setData([
              { time: options.startTime, value: level.price },
              { time: options.endTime, value: level.price }
            ]);
          });
        }
        
        // Set markers if available
        if (options.markers && options.markers.length > 0) {
          candlestick.setMarkers(options.markers);
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
  background-color: ${props => props.active 
    ? (props.isDarkMode ? '#3f51b5' : '#2196F3') 
    : (props.isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
  };
  color: ${props => props.active 
    ? 'white' 
    : (props.isDarkMode ? '#e0e0e0' : '#333')
  };
  border: none;
  border-radius: 4px;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active 
      ? (props.isDarkMode ? '#3f51b5' : '#2196F3') 
      : (props.isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)')
    };
  }
`;

const DangerButton = styled(Button)`
  background-color: ${props => props.isDarkMode ? '#d32f2f' : '#ffcdd2'};
  color: ${props => props.isDarkMode ? 'white' : '#d32f2f'};
  
  &:hover {
    background-color: ${props => props.isDarkMode ? '#b71c1c' : '#ffb3b3'};
  }
`;

const FibPanel = styled.div`
  position: absolute;
  right: 20px;
  top: 20px;
  background-color: ${props => props.isDarkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
  border-radius: 8px;
  padding: 15px;
  width: 250px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 10;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  margin-top: 5px;
  margin-bottom: 15px;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.85rem;
  background-color: ${props => props.active
    ? (props.isDarkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)')
    : 'transparent'
  };
  color: ${props => props.active
    ? '#4CAF50'
    : (props.isDarkMode ? '#b0b0b0' : '#666')
  };
  border: 1px solid ${props => props.active ? '#4CAF50' : 'transparent'};
`;

const FibItem = styled.div`
  padding: 8px;
  margin-bottom: 10px;
  background-color: ${props => props.isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
  border-radius: 4px;
  
  h4 {
    margin: 0 0 8px 0;
    color: ${props => props.isDarkMode ? '#e0e0e0' : '#333'};
    font-size: 0.95rem;
  }
  
  .fib-data {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 0.85rem;
    
    span:first-child {
      color: ${props => props.isDarkMode ? '#b0b0b0' : '#666'};
    }
    
    span:last-child {
      color: ${props => props.isDarkMode ? '#e0e0e0' : '#333'};
      font-weight: bold;
    }
  }
  
  .fib-remove {
    text-align: right;
    
    button {
      background: none;
      border: none;
      color: ${props => props.isDarkMode ? '#e0e0e0' : '#555'};
      cursor: pointer;
      font-size: 1rem;
      
      &:hover {
        color: ${props => props.isDarkMode ? '#fff' : '#000'};
      }
    }
  }
`;

// Helper function to generate Fibonacci colors
const getFibColors = (isDarkMode) => {
  return [
    { level: 0, color: '#FFFFFF' },
    { level: 0.236, color: '#FFEB3B' },
    { level: 0.382, color: '#FFC107' },
    { level: 0.5, color: '#FF9800' },
    { level: 0.618, color: '#FF5722' },
    { level: 0.786, color: '#F44336' },
    { level: 1, color: '#FFFFFF' },
    { level: 1.272, color: '#E91E63' },
    { level: 1.618, color: '#9C27B0' }
  ];
};

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
    
    return markers;
  }, [drawings]);
  
  // Update parent component when drawings change
  useEffect(() => {
    if (onDrawingsUpdate) {
      onDrawingsUpdate(drawings);
    }
  }, [drawings, onDrawingsUpdate]);
  
  // Handle point click on chart
  const handlePointClick = (point) => {
    if (!drawingMode) return;
    
    // Find the nearest candle
    const candle = chartData.find(c => 
      c.time === point.time || 
      Math.floor(new Date(c.date).getTime() / 1000) === point.time
    );
    
    if (!candle) return;
    
    if (!startPoint) {
      // Set start point
      setStartPoint({
        time: point.time,
        price: part === 1 ? candle.low : candle.high // For uptrend start at low, downtrend start at high
      });
    } else {
      // Set end point and create Fibonacci drawing
      const endPoint = {
        time: point.time,
        price: part === 1 ? candle.high : candle.low // For uptrend end at high, downtrend end at low
      };
      
      // Create new drawing
      const newDrawing = {
        start: startPoint,
        end: endPoint,
        direction: part === 1