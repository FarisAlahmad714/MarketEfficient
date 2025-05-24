import React, { useState, useEffect, useRef } from 'react';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';
import styled from 'styled-components';
import ToolPanel from './common/ToolPanel';
import CryptoLoader from '../CryptoLoader';

// Styled components
const ChartWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 600px;
  border-radius: 8px;
  overflow: hidden;
  background-color: ${props => props.$isDarkMode ? '#1e1e1e' : '#ffffff'};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 100%;
`;

const FVGPanel = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  width: 250px;
  max-height: 200px;
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
  background: ${props => props.$isBullish ? '#4CAF50' : '#F44336'};
  color: white;
  padding: 8px;
  text-align: center;
  cursor: move;
  font-weight: bold;
`;

const PanelContent = styled.div`
  padding: 8px;
`;

const FVGItem = styled.div`
  margin-bottom: 8px;
  padding: 6px;
  border-bottom: 1px solid ${props => props.$isDarkMode ? '#444' : '#eee'};
  &:last-child {
    border-bottom: none;
  }
`;

const FVGLabel = styled.span`
  display: block;
  font-weight: bold;
  margin-bottom: 4px;
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
`;

const FVGRange = styled.span`
  display: block;
  font-size: 0.85rem;
  color: ${props => props.$isDarkMode ? '#b0b0b0' : '#666'};
`;

const FVGDate = styled.span`
  display: block;
  font-size: 0.85rem;
  color: ${props => props.$isDarkMode ? '#b0b0b0' : '#666'};
`;

const NoFVGOverlay = styled.div`
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

const NoFVGMessage = styled.div`
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isActive ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const LoadingText = styled.div`
  font-size: 14px;
  color: #333;
  margin-top: 10px;
`;

const DrawingModeIndicator = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: ${props => props.$isDarkMode ? 'rgba(33, 150, 243, 0.8)' : 'rgba(33, 150, 243, 0.8)'};
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-weight: bold;
  z-index: 100;
  pointer-events: none;
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

