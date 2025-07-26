import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import ToolPanel from './common/ToolPanel';

// Create a practice-specific chart component with better interaction handling
const PracticeChart = dynamic(
  () => import('lightweight-charts').then(mod => {
    const { createChart } = mod;
    return ({ container, chartData, options, onClick, isDrawingMode }) => {
      const chartRef = useRef(null);
      const seriesRef = useRef(null);
      
      useEffect(() => {
        if (!container.current) return;
        
        const chart = createChart(container.current, {
          width: container.current.clientWidth,
          height: 600,
          layout: {
            background: { color: options.isDarkMode ? '#1e1e1e' : '#ffffff' },
            textColor: options.isDarkMode ? '#d1d4dc' : '#333333',
          },
          grid: {
            vertLines: { visible: true, color: options.isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            horzLines: { visible: true, color: options.isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
          },
          timeScale: {
            borderColor: options.isDarkMode ? '#555' : '#ddd',
            timeVisible: true,
            secondsVisible: false,
            rightOffset: 5,
            barSpacing: 12,
          },
          crosshair: {
            mode: 0,
          },
          // Always enable interactions in practice mode
          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: true,
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
        
        const candlestick = chart.addCandlestickSeries({
          upColor: '#4CAF50',
          downColor: '#F44336',
          borderVisible: false,
          wickUpColor: '#4CAF50',
          wickDownColor: '#F44336',
        });
        
        const sortedChartData = [...chartData]
          .filter(candle => candle && typeof candle.time === 'number')
          .sort((a, b) => a.time - b.time);
        
        candlestick.setData(sortedChartData);
        chart.timeScale().fitContent();
        
        // Only handle clicks when in drawing mode
        chart.subscribeClick(param => {
          if (isDrawingMode && onClick && param.time) {
            const price = candlestick.coordinateToPrice(param.point.y);
            onClick({ time: param.time, price });
          }
        });
        
        chartRef.current = chart;
        seriesRef.current = candlestick;
        
        const handleResize = () => {
          if (container.current && chart) {
            chart.applyOptions({ width: container.current.clientWidth });
          }
        };
        
        window.addEventListener('resize', handleResize);
        
        return () => {
          window.removeEventListener('resize', handleResize);
          chart.remove();
        };
      }, [container, chartData, options, onClick, isDrawingMode]);
      
      // Update markers
      useEffect(() => {
        if (!seriesRef.current || !options.markers) return;
        seriesRef.current.setMarkers(options.markers);
      }, [options.markers]);
      
      return null;
    };
  }),
  { ssr: false }
);

const Container = styled.div`
  display: flex;
  gap: 20px;
  height: 600px;
  position: relative;
`;

const ChartContainer = styled.div`
  flex: 1;
  position: relative;
  background: ${props => props.isDarkMode ? '#1a1a1a' : '#fff'};
  border-radius: 8px;
  overflow: hidden;
`;

const MarkersList = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: ${props => props.isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
  border: 1px solid ${props => props.isDarkMode ? '#404040' : '#ddd'};
  border-radius: 8px;
  padding: 15px;
  max-width: 300px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const DrawingModeIndicator = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.active ? '#4CAF50' : '#666'};
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  z-index: 10;
  transition: all 0.3s ease;
`;

const PracticeSwingAnalysis = ({ chartData, onDrawingsUpdate, isDarkMode, validationResults }) => {
  const containerRef = useRef(null);
  const [drawings, setDrawings] = useState([]);
  const [markingMode, setMarkingMode] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Handle point clicks
  const handlePointClick = ({ time, price }) => {
    if (!markingMode || markingMode === 'no-swings') return;
    
    const newPoint = {
      time,
      price,
      type: markingMode === 'swing-high' ? 'high' : 'low',
      timestamp: Date.now()
    };
    
    const newDrawings = [...drawings, newPoint];
    setDrawings(newDrawings);
  };

  // Update parent component
  useEffect(() => {
    if (onDrawingsUpdate) onDrawingsUpdate(drawings);
  }, [drawings, onDrawingsUpdate]);

  // Tool configuration
  const toolsConfig = [
    {
      id: 'navigation',
      label: 'Navigate Chart',
      icon: 'fa-arrows',
      onClick: () => {
        setIsDrawingMode(false);
        setMarkingMode(null);
      },
      isToggle: true,
      active: !isDrawingMode
    },
    {
      id: 'swing-high',
      label: 'Mark Swing High',
      icon: 'fa-arrow-up',
      onClick: () => {
        setIsDrawingMode(true);
        setMarkingMode('swing-high');
      },
      isToggle: true,
      active: markingMode === 'swing-high'
    },
    {
      id: 'swing-low',
      label: 'Mark Swing Low',
      icon: 'fa-arrow-down',
      onClick: () => {
        setIsDrawingMode(true);
        setMarkingMode('swing-low');
      },
      isToggle: true,
      active: markingMode === 'swing-low'
    },
    {
      id: 'clear-all',
      label: 'Clear All',
      icon: 'fa-trash',
      onClick: () => setDrawings([]),
      disabled: drawings.length === 0
    }
  ];

  const handleToolSelect = (toolId) => {
    const tool = toolsConfig.find(t => t.id === toolId);
    if (tool.onClick) tool.onClick();
  };

  // Create chart markers
  const chartMarkers = drawings.map(point => ({
    time: point.time,
    position: point.type === 'high' ? 'aboveBar' : 'belowBar',
    color: point.type === 'high' ? '#4CAF50' : '#F44336',
    shape: point.type === 'high' ? 'arrowDown' : 'arrowUp',
    text: point.type === 'high' ? 'H' : 'L'
  }));

  // Add validation results as markers
  if (validationResults && validationResults.correctAnswers) {
    validationResults.correctAnswers.forEach(answer => {
      chartMarkers.push({
        time: answer.time,
        position: answer.type === 'high' ? 'aboveBar' : 'belowBar',
        color: '#2196F3',
        shape: 'circle',
        text: '✓'
      });
    });
  }

  return (
    <Container>
      <ToolPanel
        tools={toolsConfig}
        onToolSelect={handleToolSelect}
        isDarkMode={isDarkMode}
        title="Swing Analysis Tools"
      />
      
      <ChartContainer ref={containerRef} isDarkMode={isDarkMode}>
        <DrawingModeIndicator active={isDrawingMode}>
          {isDrawingMode ? `Drawing Mode: ${markingMode?.replace('-', ' ').toUpperCase() || 'Select Tool'}` : 'Navigation Mode'}
        </DrawingModeIndicator>
        
        {chartData && chartData.length > 0 && (
          <PracticeChart 
            container={containerRef} 
            chartData={chartData} 
            options={{ isDarkMode, markers: chartMarkers }}
            onClick={handlePointClick}
            isDrawingMode={isDrawingMode}
          />
        )}
        
        {drawings.length > 0 && (
          <MarkersList isDarkMode={isDarkMode}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>Marked Points ({drawings.length})</h4>
            {drawings.slice(-5).reverse().map((point, idx) => (
              <div key={idx} style={{ 
                fontSize: '0.8rem', 
                padding: '4px 0',
                color: isDarkMode ? '#b0b0b0' : '#666'
              }}>
                {point.type === 'high' ? '▲' : '▼'} {point.price.toFixed(2)}
              </div>
            ))}
          </MarkersList>
        )}
      </ChartContainer>
    </Container>
  );
};

export default PracticeSwingAnalysis;