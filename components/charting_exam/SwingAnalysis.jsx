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
        
        // Set markers if available
        if (options.markers && options.markers.length > 0) {
          // Make sure markers are sorted by time
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

// Styled components with $-prefixed props
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

const SwingAnalysis = ({ chartData, onDrawingsUpdate, chartCount, isDarkMode }) => {
  const containerRef = useRef(null);
  const [drawings, setDrawings] = useState([]);
  const [markingMode, setMarkingMode] = useState(false);
  
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
  
  // Create markers from drawings - FIXED: sort by time
  const chartMarkers = React.useMemo(() => {
    const markers = drawings.map(point => ({
      time: point.time,
      position: point.type === 'high' ? 'aboveBar' : 'belowBar',
      color: point.type === 'high' ? '#4CAF50' : '#2196F3',
      shape: 'circle',
      size: 2
    }));
    
    // Sort markers by time in ascending order
    return markers.sort((a, b) => a.time - b.time);
  }, [drawings]);
  
  // Update parent component when drawings change
  useEffect(() => {
    if (onDrawingsUpdate) {
      onDrawingsUpdate(drawings);
    }
  }, [drawings, onDrawingsUpdate]);
  
  // Handle point click on chart
  const handlePointClick = (point) => {
    if (!markingMode) return;
    
    // Find the nearest candle
    const candle = chartData.find(c => 
      c.time === point.time || 
      Math.floor(new Date(c.date).getTime() / 1000) === point.time
    );
    
    if (!candle) return;
    
    // Determine if it's a high or low point
    const mid = (candle.high + candle.low) / 2;
    const pointType = point.price >= mid ? 'high' : 'low';
    const pointPrice = pointType === 'high' ? candle.high : candle.low;
    
    // Check for duplicates
    const isDuplicate = drawings.some(d => 
      d.time === point.time && d.type === pointType
    );
    
    if (!isDuplicate) {
      // Add the new point
      setDrawings([...drawings, {
        time: point.time,
        price: pointPrice,
        type: pointType
      }]);
    }
  };
  
  // Toggle marking mode
  const toggleMarkingMode = () => {
    setMarkingMode(!markingMode);
  };
  
  // Undo last marker
  const undoLastMarker = () => {
    if (drawings.length > 0) {
      setDrawings(drawings.slice(0, -1));
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
      </ToolBar>
      
      <ChartWrapper ref={containerRef}>
        {containerRef.current && (
          <Chart 
            container={containerRef} 
            chartData={formattedChartData} 
            options={{
              isDarkMode,
              markers: chartMarkers
            }}
            onClick={handlePointClick}
          />
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
          ) : (
            drawings.map((point, index) => (
              <MarkerItem key={index} $type={point.type} $isDarkMode={isDarkMode}>
                <span>{point.type.toUpperCase()}</span>
                <div style={{ color: isDarkMode ? '#b0b0b0' : '#666' }}>
                  {point.price.toFixed(2)}
                </div>
                <button onClick={() => removeMarker(index)}>×</button>
              </MarkerItem>
            ))
          )}
        </MarkerPanel>
      </ChartWrapper>
    </div>
  );
};

export default SwingAnalysis;