const FairValueGaps = ({
  chartData,
  onDrawingsUpdate,
  isDarkMode = false,
  part = 1,
  chartCount = 1,
  validationResults = null,
  onSubmit = null,
  symbol = "Unknown",
  timeframe = "Unknown"
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const priceLineRefs = useRef([]);
  const panelRef = useRef(null);
  const [drawingMode, setDrawingMode] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [panelOffset, setPanelOffset] = useState({ x: 10, y: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ x: 0, y: 0 });
  const [fvgHoverAreas, setFvgHoverAreas] = useState([]);
  const [fvgLabels, setFvgLabels] = useState([]);
  const [fvgLineSeries, setFvgLineSeries] = useState([]);
  const [fvgPermanentLabels, setFvgPermanentLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showClearNotification, setShowClearNotification] = useState(false);
  const [prevPart, setPrevPart] = useState(part);
  const [chartKey, setChartKey] = useState(0);
  const [hoveredLabel, setHoveredLabel] = useState(null);

  // Color palettes for validation
  const bullishFVGColors = [
    { line: '#4CAF50', fill: 'rgba(76, 175, 80, 0.2)', text: '#4CAF50' },
    { line: '#66BB6A', fill: 'rgba(102, 187, 106, 0.2)', text: '#66BB6A' },
    { line: '#81C784', fill: 'rgba(129, 199, 132, 0.2)', text: '#81C784' },
    { line: '#43A047', fill: 'rgba(67, 160, 71, 0.2)', text: '#43A047' },
    { line: '#388E3C', fill: 'rgba(56, 142, 60, 0.2)', text: '#388E3C' }
  ];

  const bearishFVGColors = [
    { line: '#F44336', fill: 'rgba(244, 67, 54, 0.2)', text: '#F44336' },
    { line: '#EF5350', fill: 'rgba(239, 83, 80, 0.2)', text: '#EF5350' },
    { line: '#E57373', fill: 'rgba(229, 115, 115, 0.2)', text: '#E57373' },
    { line: '#E53935', fill: 'rgba(229, 57, 53, 0.2)', text: '#E53935' },
    { line: '#D32F2F', fill: 'rgba(211, 47, 47, 0.2)', text: '#D32F2F' }
  ];

  const colors = {
    bullish: 'rgba(76, 175, 80, 0.3)',
    bearish: 'rgba(244, 67, 54, 0.3)'
  };

  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [drawings.length]);

  useEffect(() => {
    if (prevPart !== part && prevPart !== undefined) {
      handleClearAll();
      setPrevPart(part);
      setShowClearNotification(true);
      setTimeout(() => setShowClearNotification(false), 2000);
      console.log(`Cleared Part ${prevPart} FVG drawings, now on Part ${part}`);
    }
  }, [part, prevPart]);

  useEffect(() => {
    if (!chartContainerRef.current || !chartData || chartData.length === 0) return;

    priceLineRefs.current = [];

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: isDarkMode ? '#1e1e1e' : '#ffffff' },
        textColor: isDarkMode ? '#d1d4dc' : '#333333'
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false }
      },
      timeScale: { timeVisible: true, secondsVisible: false },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { visible: true, labelVisible: true },
        horzLine: { visible: true, labelVisible: true }
      }
    });

    const candleSeries = chart.addCandlestickSeries();
    candleSeries.setData(chartData);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    // Draw all FVGs
    const markers = [];
    drawings.forEach((drawing, index) => {
      if (drawing.no_fvgs_found) return;

      const color = drawing.type === 'bullish' ? colors.bullish : colors.bearish;

      const topLine = candleSeries.createPriceLine({
        price: drawing.topPrice,
        color: color,
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `${drawing.type} FVG Top`
      });

      const bottomLine = candleSeries.createPriceLine({
        price: drawing.bottomPrice,
        color: color,
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `${drawing.type} FVG Bottom`
      });

      priceLineRefs.current.push(topLine, bottomLine);

      markers.push(
        {
          time: drawing.startTime,
          position: 'inBar',
          color: color,
          shape: 'square',
          text: `${drawing.type[0].toUpperCase()}-Start`
        },
        {
          time: drawing.endTime,
          position: 'inBar',
          color: color,
          shape: 'square',
          text: `${drawing.type[0].toUpperCase()}-End`
        }
      );
    });

    if (markers.length > 0) {
      candleSeries.setMarkers(markers.sort((a, b) => a.time - b.time));
    }

    // Handle crosshair movement for hoverable labels
    const handleCrosshairMove = (param) => {
      if (
        !param ||
        !param.time ||
        !param.point ||
        !validationResults?.expected?.gaps ||
        !candleSeriesRef.current
      ) {
        setHoveredLabel(null);
        return;
      }

      const time = param.time;
      const price = candleSeriesRef.current.coordinateToPrice(param.point.y);

      if (!price) {
        setHoveredLabel(null);
        return;
      }

      const fvg = validationResults.expected.gaps.find((gap, index) => {
        return (
          time >= gap.startTime &&
          price >= gap.bottomPrice &&
          price <= gap.topPrice
        );
      });

      if (fvg) {
        const x = chartRef.current.timeScale().timeToCoordinate(fvg.startTime);
        const y = candleSeriesRef.current.priceToCoordinate(fvg.topPrice);

        if (x !== null && y !== null) {
          const index = validationResults.expected.gaps.indexOf(fvg);
          setHoveredLabel({
            text: `FVG ${index + 1} (${fvg.type})`,
            x,
            y,
          });
        } else {
          setHoveredLabel(null);
        }
      } else {
        setHoveredLabel(null);
      }
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.unsubscribeCrosshairMove(handleCrosshairMove);
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartData, isDarkMode, chartKey]);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      layout: {
        background: { color: isDarkMode ? '#1e1e1e' : '#ffffff' },
        textColor: isDarkMode ? '#d1d4dc' : '#333333'
      }
    });
  }, [isDarkMode]);

  useEffect(() => {
    if (onDrawingsUpdate) {
      const userFVGs = drawings.map(d => ({
        startTime: d.startTime,
        endTime: d.endTime,
        topPrice: d.topPrice,
        bottomPrice: d.bottomPrice,
        type: d.type,
        no_fvgs_found: d.no_fvgs_found || false
      }));
      onDrawingsUpdate(userFVGs);
    }
  }, [drawings, onDrawingsUpdate]);

  useEffect(() => {
    let cleanup = null;
    if (validationResults && chartRef.current && candleSeriesRef.current) {
      clearFVGVisualElements();
      cleanup = drawFixedFVGLines();
      requestAnimationFrame(() => {
        updateFVGPositions();
        setTimeout(updateFVGPositions, 100);
      });
    }
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [validationResults]);

  const findCandleByTime = (time) => {
    if (!chartData || !time) return null;
    const exactMatch = chartData.find(candle => candle.time === time);
    if (exactMatch) return exactMatch;
    return [...chartData].sort((a, b) => 
      Math.abs(a.time - time) - Math.abs(b.time - time)
    )[0];
  };

  const handleChartClick = (e) => {
    if (!chartRef.current || !candleSeriesRef.current || !drawingMode) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const price = candleSeriesRef.current.coordinateToPrice(y);
    const timePoint = chartRef.current.timeScale().coordinateToTime(x);
    if (!price || !timePoint) return;
    const nearestCandle = findCandleByTime(timePoint);
    if (!nearestCandle) return;
    if (!startPoint) {
      setStartPoint({ time: nearestCandle.time, price });
      console.log('Start point set:', { time: nearestCandle.time, price });
    } else {
      const fvgType = part === 1 ? 'bullish' : 'bearish';
      const topPrice = Math.max(startPoint.price, price);
      const bottomPrice = Math.min(startPoint.price, price);
      const [startTime, endTime] = startPoint.time < nearestCandle.time 
        ? [startPoint.time, nearestCandle.time] 
        : [nearestCandle.time, startPoint.time];
      const newDrawing = {
        startTime: startTime,
        endTime: endTime,
        topPrice: topPrice,
        bottomPrice: bottomPrice,
        type: fvgType
      };
      console.log('Creating new FVG:', newDrawing);
      setDrawings(prev => [...prev, newDrawing]);
      setStartPoint(null);
    }
  };

  const toggleDrawingMode = () => {
    setDrawingMode(!drawingMode);
    if (drawingMode) {
      setStartPoint(null);
    }
  };

  const handleUndo = () => {
    console.log('Undo clicked - Current drawings:', drawings.length);
    if (drawings.length > 0) {
      const newDrawings = [...drawings];
      newDrawings.pop();
      setDrawings(newDrawings);
      console.log('After undo - Drawings:', newDrawings.length);
    }
    if (startPoint) {
      setStartPoint(null);
    }
  };

  const handleClearAll = () => {
    console.log('Clear all clicked');
    setDrawings([]);
    setStartPoint(null);
  };

  const handleNoFVGs = () => {
    setDrawings([{
      no_fvgs_found: true,
      type: part === 1 ? 'bullish' : 'bearish',
      startTime: chartData[0]?.time || 0,
      endTime: chartData[chartData.length - 1]?.time || 0,
      topPrice: 0,
      bottomPrice: 0
    }]);
    setDrawingMode(false);
  };

  const clearFVGVisualElements = () => {
    fvgHoverAreas.forEach(area => {
      if (area && area.parentNode) {
        area.parentNode.removeChild(area);
      }
    });
    setFvgHoverAreas([]);
    fvgLabels.forEach(label => {
      if (label && label.parentNode) {
        label.parentNode.removeChild(label);
      }
    });
    setFvgLabels([]);
    fvgPermanentLabels.forEach(label => {
      if (label && label.parentNode) {
        label.parentNode.removeChild(label);
      }
    });
    setFvgPermanentLabels([]);
    fvgLineSeries.forEach(series => {
      try {
        if (series && chartRef.current) {
          chartRef.current.removeSeries(series);
        }
      } catch (error) {
        console.error('Error removing series:', error);
      }
    });
    setFvgLineSeries([]);
  };

  const drawFVGLines = () => {
  try {
    clearFVGVisualElements();
    if (!validationResults?.expected?.gaps || !chartRef.current || !chartContainerRef.current) {
      return;
    }
    const sortedGaps = [...validationResults.expected.gaps].sort((a, b) => b.topPrice - a.topPrice);
    const newLineSeries = [];

    // Calculate rightEdge
    const maxTime = Math.max(...chartData.map((d) => d.time));
    const rightEdge = maxTime + 86400; // Add one day (86400 seconds)

    sortedGaps.forEach((gap, index) => {
      const colorIndex = index % 5;
      const colorPalette = gap.type === 'bullish'
        ? bullishFVGColors[colorIndex]
        : bearishFVGColors[colorIndex];

      // Top Line Series
      const topSeries = chartRef.current.addLineSeries({
        color: colorPalette.line,
        lineWidth: 2,
        lineStyle: 2, // Dashed line
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
      });
      topSeries.setData([
        { time: gap.startTime, value: gap.topPrice },
        { time: rightEdge, value: gap.topPrice },
      ]);

      // Bottom Line Series
      const bottomSeries = chartRef.current.addLineSeries({
        color: colorPalette.line,
        lineWidth: 2,
        lineStyle: 2, // Dashed line
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
      });
      bottomSeries.setData([
        { time: gap.startTime, value: gap.bottomPrice },
        { time: rightEdge, value: gap.bottomPrice },
      ]);

      newLineSeries.push(topSeries, bottomSeries);
    });
    setFvgLineSeries(newLineSeries);
  } catch (error) {
    console.error('Error in drawFVGLines:', error);
  }
};
  const drawFixedFVGLines = () => {
    try {
      drawFVGLines();
    } catch (error) {
      console.error('Error in drawFixedFVGLines:', error);
    }
  };

  const updateFVGPositions = () => {
    // Simplified - no complex positioning needed for now
  };

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
    if (isDragging && chartContainerRef.current && panelRef.current) {
      e.preventDefault();
      const x = e.clientX - currentCoords.x;
      const y = e.clientY - currentCoords.y;
      const container = chartContainerRef.current;
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

  const handleToolSelect = (toolId) => {
    if (toolId === 'draw-rectangle') {
      toggleDrawingMode();
    }
  };

  const handleSubmit = () => {
    if (drawings.length === 0) {
      alert("Please mark at least one Fair Value Gap or use the 'No FVGs Found' button before submitting.");
      return;
    }
    setIsLoading(true);
    if (onSubmit) {
      const userFVGs = drawings.map(d => ({
        startTime: d.startTime,
        endTime: d.endTime,
        topPrice: d.topPrice,
        bottomPrice: d.bottomPrice,
        type: d.type,
        no_fvgs_found: d.no_fvgs_found || false
      }));
      onSubmit(userFVGs).finally(() => {
        setIsLoading(false);
      });
    } else {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  const isNoFVGsDisabled = drawings.length === 1 && drawings[0]?.no_fvgs_found;

  const toolsConfig = [
    {
      id: 'draw-rectangle',
      label: 'Draw FVG',
      icon: 'fa-square',
      active: drawingMode
    },
    {
      id: 'undo',
      label: 'Undo',
      icon: 'fa-undo',
      onClick: handleUndo,
      disabled: drawings.length === 0 && !startPoint
    }
  ];

  const actionsConfig = [
    {
      id: 'clear-all',
      label: 'Clear All',
      icon: 'fa-trash',
      onClick: handleClearAll,
      disabled: drawings.length === 0 && !startPoint
    },
    {
      id: 'no-fvgs',
      label: 'No FVGs Found',
      icon: 'fa-ban',
      onClick: handleNoFVGs,
      disabled: isNoFVGsDisabled
    },
    {
      id: 'submit',
      label: 'Submit Answer',
      icon: 'fa-check',
      onClick: handleSubmit,
      primary: true
    }
  ];

  return (
    <div>
      {showClearNotification && (
        <ClearNotification $isDarkMode={isDarkMode}>
          Previous FVG drawings cleared for Part {part}
        </ClearNotification>
      )}
      <ToolPanel
        title={part === 1 ? "Bullish Fair Value Gaps" : "Bearish Fair Value Gaps"}
        description={part === 1
          ? "Identify gaps above price where price has yet to return"
          : "Identify gaps below price where price has yet to return"}
        selectedTool={drawingMode ? 'draw-rectangle' : null}
        onToolSelect={handleToolSelect}
        tools={toolsConfig}
        onClearAll={handleClearAll}
        isDarkMode={isDarkMode}
        noFvgsOption={true}
        onNoFvgsFound={handleNoFVGs}
      />
      <ChartWrapper $isDarkMode={isDarkMode}>
        <ChartContainer ref={chartContainerRef} onClick={handleChartClick} />
        {drawingMode && (
          <DrawingModeIndicator $isDarkMode={isDarkMode}>
            {startPoint ? 'Click to set end point' : 'Click to set start point'}
          </DrawingModeIndicator>
        )}
        <FVGPanel
          ref={panelRef}
          style={{ left: `${panelOffset.x}px`, top: `${panelOffset.y}px` }}
          onMouseDown={startPanelDragging}
          onMouseMove={dragPanel}
          onMouseUp={stopPanelDragging}
          onMouseLeave={stopPanelDragging}
          $isDarkMode={isDarkMode}
        >
          <PanelHeader className="panel-header" $isBullish={part === 1}>
            Fair Value Gaps
          </PanelHeader>
          <PanelContent>
            {drawings.length === 0 ? (
              <FVGItem $isDarkMode={isDarkMode}>
                <FVGLabel $isDarkMode={isDarkMode}>No Fair Value Gaps marked yet.</FVGLabel>
              </FVGItem>
            ) : drawings.length === 1 && drawings[0].no_fvgs_found ? (
              <FVGItem $isDarkMode={isDarkMode} style={{
                backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa',
                borderLeft: '3px solid #ffc107',
                padding: '8px'
              }}>
                <FVGLabel $isDarkMode={isDarkMode}>
                  No {part === 1 ? 'Bullish' : 'Bearish'} FVGs Found
                </FVGLabel>
                <FVGRange $isDarkMode={isDarkMode}>
                  You've indicated that there are no fair value gaps in this chart.
                </FVGRange>
              </FVGItem>
            ) : (
              drawings.map((fvg, index) => {
                if (fvg.no_fvgs_found) return null;
                const startDate = new Date(fvg.startTime * 1000).toLocaleDateString();
                return (
                  <FVGItem key={index} $isDarkMode={isDarkMode}>
                    <FVGLabel $isDarkMode={isDarkMode}>FVG {index + 1} ({fvg.type})</FVGLabel>
                    <FVGRange $isDarkMode={isDarkMode}>
                      Price Range: {fvg.bottomPrice.toFixed(2)} - {fvg.topPrice.toFixed(2)}
                    </FVGRange>
                    <FVGDate $isDarkMode={isDarkMode}>Date: {startDate}</FVGDate>
                  </FVGItem>
                );
              })
            )}
          </PanelContent>
        </FVGPanel>
        {hoveredLabel && (
          <div
            style={{
              position: 'absolute',
              left: `${hoveredLabel.x}px`,
              top: `${hoveredLabel.y - 20}px`,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '2px 5px',
              borderRadius: '3px',
              pointerEvents: 'none',
              zIndex: 1000,
              fontSize: '12px',
            }}
          >
            {hoveredLabel.text}
          </div>
        )}
        {drawings.length === 1 && drawings[0]?.no_fvgs_found && (
          <NoFVGOverlay>
            <NoFVGMessage>
              No {part === 1 ? 'Bullish' : 'Bearish'} FVGs Found
            </NoFVGMessage>
          </NoFVGOverlay>
        )}
      </ChartWrapper>
      <LoadingOverlay $isActive={isLoading}>
        <LoadingContent>
          <CryptoLoader />
          <LoadingText>Analyzing your answers...</LoadingText>
        </LoadingContent>
      </LoadingOverlay>
    </div>
  );
};

export default FairValueGaps;