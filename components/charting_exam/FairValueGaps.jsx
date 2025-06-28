import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';
import styled from 'styled-components';
import ToolPanel from './common/ToolPanel';
import logger from '../../lib/logger'; // Adjust path to your logger utility
// Adjust path to your logger utility

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
  position: relative;
`;

const FVGPanel = styled.div`
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
  background: ${props => props.$isBullish ? '#4CAF50' : '#F44336'};
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

const FVGItem = styled.div`
  margin-bottom: 8px;
  padding: 8px;
  border-bottom: 1px solid ${props => props.$isDarkMode ? '#444' : '#eee'};
  &:last-child {
    border-bottom: none;
  }
  background-color: ${props => props.$isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
  border-radius: 4px;
  
  & > .fvg-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    
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
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
`;

const Spinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  font-size: 14px;
  color: #333;
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
  const panelRef = useRef(null);

  const [drawingMode, setDrawingMode] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [userFVGs, setUserFVGs] = useState([]);
  const [rectangles, setRectangles] = useState([]);
  const [hlines, setHlines] = useState([]);
  const [panelOffset, setPanelOffset] = useState({ x: 0, y: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ x: 0, y: 0 });
  const [expectedFVGMarkers, setExpectedFVGMarkers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showClearNotification, setShowClearNotification] = useState(false);
  const [prevPart, setPrevPart] = useState(part);
  const [isMobile, setIsMobile] = useState(false);

  const colors = {
    bullish: '#00E676', // Bright green for user drawings
    bearish: '#FF1744', // Bright red for user drawings
    correctBullish: 'rgba(255, 152, 0, 0.6)', // Orange for expected results
    correctBearish: 'rgba(255, 152, 0, 0.6)' // Orange for expected results (same as bullish)
  };

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set initial panel position
  useEffect(() => {
    if (chartContainerRef.current && panelRef.current && !isMobile) {
      const containerWidth = chartContainerRef.current.clientWidth;
      const panelWidth = panelRef.current.clientWidth;
      setPanelOffset({ x: containerWidth - panelWidth - 10, y: 10 });
    }
  }, [chartContainerRef, panelRef, isMobile]);

  // Auto-clear drawings when part changes
  useEffect(() => {
    if (prevPart !== part && prevPart !== undefined) {
      clearAllDrawings();
      setStartPoint(null);
      setDrawingMode(null);
      setPrevPart(part);
      setShowClearNotification(true);
      setTimeout(() => setShowClearNotification(false), 2000);
    }
  }, [part, prevPart]);

  // Handle chart interaction for drawing (both mouse and touch)
  const handleChartInteraction = useCallback((point) => {
    if (!chartRef.current || !candleSeriesRef.current || !drawingMode || !point) return;
    
    const { time: timePoint, price } = point;
    
    if (!price || !timePoint) return;
    
    const nearestCandle = findCandleByTime(timePoint);
    if (!nearestCandle) return;
    
    resetNoFvgsState();
    
    if (drawingMode === 'draw-rectangle') {
      if (!startPoint) {
        setStartPoint({ time: nearestCandle.time, price });
      } else {
        const fvgType = part === 1 ? 'bullish' : 'bearish';
        const topPrice = Math.max(startPoint.price, price);
        const bottomPrice = Math.min(startPoint.price, price);
        
        const newRect = drawRectangle(
          startPoint.time,
          nearestCandle.time,
          topPrice,
          bottomPrice,
          fvgType
        );
        
        if (newRect) {
          setRectangles(prev => [...prev, newRect]);
          setUserFVGs(prev => [...prev, {
            startTime: startPoint.time,
            endTime: nearestCandle.time,
            topPrice: topPrice,
            bottomPrice: bottomPrice,
            type: fvgType
          }]);
        }
        
        setStartPoint(null);
      }
    } else if (drawingMode === 'draw-hline') {
      console.log('🔵 About to call drawHLine - drawingMode:', drawingMode);
      const fvgType = part === 1 ? 'bullish' : 'bearish';
      const newLine = drawHLine(nearestCandle.time, price, fvgType);
      
      if (newLine) {
        setHlines(prev => [...prev, newLine]);
        setUserFVGs(prev => [...prev, {
          startTime: nearestCandle.time,
          endTime: nearestCandle.time,
          topPrice: price,
          bottomPrice: price,
          type: fvgType,
          drawingType: 'hline'
        }]);
      }
    }
  }, [drawingMode, startPoint, part]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || !chartData || chartData.length === 0) return;

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
      clearFVGVisualElements();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartData, isDarkMode]);

  // Update dark mode
  useEffect(() => {
    if (!chartRef.current) return;
    
    chartRef.current.applyOptions({
      layout: {
        background: { color: isDarkMode ? '#1e1e1e' : '#ffffff' },
        textColor: isDarkMode ? '#d1d4dc' : '#333333'
      }
    });
  }, [isDarkMode]);

  // Subscribe to chart clicks for drawing interactions
  useEffect(() => {
    if (chartRef.current && candleSeriesRef.current) {
      const chart = chartRef.current;
      const candleSeries = candleSeriesRef.current;
      
      const handleClick = (param) => {
        if (param.time && drawingMode) {
          const price = candleSeries.coordinateToPrice(param.point.y);
          if (price) {
            handleChartInteraction({ time: param.time, price });
          }
        }
      };
      
      chart.subscribeClick(handleClick);
      
      return () => {
        chart.unsubscribeClick(handleClick);
      };
    }
  }, [drawingMode, handleChartInteraction]);

  // Notify parent about drawings update
  useEffect(() => {
    if (onDrawingsUpdate) {
      onDrawingsUpdate(userFVGs);
    }
  }, [userFVGs, onDrawingsUpdate]);

  // Process validation results - add labels to existing FVG visualizations
  useEffect(() => {
    if (validationResults && chartRef.current) {
      logger.log('Processing validation results with', validationResults.expected?.gaps?.length || 0, 'expected gaps');
      
      // Clear existing labels first
      clearFVGVisualElements();
      
      // Wait a bit longer to ensure chart is fully ready
      setTimeout(() => {
        drawFVGLabels();
      }, 500);
    }
  }, [validationResults]);

  // Find candle by time
  const findCandleByTime = (time) => {
    if (!chartData || !time) return null;
    const exactMatch = chartData.find(candle => candle.time === time);
    if (exactMatch) return exactMatch;
    return [...chartData].sort((a, b) => 
      Math.abs(a.time - time) - Math.abs(b.time - time)
    )[0];
  };


  // Draw rectangle on chart - now draws horizontal rays extending to 3rd candlestick
  const drawRectangle = (startTime, endTime, topPrice, bottomPrice, type = 'bullish') => {
    if (!chartRef.current || !candleSeriesRef.current) return null;
    
    const color = type === 'bullish' ? colors.bullish : colors.bearish;
    const [actualStartTime, actualEndTime] = startTime < endTime ? [startTime, endTime] : [endTime, startTime];
    
    // Calculate 3rd candlestick time - find next 3 candles from start time
    const startIndex = chartData.findIndex(d => d.time === actualStartTime);
    const thirdCandleIndex = Math.min(startIndex + 3, chartData.length - 1);
    const thirdCandleTime = chartData[thirdCandleIndex]?.time || actualEndTime;
    
    const newMarkers = [
      {
        time: actualStartTime,
        position: 'inBar',
        color: color,
        shape: 'square',
        text: type === 'bullish' ? 'B-FVG Start' : 'S-FVG Start'
      }
    ];
    
    const existingMarkers = candleSeriesRef.current.markers() || [];
    const allMarkers = [...existingMarkers, ...newMarkers].sort((a, b) => a.time - b.time);
    candleSeriesRef.current.setMarkers(allMarkers);
    
    // Create horizontal ray line series extending to 3rd candle
    const topSeries = chartRef.current.addLineSeries({
      color: color,
      lineWidth: 2,
      lineStyle: 0, // Solid
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false
    });
    
    const bottomSeries = chartRef.current.addLineSeries({
      color: color,
      lineWidth: 2,
      lineStyle: 0, // Solid
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false
    });
    
    // Set data for rays extending to 3rd candlestick
    topSeries.setData([
      { time: actualStartTime, value: topPrice },
      { time: thirdCandleTime, value: topPrice }
    ]);
    
    bottomSeries.setData([
      { time: actualStartTime, value: bottomPrice },
      { time: thirdCandleTime, value: bottomPrice }
    ]);
    
    return {
      startTime: actualStartTime,
      endTime: actualEndTime,
      topPrice: topPrice,
      bottomPrice: bottomPrice,
      type: type,
      markers: newMarkers,
      lines: [topSeries, bottomSeries],
      isLineSeries: true
    };
  };

  // Draw horizontal line on chart - now draws horizontal ray extending to 3rd candlestick
  const drawHLine = (time, price, type = 'bullish') => {
    console.log('🟢 drawHLine CALLED with:', { time, price, type });
    if (!chartRef.current || !candleSeriesRef.current) return null;
    
    const color = type === 'bullish' ? colors.bullish : colors.bearish;
    
    // Calculate 3rd candlestick time from clicked time
    const startIndex = chartData.findIndex(d => d.time === time);
    const thirdCandleIndex = Math.min(startIndex + 3, chartData.length - 1);
    const thirdCandleTime = chartData[thirdCandleIndex]?.time || time;
    
    console.log('FVG DRAWING - NEW CODE:', {
      clickedTime: time,
      startIndex,
      thirdCandleIndex,
      thirdCandleTime,
      message: 'Should draw ray to 3rd candle only'
    });
    
    // Create horizontal ray line series extending to 3rd candle
    const hlineSeries = chartRef.current.addLineSeries({
      color: color,
      lineWidth: 2,
      lineStyle: 0, // Solid
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false
    });
    
    // Set data for ray extending to 3rd candlestick
    hlineSeries.setData([
      { time: time, value: price },
      { time: thirdCandleTime, value: price }
    ]);
    
    const marker = {
      time: time,
      position: 'inBar',
      color: color,
      shape: 'circle',
      text: type === 'bullish' ? 'B' : 'S'
    };
    
    const existingMarkers = candleSeriesRef.current.markers() || [];
    const allMarkers = [...existingMarkers, marker].sort((a, b) => a.time - b.time);
    candleSeriesRef.current.setMarkers(allMarkers);
    
    return {
      line: hlineSeries,
      time: time,
      price: price,
      type: type,
      marker: marker,
      isLineSeries: true
    };
  };

  // Simple FVG labeling - just add number badges to existing FVG visualizations
  const drawFVGLabels = () => {
    try {
      if (!validationResults?.expected?.gaps || !chartRef.current || !chartContainerRef.current) {
        logger.log('Missing required data for drawing FVG labels');
        return;
      }
      
      logger.log('Drawing', validationResults.expected.gaps.length, 'FVG labels');
      
      const sortedGaps = [...validationResults.expected.gaps].sort((a, b) => b.topPrice - a.topPrice);
      const newExpectedMarkers = [];
      
      // First, draw visual rectangles for the FVGs
      sortedGaps.forEach((gap, index) => {
        try {
          const color = gap.type === 'bullish' ? colors.correctBullish : colors.correctBearish;
          
          // Add markers to show FVG boundaries at specific times (like user drawings)
          const fvgMarkers = [
            {
              time: gap.startTime,
              position: 'inBar',
              color: color,
              shape: 'square',
              text: `Expected ${gap.type === 'bullish' ? 'B' : 'S'}-FVG #${index + 1} Start`
            },
            {
              time: gap.endTime,
              position: 'inBar',
              color: color,
              shape: 'square',
              text: `Expected ${gap.type === 'bullish' ? 'B' : 'S'}-FVG #${index + 1} End`
            }
          ];
          
          // Track these markers for later cleanup
          newExpectedMarkers.push(...fvgMarkers);
          
          // Add the markers to the chart
          const existingMarkers = candleSeriesRef.current.markers() || [];
          const allMarkers = [...existingMarkers, ...fvgMarkers].sort((a, b) => a.time - b.time);
          candleSeriesRef.current.setMarkers(allMarkers);
          
          // Create FVG box within the 3-candle pattern instead of extending lines
          // Calculate the end time based on the 3-candle pattern
          const startIndex = chartData.findIndex(d => d.time === gap.startTime);
          const endIndex = Math.min(startIndex + 2, chartData.length - 1); // 3rd candle (index + 2)
          const endTime = chartData[endIndex]?.time || gap.startTime;
          
          // Create FVG box with fill between boundaries using baseline area series
          const transparentColor = 'rgba(255, 152, 0, 0.3)'; // Orange for both bullish and bearish expected results
            
          const fillSeries = chartRef.current.addBaselineSeries({
            topFillColor1: transparentColor,
            topFillColor2: transparentColor,
            topLineColor: color,
            bottomFillColor1: transparentColor,
            bottomFillColor2: transparentColor,
            bottomLineColor: color,
            lineWidth: 2,
            baseValue: {
              type: 'price',
              price: gap.bottomPrice
            },
            lastValueVisible: false,
            priceLineVisible: false,
            crosshairMarkerVisible: false
          });
          
          // Create data for the filled area between top and bottom prices
          const fillData = [];
          for (let i = startIndex; i <= endIndex; i++) {
            if (chartData[i]) {
              fillData.push({
                time: chartData[i].time,
                value: gap.topPrice
              });
            }
          }
          
          fillSeries.setData(fillData);
          
          // Add bottom border line for clarity
          const bottomBorderSeries = chartRef.current.addLineSeries({
            color: color,
            lineWidth: 2,
            lineStyle: 0,
            lastValueVisible: false,
            priceLineVisible: false,
            crosshairMarkerVisible: false
          });
          
          const bottomData = [];
          for (let i = startIndex; i <= endIndex; i++) {
            if (chartData[i]) {
              bottomData.push({
                time: chartData[i].time,
                value: gap.bottomPrice
              });
            }
          }
          
          bottomBorderSeries.setData(bottomData);
          
          // Track series for cleanup
          newExpectedMarkers.push({ fillSeries, bottomBorderSeries, isBaselineSeries: true });
          
        } catch (error) {
          console.error('Error drawing FVG markers:', error);
        }
      });
      
      setExpectedFVGMarkers(newExpectedMarkers);
      logger.log(`Successfully created FVG visualization without labels`);
      
    } catch (error) {
      console.error('Error in drawFVGLabels:', error);
    }
  };

  // Clear FVG visual elements
  const clearFVGVisualElements = () => {
    // Clear expected FVG markers and line series
    if (candleSeriesRef.current && expectedFVGMarkers.length > 0) {
      const currentMarkers = candleSeriesRef.current.markers() || [];
      const filteredMarkers = currentMarkers.filter(marker => {
        return !expectedFVGMarkers.some(expectedMarker => 
          expectedMarker.time === marker.time && 
          expectedMarker.position === marker.position && 
          expectedMarker.text === marker.text
        );
      });
      candleSeriesRef.current.setMarkers(filteredMarkers);
      
      // Also remove line series and rectangle series
      expectedFVGMarkers.forEach(item => {
        if (item.isLineSeries && item.topSeries && item.bottomSeries) {
          try {
            chartRef.current.removeSeries(item.topSeries);
            chartRef.current.removeSeries(item.bottomSeries);
          } catch (error) {
            console.error('Error removing line series:', error);
          }
        }
        if (item.isBaselineSeries && item.fillSeries && item.bottomBorderSeries) {
          try {
            chartRef.current.removeSeries(item.fillSeries);
            chartRef.current.removeSeries(item.bottomBorderSeries);
          } catch (error) {
            console.error('Error removing baseline series:', error);
          }
        }
      });
    }
    setExpectedFVGMarkers([]);
  };

  // Remove last drawing
  const removeLastDrawing = () => {
    if (!chartRef.current || !candleSeriesRef.current) return false;
    
    if (rectangles.length > 0) {
      const lastRect = rectangles[rectangles.length - 1];
      
      if (lastRect.lines) {
        lastRect.lines.forEach(line => {
          if (lastRect.isLineSeries) {
            try {
              chartRef.current.removeSeries(line);
            } catch (error) {
              console.error('Error removing line series:', error);
            }
          } else {
            candleSeriesRef.current.removePriceLine(line);
          }
        });
      }
      
      const currentMarkers = candleSeriesRef.current.markers() || [];
      const updatedMarkers = currentMarkers
        .filter(marker => {
          return !lastRect.markers.some(m => 
            m.time === marker.time && 
            m.position === marker.position && 
            m.text === marker.text
          );
        })
        .sort((a, b) => a.time - b.time);
      
      candleSeriesRef.current.setMarkers(updatedMarkers);
      setRectangles(prev => prev.slice(0, -1));
      
      return true;
    } else if (hlines.length > 0) {
      const lastLine = hlines[hlines.length - 1];
      
      if (lastLine.isLineSeries) {
        try {
          chartRef.current.removeSeries(lastLine.line);
        } catch (error) {
          console.error('Error removing line series:', error);
        }
      } else {
        candleSeriesRef.current.removePriceLine(lastLine.line);
      }
      
      const currentMarkers = candleSeriesRef.current.markers() || [];
      const updatedMarkers = currentMarkers
        .filter(marker => {
          return !(marker.time === lastLine.time && 
                  marker.position === lastLine.marker.position && 
                  marker.text === lastLine.marker.text);
        })
        .sort((a, b) => a.time - b.time);
      
      candleSeriesRef.current.setMarkers(updatedMarkers);
      setHlines(prev => prev.slice(0, -1));
      
      return true;
    }
    
    return false;
  };

  // Clear all drawings
  const clearAllDrawings = () => {
    if (!chartRef.current || !candleSeriesRef.current) return;
    
    rectangles.forEach(rect => {
      if (rect.lines) {
        rect.lines.forEach(line => {
          if (rect.isLineSeries) {
            try {
              chartRef.current.removeSeries(line);
            } catch (error) {
              console.error('Error removing line series:', error);
            }
          } else {
            candleSeriesRef.current.removePriceLine(line);
          }
        });
      }
    });
    setRectangles([]);
    
    hlines.forEach(line => {
      if (line.isLineSeries) {
        try {
          chartRef.current.removeSeries(line.line);
        } catch (error) {
          console.error('Error removing line series:', error);
        }
      } else {
        candleSeriesRef.current.removePriceLine(line.line);
      }
    });
    setHlines([]);
    
    candleSeriesRef.current.setMarkers([]);
    setUserFVGs([]);
    clearFVGVisualElements();
    resetNoFvgsState();
  };

  // Mark "No FVGs Found"
  const markNoFvgsFound = () => {
    clearAllDrawings();
    
    setUserFVGs([{
      no_fvgs_found: true,
      type: part === 1 ? 'bullish' : 'bearish',
      startTime: chartData.length > 0 ? chartData[0].time : 0,
      endTime: chartData.length > 0 ? chartData[chartData.length - 1].time : 0,
      topPrice: 0,
      bottomPrice: 0
    }]);
    
    setDrawingMode(null);
  };

  // Reset "No FVGs Found" state
  const resetNoFvgsState = () => {
    if (userFVGs.length === 1 && userFVGs[0].no_fvgs_found) {
      setUserFVGs([]);
    }
  };

  // Enhanced dragging logic (copied from SwingAnalysis)
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

  // Remove individual FVG
  const removeFVG = (index) => {
    if (index < rectangles.length) {
      const rectToRemove = rectangles[index];
      if (rectToRemove.lines) {
        rectToRemove.lines.forEach(line => {
          candleSeriesRef.current.removePriceLine(line);
        });
      }
      
      const currentMarkers = candleSeriesRef.current.markers() || [];
      const updatedMarkers = currentMarkers
        .filter(marker => {
          return !rectToRemove.markers.some(m => 
            m.time === marker.time && 
            m.position === marker.position && 
            m.text === marker.text
          );
        })
        .sort((a, b) => a.time - b.time);
      
      candleSeriesRef.current.setMarkers(updatedMarkers);
      setRectangles(prev => prev.filter((_, i) => i !== index));
    } else if (index - rectangles.length < hlines.length) {
      const hlineIndex = index - rectangles.length;
      const lineToRemove = hlines[hlineIndex];
      candleSeriesRef.current.removePriceLine(lineToRemove.line);
      
      const currentMarkers = candleSeriesRef.current.markers() || [];
      const updatedMarkers = currentMarkers
        .filter(marker => {
          return !(marker.time === lineToRemove.time && 
                  marker.position === lineToRemove.marker.position && 
                  marker.text === lineToRemove.marker.text);
        })
        .sort((a, b) => a.time - b.time);
      
      candleSeriesRef.current.setMarkers(updatedMarkers);
      setHlines(prev => prev.filter((_, i) => i !== hlineIndex));
    }
    
    setUserFVGs(prev => prev.filter((_, i) => i !== index));
  };

  // Handle tool selection
  const handleToolSelect = (toolId) => {
    if (toolId === drawingMode) {
      setDrawingMode(null);
    } else {
      setDrawingMode(toolId);
      setStartPoint(null);
      resetNoFvgsState();
    }
  };

  // Handle undo action
  const handleUndoDrawing = () => {
    if (removeLastDrawing() && userFVGs.length > 0) {
      setUserFVGs(prev => prev.slice(0, -1));
    }
    
    if (userFVGs.length <= 1) {
      resetNoFvgsState();
    }
  };

  // Handle submission
  const handleSubmit = () => {
    if (userFVGs.length === 0) {
      alert("Please mark at least one Fair Value Gap or use the 'No FVGs Found' button before submitting.");
      return;
    }
    
    setIsLoading(true);
    
    if (onSubmit) {
      onSubmit(userFVGs)
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  const isNoFVGsDisabled = userFVGs.length === 1 && userFVGs[0].no_fvgs_found;

  const toolsConfig = [
    {
      id: 'draw-rectangle',
      label: 'Draw FVG Rectangle',
      icon: 'fa-square',
      active: drawingMode === 'draw-rectangle'
    },
    {
      id: 'draw-hline',
      label: 'Draw H-Line',
      icon: 'fa-minus',
      active: drawingMode === 'draw-hline'
    },
    {
      id: 'undo',
      label: 'Undo',
      icon: 'fa-undo',
      onClick: handleUndoDrawing,
      disabled: rectangles.length === 0 && hlines.length === 0
    }
  ];

  const actionsConfig = [
    {
      id: 'clear-all',
      label: 'Clear All',
      icon: 'fa-trash',
      onClick: clearAllDrawings,
      disabled: rectangles.length === 0 && hlines.length === 0
    },
    {
      id: 'no-fvgs',
      label: 'No FVGs Found',
      icon: 'fa-ban',
      onClick: markNoFvgsFound,
      disabled: isNoFVGsDisabled
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
        selectedTool={drawingMode}
        onToolSelect={handleToolSelect}
        tools={toolsConfig}
        actions={actionsConfig}
        onClearAll={clearAllDrawings}
        isDarkMode={isDarkMode}
        noFvgsOption={true}
        onNoFvgsFound={markNoFvgsFound}
      />
      
      <div style={{ position: 'relative' }}>
        <ChartWrapper 
          $isDarkMode={isDarkMode}
          onMouseMove={dragPanel}
          onMouseUp={stopPanelDragging}
          onMouseLeave={stopPanelDragging}
        >
          <ChartContainer 
            ref={chartContainerRef} 
          />
          
          {drawingMode && (
            <DrawingModeIndicator $isDarkMode={isDarkMode}>
              {drawingMode === 'draw-rectangle' ? 'Drawing Rectangle' : 'Drawing H-Line'}
            </DrawingModeIndicator>
          )}
          
          
          {userFVGs.length === 1 && userFVGs[0].no_fvgs_found && (
            <NoFVGOverlay>
              <NoFVGMessage>
                No {part === 1 ? 'Bullish' : 'Bearish'} FVGs Found
              </NoFVGMessage>
            </NoFVGOverlay>
          )}
        </ChartWrapper>

        <FVGPanel
          ref={panelRef}
          style={isMobile ? {} : { 
            left: `${panelOffset.x}px`, 
            top: `${panelOffset.y}px`
          }}
          onMouseDown={startPanelDragging}
          $isDarkMode={isDarkMode}
        >
          <PanelHeader className="panel-header" $isBullish={part === 1}>
            Fair Value Gaps
          </PanelHeader>
          <PanelContent>
            {userFVGs.length === 0 ? (
              <FVGItem $isDarkMode={isDarkMode}>
                <FVGLabel $isDarkMode={isDarkMode}>No Fair Value Gaps marked yet.</FVGLabel>
              </FVGItem>
            ) : userFVGs.length === 1 && userFVGs[0].no_fvgs_found ? (
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
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span style={{ display: 'inline-block', background: '#2196F3', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                    Total: {userFVGs.filter(fvg => !fvg.no_fvgs_found).length}
                  </span>
                  <span style={{ display: 'inline-block', background: part === 1 ? '#4CAF50' : '#F44336', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                    {part === 1 ? 'Bullish' : 'Bearish'}
                  </span>
                </div>
                {userFVGs.map((fvg, index) => {
                  if (fvg.no_fvgs_found) return null;
                  
                  const startDate = new Date(fvg.startTime * 1000).toLocaleDateString();
                  return (
                    <FVGItem key={index} $isDarkMode={isDarkMode}>
                      <div className="fvg-header">
                        <FVGLabel $isDarkMode={isDarkMode}>
                          FVG {index + 1} ({fvg.type})
                        </FVGLabel>
                        <button onClick={() => removeFVG(index)}>×</button>
                      </div>
                      <FVGRange $isDarkMode={isDarkMode}>
                        Range: {fvg.topPrice.toFixed(2)} - {fvg.bottomPrice.toFixed(2)}
                      </FVGRange>
                      <FVGDate $isDarkMode={isDarkMode}>
                        Date: {startDate}
                      </FVGDate>
                      {fvg.drawingType === 'hline' && (
                        <FVGDate $isDarkMode={isDarkMode}>
                          Type: Horizontal Line
                        </FVGDate>
                      )}
                    </FVGItem>
                  );
                })}
              </>
            )}
          </PanelContent>
        </FVGPanel>
      </div>
      
      <LoadingOverlay $isActive={isLoading}>
        <LoadingContent>
          <Spinner />
          <LoadingText>Analyzing your answers...</LoadingText>
        </LoadingContent>
      </LoadingOverlay>
    </div>
  );
};

export default FairValueGaps;