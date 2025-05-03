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
        
        // Create price lines for FVGs if provided
        if (options.fvgRectangles && options.fvgRectangles.length > 0) {
          options.fvgRectangles.forEach(fvg => {
            // Create top line
            const topLine = candlestick.createPriceLine({
              price: fvg.topPrice,
              color: fvg.color,
              lineWidth: 1,
              lineStyle: 0, // LineStyle.Solid
              title: `${fvg.type} FVG Top`,
              axisLabelVisible: true,
            });
            
            // Create bottom line
            const bottomLine = candlestick.createPriceLine({
              price: fvg.bottomPrice,
              color: fvg.color,
              lineWidth: 1,
              lineStyle: 0, // LineStyle.Solid
              title: `${fvg.type} FVG Bottom`,
              axisLabelVisible: true,
            });
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

const FVGPanel = styled.div`
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

const FVGItem = styled.div`
  padding: 8px;
  margin-bottom: 10px;
  background-color: ${props => props.isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
  border-radius: 4px;
  
  h4 {
    margin: 0 0 8px 0;
    color: ${props => props.isDarkMode ? '#e0e0e0' : '#333'};
    font-size: 0.95rem;
  }
  
  .fvg-data {
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
  
  .fvg-remove {
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

const FairValueGaps = ({ chartData, onDrawingsUpdate, part, chartCount, isDarkMode }) => {
  const containerRef = useRef(null);
  const [drawings, setDrawings] = useState([]);
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawingType, setDrawingType] = useState('rectangle'); // 'rectangle' or 'hline'
  const [startPoint, setStartPoint] = useState(null);
  const [noFVGsFound, setNoFVGsFound] = useState(false);
  
  // Colors based on FVG type (bullish/bearish)
  const fvgColors = {
    bullish: 'rgba(76, 175, 80, 0.3)', // Green with transparency
    bearish: 'rgba(244, 67, 54, 0.3)'   // Red with transparency
  };
  
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
  
  // Create chart options including FVG rectangles
  const chartOptions = React.useMemo(() => {
    if (noFVGsFound || drawings.length === 0) {
      return { isDarkMode };
    }
    
    // Create FVG rectangle definitions
    const fvgRectangles = drawings.map(fvg => ({
      startTime: fvg.startTime,
      endTime: fvg.endTime,
      topPrice: fvg.topPrice,
      bottomPrice: fvg.bottomPrice,
      type: fvg.type,
      color: fvg.type === 'bullish' ? fvgColors.bullish : fvgColors.bearish
    }));
    
    return {
      isDarkMode,
      fvgRectangles
    };
  }, [drawings, noFVGsFound, isDarkMode, fvgColors]);
  
  // Create markers for FVG start and end points
  const chartMarkers = React.useMemo(() => {
    const markers = [];
    
    if (noFVGsFound) return markers;
    
    drawings.forEach(fvg => {
      // Only add markers for rectangle type FVGs
      if (fvg.type === 'hline') return;
      
      // Start marker
      markers.push({
        time: fvg.startTime,
        position: 'inBar',
        color: fvg.type === 'bullish' ? fvgColors.bullish : fvgColors.bearish,
        shape: 'square',
        size: 1,
        text: `${fvg.type === 'bullish' ? 'B' : 'S'}-FVG Start`
      });
      
      // End marker
      markers.push({
        time: fvg.endTime,
        position: 'inBar',
        color: fvg.type === 'bullish' ? fvgColors.bullish : fvgColors.bearish,
        shape: 'square',
        size: 1,
        text: `${fvg.type === 'bullish' ? 'B' : 'S'}-FVG End`
      });
    });
    
    return markers;
  }, [drawings, noFVGsFound, fvgColors]);
  
  // Update parent component when drawings change
  useEffect(() => {
    if (onDrawingsUpdate) {
      if (noFVGsFound) {
        onDrawingsUpdate([{
          no_fvgs_found: true,
          type: part === 1 ? 'bullish' : 'bearish'
        }]);
      } else {
        onDrawingsUpdate(drawings);
      }
    }
  }, [drawings, noFVGsFound, onDrawingsUpdate, part]);
  
  // Handle point click on chart
  const handlePointClick = (point) => {
    if (!drawingMode || noFVGsFound) return;
    
    // Find the nearest candle
    const candle = chartData.find(c => 
      c.time === point.time || 
      Math.floor(new Date(c.date).getTime() / 1000) === point.time
    );
    
    if (!candle) return;
    
    if (drawingType === 'rectangle') {
      if (!startPoint) {
        // Set start point
        setStartPoint({
          time: point.time,
          price: point.price
        });
      } else {
        // Calculate top and bottom prices
        const topPrice = Math.max(startPoint.price, point.price);
        const bottomPrice = Math.min(startPoint.price, point.price);
        
        // Create new FVG rectangle
        const newFVG = {
          startTime: Math.min(startPoint.time, point.time),
          endTime: Math.max(startPoint.time, point.time),
          topPrice,
          bottomPrice,
          type: part === 1 ? 'bullish' : 'bearish',
          drawingType: 'rectangle'
        };
        
        // Add new FVG
        setDrawings([...drawings, newFVG]);
        
        // Reset start point
        setStartPoint(null);
      }
    } else if (drawingType === 'hline') {
      // Create horizontal line FVG
      const newFVG = {
        startTime: point.time,
        endTime: point.time,
        topPrice: point.price,
        bottomPrice: point.price,
        type: part === 1 ? 'bullish' : 'bearish',
        drawingType: 'hline'
      };
      
      // Add new FVG
      setDrawings([...drawings, newFVG]);
    }
  };
  
  // Toggle drawing mode
  const toggleDrawingMode = (type) => {
    if (drawingMode && drawingType === type) {
      // Turn off drawing mode
      setDrawingMode(false);
      setStartPoint(null);
    } else {
      // Turn on drawing mode with selected type
      setDrawingMode(true);
      setDrawingType(type);
      setStartPoint(null);
      
      // If "No FVGs" was selected, clear it
      if (noFVGsFound) {
        setNoFVGsFound(false);
      }
    }
  };
  
  // Undo last drawing
  const undoLastDrawing = () => {
    if (noFVGsFound) {
      setNoFVGsFound(false);
      return;
    }
    
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
    setNoFVGsFound(false);
  };
  
  // Remove specific drawing
  const removeDrawing = (index) => {
    const newDrawings = [...drawings];
    newDrawings.splice(index, 1);
    setDrawings(newDrawings);
  };
  
  // Mark "No FVGs Found"
  const markNoFVGs = () => {
    setNoFVGsFound(true);
    setDrawings([]);
    setStartPoint(null);
    setDrawingMode(false);
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
          onClick={() => toggleDrawingMode('rectangle')} 
          active={drawingMode && drawingType === 'rectangle'}
          isDarkMode={isDarkMode}
          disabled={noFVGsFound}
        >
          {drawingMode && drawingType === 'rectangle' ? 'Stop Drawing' : 'Draw FVG Rectangle'}
        </Button>
        <Button 
          onClick={() => toggleDrawingMode('hline')} 
          active={drawingMode && drawingType === 'hline'}
          isDarkMode={isDarkMode}
          disabled={noFVGsFound}
        >
          {drawingMode && drawingType === 'hline' ? 'Stop Drawing' : 'Draw H-Line'}
        </Button>
        <Button 
          onClick={undoLastDrawing} 
          isDarkMode={isDarkMode}
          disabled={drawings.length === 0 && !startPoint && !noFVGsFound}
        >
          Undo
        </Button>
        <DangerButton 
          onClick={clearAllDrawings} 
          isDarkMode={isDarkMode}
          disabled={drawings.length === 0 && !startPoint && !noFVGsFound}
        >
          Clear All
        </DangerButton>
        <Button 
          onClick={markNoFVGs} 
          active={noFVGsFound}
          isDarkMode={isDarkMode}
        >
          No FVGs Found
        </Button>
      </ToolBar>
      
      <StatusBadge active={drawingMode || noFVGsFound} isDarkMode={isDarkMode}>
        {noFVGsFound ? (
          `No ${part === 1 ? 'Bullish' : 'Bearish'} FVGs Found`
        ) : drawingMode ? (
          drawingType === 'rectangle' ? 
            (startPoint ? 'Now click to set the end point' : 'Click to set the start point') :
            'Click to place horizontal line FVG'
        ) : (
          `Identify ${part === 1 ? 'Bullish' : 'Bearish'} Fair Value Gaps`
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
        
        {noFVGsFound && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            zIndex: 5,
            pointerEvents: 'none'
          }}>
            <div style={{
              padding: '10px 20px',
              backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
              borderRadius: '5px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              No {part === 1 ? 'Bullish' : 'Bearish'} FVGs Found
            </div>
          </div>
        )}
        
        <FVGPanel isDarkMode={isDarkMode}>
          <h3 style={{ 
            marginTop: 0, 
            fontSize: '1rem', 
            marginBottom: '10px',
            color: isDarkMode ? '#e0e0e0' : '#333'
          }}>
            Fair Value Gaps
          </h3>
          
          {noFVGsFound ? (
            <FVGItem isDarkMode={isDarkMode}>
              <h4>No {part === 1 ? 'Bullish' : 'Bearish'} FVGs</h4>
              <div className="fvg-data">
                <span>Status:</span>
                <span>None Found</span>
              </div>
            </FVGItem>
          ) : drawings.length === 0 ? (
            <p style={{ color: isDarkMode ? '#b0b0b0' : '#666', fontSize: '0.9rem' }}>
              No fair value gaps marked yet.
            </p>
          ) : (
            drawings.map((fvg, index) => (
              <FVGItem key={index} isDarkMode={isDarkMode}>
                <h4>{fvg.type === 'bullish' ? 'Bullish' : 'Bearish'} FVG #{index + 1}</h4>
                {fvg.drawingType === 'hline' ? (
                  <div className="fvg-data">
                    <span>Price:</span>
                    <span>{fvg.topPrice.toFixed(4)}</span>
                  </div>
                ) : (
                  <>
                    <div className="fvg-data">
                      <span>Range:</span>
                      <span>{fvg.bottomPrice.toFixed(4)} - {fvg.topPrice.toFixed(4)}</span>
                    </div>
                    <div className="fvg-data">
                      <span>Gap Size:</span>
                      <span>{(fvg.topPrice - fvg.bottomPrice).toFixed(4)}</span>
                    </div>
                  </>
                )}
                <div className="fvg-data">
                  <span>Date:</span>
                  <span>
                    {fvg.drawingType === 'hline' ? 
                      formatDate(fvg.startTime) : 
                      `${formatDate(fvg.startTime)} - ${formatDate(fvg.endTime)}`
                    }
                  </span>
                </div>
                <div className="fvg-remove">
                  <button onClick={() => removeDrawing(index)}>×</button>
                </div>
              </FVGItem>
            ))
          )}
        </FVGPanel>
      </ChartWrapper>
    </div>
  );
};

export default FairValueGaps;