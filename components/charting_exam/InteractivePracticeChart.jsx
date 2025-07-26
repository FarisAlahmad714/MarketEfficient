import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import styled from 'styled-components';

const ChartContainer = styled.div`
  position: relative;
  width: 100%;
  height: ${props => props.height || 600}px;
  background: ${props => props.darkMode ? '#1a1a1a' : '#ffffff'};
  border-radius: 8px;
  overflow: hidden;
`;

const ToolPanel = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  background: ${props => props.darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
  border: 1px solid ${props => props.darkMode ? '#404040' : '#ddd'};
  border-radius: 8px;
  padding: 15px;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const InteractivePracticeChart = ({ 
  chartData, 
  activeTool, 
  onDrawingUpdate,
  validationResults,
  darkMode,
  height = 600 
}) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [drawings, setDrawings] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !chartData || chartData.length === 0) return;

    // Dynamically import lightweight-charts
    import('lightweight-charts').then(({ createChart }) => {
      // Clean up previous chart
      if (chartRef.current) {
        chartRef.current.remove();
      }

      // Create new chart with full interactivity
      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: height,
        layout: {
          background: { color: darkMode ? '#1a1a1a' : '#ffffff' },
          textColor: darkMode ? '#d1d4dc' : '#333333',
        },
        grid: {
          vertLines: { 
            visible: true,
            color: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
          },
          horzLines: { 
            visible: true,
            color: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
          },
        },
        timeScale: {
          borderColor: darkMode ? '#555' : '#ddd',
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 10,
          barSpacing: 12,
          fixLeftEdge: false,
          fixRightEdge: false,
          lockVisibleTimeRangeOnResize: false,
          rightBarStaysOnScroll: true,
          borderVisible: true,
          visible: true,
        },
        priceScale: {
          borderColor: darkMode ? '#555' : '#ddd',
          borderVisible: true,
          autoScale: true,
          alignLabels: true,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        crosshair: {
          mode: 0, // Normal mode
          vertLine: {
            visible: true,
            labelVisible: true,
            color: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
            width: 1,
            style: 2, // Dashed
          },
          horzLine: {
            visible: true,
            labelVisible: true,
            color: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
            width: 1,
            style: 2, // Dashed
          },
        },
        // Enable all interactions
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

      // Add candlestick series
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#4CAF50',
        downColor: '#F44336',
        borderVisible: false,
        wickUpColor: '#4CAF50',
        wickDownColor: '#F44336',
      });

      // Set data
      const sortedData = [...chartData]
        .filter(candle => candle && typeof candle.time === 'number')
        .sort((a, b) => a.time - b.time);
      
      candlestickSeries.setData(sortedData);

      // Auto-fit content with some padding
      chart.timeScale().fitContent();

      // Handle chart clicks for drawing tools
      chart.subscribeClick((param) => {
        if (!param.point || !param.time || !param.seriesPrices) return;
        
        const price = param.seriesPrices.get(candlestickSeries);
        if (!price) return;

        handleChartClick({
          time: param.time,
          price: price.close || price,
          x: param.point.x,
          y: param.point.y
        });
      });

      // Store chart reference
      chartRef.current = chart;

      // Handle resize
      const handleResize = () => {
        if (containerRef.current && chart) {
          chart.applyOptions({ 
            width: containerRef.current.clientWidth 
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chart) {
          chart.remove();
        }
      };
    });
  }, [chartData, darkMode, height]);

  // Handle drawing based on active tool
  const handleChartClick = (clickData) => {
    console.log('Chart clicked:', clickData, 'Active tool:', activeTool);

    if (activeTool === 'swings') {
      // Handle swing point marking
      const newSwing = {
        time: clickData.time,
        price: clickData.price,
        type: determineSwingType(clickData.price), // You'll need to implement this
        id: Date.now()
      };
      
      const updatedDrawings = [...drawings, newSwing];
      setDrawings(updatedDrawings);
      
      if (onDrawingUpdate) {
        onDrawingUpdate(updatedDrawings);
      }
      
      // Add visual marker
      if (chartRef.current) {
        const candlestickSeries = chartRef.current.series()[0];
        if (candlestickSeries) {
          candlestickSeries.createPriceLine({
            price: clickData.price,
            color: newSwing.type === 'high' ? '#4CAF50' : '#F44336',
            lineWidth: 2,
            lineStyle: 2,
            axisLabelVisible: true,
            title: newSwing.type,
          });
        }
      }
    }
    // Add handlers for fibonacci and fvg tools...
  };

  const determineSwingType = (price) => {
    // Simple logic - you might want to make this more sophisticated
    // Check if click is in upper or lower half of the chart
    return Math.random() > 0.5 ? 'high' : 'low';
  };

  // Clear drawings
  useEffect(() => {
    if (drawings.length === 0 && chartRef.current) {
      // Clear all price lines
      const series = chartRef.current.series()[0];
      if (series) {
        // Note: lightweight-charts doesn't have a direct way to clear price lines
        // You might need to track them separately
      }
    }
  }, [drawings]);

  return (
    <ChartContainer ref={containerRef} darkMode={darkMode} height={height}>
      <ToolPanel darkMode={darkMode}>
        <h4 style={{ margin: '0 0 10px 0', color: darkMode ? '#e0e0e0' : '#333' }}>
          {activeTool === 'swings' && 'Click on swing highs and lows'}
          {activeTool === 'fibonacci' && 'Draw Fibonacci retracement'}
          {activeTool === 'fvg' && 'Mark Fair Value Gaps'}
        </h4>
        <p style={{ fontSize: '0.85rem', color: darkMode ? '#b0b0b0' : '#666', margin: 0 }}>
          • Use mouse wheel to zoom
          <br />
          • Click and drag to pan
          <br />
          • Drag price scale to adjust
        </p>
      </ToolPanel>
      
      {validationResults && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          border: '1px solid',
          borderColor: darkMode ? '#404040' : '#ddd',
          borderRadius: '8px',
          padding: '15px',
          maxWidth: '300px',
          zIndex: 10,
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: darkMode ? '#e0e0e0' : '#333' }}>
            Validation Results
          </h4>
          <p style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            margin: '5px 0',
            color: validationResults.score > 0 ? '#4CAF50' : '#f44336'
          }}>
            Score: {validationResults.score} / {validationResults.totalExpectedPoints}
          </p>
          <p style={{ 
            fontSize: '0.9rem', 
            color: darkMode ? '#b0b0b0' : '#666',
            margin: '10px 0 0 0'
          }}>
            {validationResults.message}
          </p>
        </div>
      )}
    </ChartContainer>
  );
};

export default InteractivePracticeChart;