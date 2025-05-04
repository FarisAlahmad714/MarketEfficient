import React, { useState, useEffect, useRef } from 'react';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';
import styled from 'styled-components';
import ToolPanel from './common/ToolPanel';

// Styled components remain unchanged
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
  const [panelOffset, setPanelOffset] = useState({ x: 10, y: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ x: 0, y: 0 });
  const [fvgHoverAreas, setFvgHoverAreas] = useState([]);
  const [fvgLabels, setFvgLabels] = useState([]);
  const [fvgLineSeries, setFvgLineSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const colors = {
    bullish: 'rgba(76, 175, 80, 0.3)',
    bearish: 'rgba(244, 67, 54, 0.3)',
    correctBullish: 'rgba(255, 152, 0, 0.6)',
    correctBearish: 'rgba(244, 67, 54, 0.6)'
  };

  useEffect(() => {
    console.log("Current drawing mode:", drawingMode);
  }, [drawingMode]);

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

    const handleContainerClick = (e) => {
      if (!chartRef.current || !candleSeriesRef.current) return;
      const rect = chartContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const time = chartRef.current.timeScale().coordinateToTime(x);
      const price = candleSeriesRef.current.coordinateToPrice(y);
      if (time && price) {
        handleChartClick({
          point: { x, y },
          time,
          price
        });
      }
    };
    chartContainerRef.current.addEventListener('click', handleContainerClick);

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
      if (chartContainerRef.current) {
        chartContainerRef.current.removeEventListener('click', handleContainerClick);
      }
    };
  }, [chartData, isDarkMode]);

  useEffect(() => {
    if (onDrawingsUpdate) {
      onDrawingsUpdate(userFVGs);
    }
  }, [userFVGs, onDrawingsUpdate]);

  useEffect(() => {
    if (validationResults && chartRef.current && candleSeriesRef.current) {
      clearFVGVisualElements();
      drawFixedFVGLines();
    }
  }, [validationResults]);

  const handleChartClick = (param) => {
    console.log("Chart clicked, drawing mode:", drawingMode);
    if (!drawingMode || !param || !chartRef.current || !candleSeriesRef.current) return;

    let price, time;
    if (param.price) {
      price = param.price;
    } else if (param.point && param.point.y !== undefined) {
      price = candleSeriesRef.current.coordinateToPrice(param.point.y);
    }
    if (param.time) {
      time = param.time;
    } else if (param.point && param.point.x !== undefined) {
      time = chartRef.current.timeScale().coordinateToTime(param.point.x);
    }
    if (!price || !time) {
      console.error("Could not determine price or time from click", param);
      return;
    }

    const nearestCandle = findCandleByTime(time);
    if (!nearestCandle) {
      console.error("No candle found at time:", time);
      return;
    }

    resetNoFvgsState();

    if (drawingMode === 'draw-rectangle') {
      if (!startPoint) {
        console.log("Setting start point:", { time: nearestCandle.time, price });
        setStartPoint({ time: nearestCandle.time, price });
      } else {
        console.log("Drawing rectangle from", startPoint, "to", { time: nearestCandle.time, price });
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
           倉type: fvgType
          }]);
        }

        setStartPoint(null);
      }
    } else if (drawingMode === 'draw-hline') {
      console.log("Drawing h-line at price:", price);
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
  };

  const findCandleByTime = (time) => {
    if (!chartData || !time) return null;
    return chartData.find(candle => candle.time === time);
  };

  const drawRectangle = (startTime, endTime, topPrice, bottomPrice, type = 'bullish') => {
    if (!chartRef.current || !candleSeriesRef.current) return null;
    
    const color = type === 'bullish' ? colors.bullish : colors.bearish;
    
    const [actualStartTime, actualEndTime] = startTime < endTime ? [startTime, endTime] : [endTime, startTime];
    
    const newMarkers = [
      {
        time: actualStartTime,
        position: 'inBar',
        color: color,
        shape: 'square',
        text: type === 'bullish' ? 'B-FVG Start' : 'S-FVG Start'
      },
      {
        time: actualEndTime,
        position: 'inBar',
        color: color,
        shape: 'square',
        text: type === 'bullish' ? 'B-FVG End' : 'S-FVG End'
      }
    ];
    
    const existingMarkers = candleSeriesRef.current.markers() || [];
    candleSeriesRef.current.setMarkers([...existingMarkers, ...newMarkers]);
    
    const topLine = candleSeriesRef.current.createPriceLine({
      price: topPrice,
      color: color,
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: `${type} FVG Top`
    });
    
    const bottomLine = candleSeriesRef.current.createPriceLine({
      price: bottomPrice,
      color: color,
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: `${type} FVG Bottom`
    });
    
    return {
      startTime: actualStartTime,
      endTime: actualEndTime,
      topPrice: topPrice,
      bottomPrice: bottomPrice,
      type: type,
      markers: newMarkers,
      lines: [topLine, bottomLine]
    };
  };

  const drawHLine = (time, price, type = 'bullish') => {
    if (!chartRef.current || !candleSeriesRef.current) return null;
    
    const color = type === 'bullish' ? colors.bullish : colors.bearish;
    const title = type === 'bullish' ? 'Bullish FVG' : 'Bearish FVG';
    
    const hline = candleSeriesRef.current.createPriceLine({
      price: price,
      color: color,
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: title
    });
    
    const marker = {
      time: time,
      position: 'inBar',
      color: color,
      shape: 'circle',
      text: type === 'bullish' ? 'B' : 'S'
    };
    
    const existingMarkers = candleSeriesRef.current.markers() || [];
    candleSeriesRef.current.setMarkers([...existingMarkers, marker]);
    
    return {
      line: hline,
      time: time,
      price: price,
      type: type,
      marker: marker
    };
  };

  const removeLastDrawing = () => {
    if (!chartRef.current || !candleSeriesRef.current) return false;
    
    if (rectangles.length > 0) {
      const lastRect = rectangles[rectangles.length - 1];
      
      if (lastRect.lines) {
        lastRect.lines.forEach(line => {
          candleSeriesRef.current.removePriceLine(line);
        });
      }
      
      const currentMarkers = candleSeriesRef.current.markers() || [];
      const updatedMarkers = currentMarkers.filter(marker => {
        return !lastRect.markers.some(m => 
          m.time === marker.time && 
          m.position === marker.position && 
          m.text === marker.text
        );
      });
      
      candleSeriesRef.current.setMarkers(updatedMarkers);
      setRectangles(rectangles.slice(0, -1));
      
      return true;
    } else if (hlines.length > 0) {
      const lastLine = hlines[hlines.length - 1];
      candleSeriesRef.current.removePriceLine(lastLine.line);
      
      const currentMarkers = candleSeriesRef.current.markers() || [];
      const updatedMarkers = currentMarkers.filter(marker => {
        return !(marker.time === lastLine.time && 
                marker.position === lastLine.marker.position && 
                marker.text === lastLine.marker.text);
      });
      
      candleSeriesRef.current.setMarkers(updatedMarkers);
      setHlines(hlines.slice(0, -1));
      
      return true;
    }
    
    return false;
  };

  const clearAllDrawings = () => {
    if (!chartRef.current || !candleSeriesRef.current) return;
    
    rectangles.forEach(rect => {
      if (rect.lines) {
        rect.lines.forEach(line => {
          candleSeriesRef.current.removePriceLine(line);
        });
      }
    });
    setRectangles([]);
    
    hlines.forEach(line => {
      candleSeriesRef.current.removePriceLine(line.line);
    });
    setHlines([]);
    
    candleSeriesRef.current.setMarkers([]);
    
    setUserFVGs([]);
    
    resetNoFvgsState();
  };

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

  const resetNoFvgsState = () => {
    if (userFVGs.length === 1 && userFVGs[0].no_fvgs_found) {
      setUserFVGs([]);
    }
  };

  const clearFVGVisualElements = () => {
    if (!chartContainerRef.current) return;
    
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

  const createFVGHoverAreas = () => {
    if (!chartRef.current || !candleSeriesRef.current || !chartContainerRef.current) return;
    
    clearFVGVisualElements();
    
    if (!validationResults || !validationResults.expected || !validationResults.expected.gaps) return;
    
    const sortedGaps = [...validationResults.expected.gaps].sort((a, b) => b.topPrice - a.topPrice);
    
    const newHoverAreas = [];
    const newLabels = [];
    const newLineSeries = [];
    
    sortedGaps.forEach((gap, index) => {
      const fvgNumber = index + 1;
      const color = gap.type === 'bullish' ? '#FF9800' : '#F44336';
      
      const seriesPair = addGapLines(gap, fvgNumber, color);
      if (seriesPair) {
        newLineSeries.push(...seriesPair);
      }
      
      const candleX = chartRef.current.timeScale().timeToCoordinate(gap.endTime);
      const topY = candleSeriesRef.current.priceToCoordinate(gap.topPrice);
      const bottomY = candleSeriesRef.current.priceToCoordinate(gap.bottomPrice);
      
      if (!candleX || !topY || !bottomY) return;
      
      const hoverArea = document.createElement('div');
      hoverArea.className = 'fvg-hover-area';
      hoverArea.dataset.time = gap.endTime;
      hoverArea.dataset.topPrice = gap.topPrice;
      hoverArea.dataset.bottomPrice = gap.bottomPrice;
      hoverArea.dataset.fvgNumber = fvgNumber;
      hoverArea.dataset.type = gap.type;
      
      hoverArea.style.position = 'absolute';
      hoverArea.style.left = (candleX) + 'px';
      hoverArea.style.top = topY + 'px';
      hoverArea.style.height = (bottomY - topY) + 'px';
      hoverArea.style.width = '20px';
      hoverArea.style.zIndex = '900';
      hoverArea.style.cursor = 'pointer';
      hoverArea.style.backgroundColor = 'transparent';
      
      const label = document.createElement('div');
      label.className = 'fvg-label';
      label.style.position = 'absolute';
      label.style.backgroundColor = color;
      label.style.color = 'white';
      label.style.padding = '2px 6px';
      label.style.borderRadius = '4px';
      label.style.fontWeight = 'bold';
      label.style.fontSize = '12px';
      label.style.zIndex = '1000';
      label.style.whiteSpace = 'nowrap';
      label.style.opacity = '0';
      label.style.transition = 'opacity 0.2s';
      label.style.pointerEvents = 'none';
      label.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
      label.textContent = `Correct FVG ${fvgNumber}`;
      label.dataset.fvgNumber = fvgNumber;
      
      hoverArea.addEventListener('mouseenter', () => {
        label.style.opacity = '1';
        hoverArea.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      });
      
      hoverArea.addEventListener('mouseleave', () => {
        label.style.opacity = '0';
        hoverArea.style.backgroundColor = 'transparent';
      });
      
      chartContainerRef.current.appendChild(hoverArea);
      chartContainerRef.current.appendChild(label);
      
      newHoverAreas.push(hoverArea);
      newLabels.push(label);
    });
    
    setFvgHoverAreas(newHoverAreas);
    setFvgLabels(newLabels);
    setFvgLineSeries(prevSeries => [...prevSeries, ...newLineSeries]);
    
    updateFVGPositions();
    
    setupChartEventListeners();
  };

  const addGapLines = (gap, fvgNumber, color) => {
    if (!chartRef.current || !chartData) return null;
    
    try {
      const topSeries = chartRef.current.addLineSeries({
        color: color,
        lineWidth: 2,
        lineStyle: 2,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false
      });
      
      const bottomSeries = chartRef.current.addLineSeries({
        color: color,
        lineWidth: 2,
        lineStyle: 2,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false
      });
      
      const rightEdge = Math.max(...chartData.map(d => d.time)) + 86400;
      
      topSeries.setData([
        { time: gap.endTime, value: gap.topPrice },
        { time: rightEdge, value: gap.topPrice }
      ]);
      
      bottomSeries.setData([
        { time: gap.endTime, value: gap.bottomPrice },
        { time: rightEdge, value: gap.bottomPrice }
      ]);
      
      return [topSeries, bottomSeries];
    } catch (error) {
      console.error('Error adding gap lines:', error);
      return null;
    }
  };

  const updateFVGPositions = () => {
    if (!chartRef.current || !candleSeriesRef.current || !chartContainerRef.current) return;
    
    if (!chartRef.current.timeScale().timeToCoordinate || !candleSeriesRef.current.priceToCoordinate) return;
    
    const chartRect = chartContainerRef.current.getBoundingClientRect();
    const chartWidth = chartRect.width;
    const chartHeight = chartRect.height;
    
    for (let i = 0; i < fvgHoverAreas.length; i++) {
      const hoverArea = fvgHoverAreas[i];
      const label = fvgLabels.find(l => l.dataset.fvgNumber === hoverArea.dataset.fvgNumber);
      
      if (!hoverArea || !label) continue;
      
      try {
        const time = parseInt(hoverArea.dataset.time);
        const topPrice = parseFloat(hoverArea.dataset.topPrice);
        const bottomPrice = parseFloat(hoverArea.dataset.bottomPrice);
        
        if (isNaN(time) || isNaN(topPrice) || isNaN(bottomPrice)) continue;
        
        const candleX = chartRef.current.timeScale().timeToCoordinate(time);
        const topY = candleSeriesRef.current.priceToCoordinate(topPrice);
        const bottomY = candleSeriesRef.current.priceToCoordinate(bottomPrice);
        
        if (candleX === null || topY === null || bottomY === null) {
          hoverArea.style.display = 'none';
          label.style.display = 'none';
          continue;
        }
        
        hoverArea.style.display = '';
        hoverArea.style.left = candleX + 'px';
        hoverArea.style.top = topY + 'px';
        hoverArea.style.height = Math.max(1, bottomY - topY) + 'px';
        hoverArea.style.width = '20px';
        
        label.style.display = '';
        const labelRect = label.getBoundingClientRect();
        const labelWidth = labelRect.width || 100;
        const labelHeight = labelRect.height || 20;
        
        const labelY = topY + (bottomY - topY) / 2;
        
        let labelX = candleX + 25;
        let adjustedY = labelY - (labelHeight / 2);
        
        if (labelX + labelWidth > chartWidth) {
          labelX = candleX - labelWidth - 5;
        }
        
        if (adjustedY < 0) {
          adjustedY = 0;
        } else if (adjustedY + labelHeight > chartHeight) {
          adjustedY = chartHeight - labelHeight;
        }
        
        label.style.left = labelX + 'px';
        label.style.top = adjustedY + 'px';
      } catch (error) {
        console.error('Error updating FVG position:', error);
      }
    }
  };

  const drawFixedFVGLines = () => {
    try {
      clearFVGVisualElements();
      createFVGHoverAreas();
    } catch (error) {
      console.error('Error in drawFixedFVGLines:', error);
    }
  };

  const setupChartEventListeners = () => {
    if (!chartRef.current) return;
    
    try {
      chartRef.current.timeScale().subscribeVisibleTimeRangeChange(updateFVGPositions);
      
      try {
        chartRef.current.priceScale('right').subscribeVisiblePriceRangeChange(updateFVGPositions);
      } catch (e) {
        console.log('Price scale events not supported in this version');
      }
      
      chartRef.current.subscribeCrosshairMove(updateFVGPositions);
      
      window.addEventListener('resize', updateFVGPositions);
    } catch (error) {
      console.error('Error in setupChartEventListeners:', error);
    }
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
    console.log("Tool selected:", toolId, "Previous drawing mode:", drawingMode);
    if (toolId === drawingMode) {
      console.log("Turning off drawing mode");
      setDrawingMode(null);
    } else {
      console.log("Setting drawing mode to:", toolId);
      setDrawingMode(toolId);
      setStartPoint(null);
      resetNoFvgsState();
    }
    setTimeout(() => {
      console.log("Drawing mode is now:", drawingMode);
    }, 0);
  };

  const handleUndoDrawing = () => {
    if (removeLastDrawing() && userFVGs.length > 0) {
      setUserFVGs(prev => prev.slice(0, -1));
    }
    
    if (userFVGs.length <= 1) {
      resetNoFvgsState();
    }
  };

  const handleSubmit = () => {
    if (userFVGs.length === 0) {
      alert("Please mark at least one Fair Value Gap or use the 'No FVGs Found' button before submitting.");
      return;
    }
    
    setIsLoading(true);
    
    if (onSubmit) {
      onSubmit(userFVGs, chartData, chartCount, part)
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
    }
  ];

  const actionsConfig = [
    {
      id: 'undo',
      label: 'Undo',
      icon: 'fa-undo',
      onClick: handleUndoDrawing,
      disabled: rectangles.length === 0 && hlines.length === 0
    },
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
      <ChartWrapper $isDarkMode={isDarkMode}>
        <ChartContainer ref={chartContainerRef} />
        {drawingMode && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: isDarkMode ? 'rgba(33, 150, 243, 0.8)' : 'rgba(33, 150, 243, 0.8)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontWeight: 'bold',
            zIndex: 100,
            pointerEvents: 'none'
          }}>
            {drawingMode === 'draw-rectangle' ? 'Drawing Rectangle' : 'Drawing H-Line'}
          </div>
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
          <PanelHeader $isBullish={part === 1}>
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
              userFVGs.map((fvg, index) => {
                if (fvg.no_fvgs_found) return null;
                
                const startDate = new Date(fvg.startTime * 1000).toLocaleDateString();
                return (
                  <FVGItem key={index} $isDarkMode={isDarkMode}>
                    <FVGLabel $isDarkMode={isDarkMode}>FVG {index + 1} ({fvg.type})</FVGLabel>
                    <FVGRange $isDarkMode={isDarkMode}>
                      Price Range: {fvg.topPrice.toFixed(2)} - {fvg.bottomPrice.toFixed(2)}
                    </FVGRange>
                    <FVGDate $isDarkMode={isDarkMode}>Date: {startDate}</FVGDate>
                  </FVGItem>
                );
              })
            )}
          </PanelContent>
        </FVGPanel>
        
        {userFVGs.length === 1 && userFVGs[0].no_fvgs_found && (
          <NoFVGOverlay>
            <NoFVGMessage>
              No {part === 1 ? 'Bullish' : 'Bearish'} FVGs Found
            </NoFVGMessage>
          </NoFVGOverlay>
        )}
      </ChartWrapper>
      
      <ToolPanel
        title={part === 1 ? "Bullish Fair Value Gaps" : "Bearish Fair Value Gaps"}
        description={part === 1
          ? "Identify gaps above price where price has yet to return"
          : "Identify gaps below price where price has yet to return"}
        selectedTool={drawingMode}
        onToolSelect={handleToolSelect}
        tools={toolsConfig}
        onClearAll={clearAllDrawings}
        onUndoDrawing={handleUndoDrawing}
        onNoFvgsFound={markNoFvgsFound}
        onSubmit={handleSubmit}
        isDarkMode={isDarkMode}
        noFvgsOption={true}
        chartInfo={{
          symbol,
          timeframe,
          chartCount,
          totalCharts: 5,
          part
        }}
      />
      
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