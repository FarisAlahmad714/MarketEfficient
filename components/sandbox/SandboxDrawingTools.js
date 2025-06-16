import React, { useState, useEffect, useRef, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { FaPencilAlt, FaMousePointer, FaRuler, FaCircle, FaSquare, FaTrash, FaUndo, FaCog } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import FibonacciSettings from '../charting_exam/FibonacciSettings';

// Drawing tools for Lightweight Charts
const DRAWING_TOOLS = {
  POINTER: 'pointer',
  TRENDLINE: 'trendline', 
  FIBONACCI: 'fibonacci',
  FVG: 'fvg',
  SWING_POINT: 'swingPoint'
};

// Default Fibonacci levels from charting exam
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

// EXACT enhancePointSelection from your working charting exam
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
  let adjustedPrice;
  
  // Decide which extreme (high or low) we should snap to so that
  // the anchor always sits on a wick tip – mimicking the behaviour
  // from the original chart-exam implementation.
  
  // If the click is outside the candle range, clamp to the nearest extreme
  if (clickedPrice > exactCandle.high) {
    adjustedPrice = exactCandle.high;
  } else if (clickedPrice < exactCandle.low) {
    adjustedPrice = exactCandle.low;
  } else {
    // Click happened inside the candle (between high and low).
    // Snap to whichever extreme (high or low) is closer to the cursor.
    const distToHigh = Math.abs(clickedPrice - exactCandle.high);
    const distToLow = Math.abs(clickedPrice - exactCandle.low);
    adjustedPrice = distToHigh <= distToLow ? exactCandle.high : exactCandle.low;
  }
  
  return {
    time: exactCandle.time || (exactCandle.date && Math.floor(new Date(exactCandle.date).getTime() / 1000)),
    price: adjustedPrice
  };
}

const SandboxDrawingTools = ({ chartInstance, chartContainer, candlestickSeries, chartData, onDrawingUpdate }) => {
  const { darkMode } = useContext(ThemeContext);
  const chartContainerRef = useRef(null);
  
  const [activeTool, setActiveTool] = useState(DRAWING_TOOLS.POINTER);
  const [drawings, setDrawings] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [fibonacciLevels, setFibonacciLevels] = useState(DEFAULT_FIBONACCI_LEVELS);
  const [showFibSettings, setShowFibSettings] = useState(false);
  const [allLineSeries, setAllLineSeries] = useState([]); // Track all created line series
  const [allPriceLines, setAllPriceLines] = useState([]); // Track created price lines (e.g., FVG)

  // Setup chart container reference
  useEffect(() => {
    if (chartContainer) {
      chartContainerRef.current = chartContainer;
    }
  }, [chartContainer]);

  // Setup drawing events exactly like charting exam
  useEffect(() => {
    if (!chartInstance || !candlestickSeries) return;

    const handleClick = (param) => {
      if (!param.time || activeTool === DRAWING_TOOLS.POINTER) return;
      
      const price = candlestickSeries.coordinateToPrice(param.point.y);
      if (!price) return;
      
      handlePointClick({ time: param.time, price });
    };

    chartInstance.subscribeClick(handleClick);

    return () => {
      chartInstance.unsubscribeClick(handleClick);
    };
  }, [chartInstance, candlestickSeries, activeTool, startPoint, drawings, chartData]);

  const handlePointClick = (point) => {
    if (activeTool === DRAWING_TOOLS.POINTER) return;
    
    // --- Swing-point is a single-click tool ---
    if (activeTool === DRAWING_TOOLS.SWING_POINT) {
      const enhanced = enhancePointSelection(point, chartData, 1, false);

      const candle = chartData.find(c => c.time === enhanced.time || (c.date && Math.floor(new Date(c.date).getTime()/1000) === enhanced.time));
      if (!candle) return;

      const mid = (candle.high + candle.low) / 2;
      const highThreshold = candle.high - (candle.high - candle.low) * 0.1;
      const lowThreshold  = candle.low  + (candle.high - candle.low) * 0.1;

      let pointType = enhanced.price >= highThreshold ? 'high' : enhanced.price <= lowThreshold ? 'low' : (enhanced.price >= mid ? 'high' : 'low');
      const pointPrice = pointType === 'high' ? candle.high : candle.low;

      // Prevent near-duplicate markers (same day & type & ~0.5% price)
      const isDupe = drawings.some(d => d.type === DRAWING_TOOLS.SWING_POINT && d.pointType === pointType && Math.abs(d.time - enhanced.time) < 86400 && Math.abs(d.price - pointPrice)/pointPrice < 0.005);
      if (isDupe) return;

      const newPoint = { id: Date.now(), type: DRAWING_TOOLS.SWING_POINT, time: enhanced.time, price: pointPrice, pointType };

      // Add marker
      const marker = {
        time: enhanced.time,
        position: pointType === 'high' ? 'aboveBar' : 'belowBar',
        color: pointType === 'high' ? '#4CAF50' : '#2196F3',
        shape: 'circle',
        size: 2,
        text: pointType.toUpperCase()
      };

      const existingMarkers = candlestickSeries.markers() || [];
      candlestickSeries.setMarkers([...existingMarkers, marker].sort((a,b)=>a.time-b.time));

      setDrawings(prev => {
        const updated = [...prev, newPoint];
        if (onDrawingUpdate) onDrawingUpdate(updated);
        return updated;
      });

      return; // swing-point handled
    }
    
    if (!startPoint) {
      const enhancedPoint = enhancePointSelection(point, chartData, 1, false);
      setStartPoint({
        time: enhancedPoint.time,
        price: enhancedPoint.price
      });
    } else {
      const enhancedPoint = enhancePointSelection(point, chartData, 1, true);
      let endTime = enhancedPoint.time;
      
      if (Math.abs(endTime - startPoint.time) < 60) {
        endTime = startPoint.time + 60;
      }
      
      const newDrawing = {
        id: Date.now(),
        type: activeTool,
        start: startPoint,
        end: {
          time: endTime,
          price: enhancedPoint.price
        }
      };
      
      createDrawingOnChart(newDrawing);
      setDrawings(prev => [...prev, newDrawing]);
      setStartPoint(null);
      
      if (onDrawingUpdate) {
        onDrawingUpdate([...drawings, newDrawing]);
      }
    }
  };

  const createDrawingOnChart = (drawing) => {
    if (!chartInstance || !candlestickSeries) return;

    const { type, start, end } = drawing;

    switch (type) {
      case DRAWING_TOOLS.FIBONACCI:
        createFibonacci(start, end);
        break;
      
      case DRAWING_TOOLS.TRENDLINE:
        createTrendline(start, end);
        break;
      
      case DRAWING_TOOLS.FVG:
        createFVGBox(start, end);
        break;
      
      case DRAWING_TOOLS.SWING_POINT:
        createSwingPoint(start);
        break;
    }
  };

  const createFibonacci = (start, end) => {
    // Determine direction so that 0 level is always at swing low for uptrend
    const priceRangeRaw = end.price - start.price;
    const isDescending = start.price > end.price; // user dragged high -> low
    const priceRange = Math.abs(priceRangeRaw);
    
    const createdSeries = []; // Track series created for this drawing
    
    // Calculate Fibonacci levels exactly like charting exam
    const fibLevels = fibonacciLevels
      .filter(fib => fib.visible)
      .map(fib => {
        // Switch non-key level colour depending on theme
        const baseColor = fib.isKey
          ? '#F0B90B' // already golden for key levels
          : (darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.55)');

        return {
          price: (isDescending ? end.price : start.price) + priceRange * fib.level,
          color: baseColor,
          lineWidth: fib.isKey ? 1.5 : 1,
          lineStyle: 0,
          title: `Fib ${fib.label}`
        };
      });

    // Create line series for each level exactly like charting exam
    fibLevels.forEach(level => {
      const lineSeries = chartInstance.addLineSeries({
        color: level.color,
        lineWidth: level.lineWidth,
        lineStyle: level.lineStyle,
        title: level.title,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false
      });
      
      let timePoint1 = start.time;
      let timePoint2 = end.time;
      
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
      createdSeries.push(lineSeries); // Track this series
    });

    // Store all created series for this Fibonacci drawing
    setAllLineSeries(prev => [...prev, ...createdSeries]);

    // Add markers for start and end points
    const markers = isDescending
      ? [
          // Start was a HIGH so place marker aboveBar
          {
            time: start.time,
            position: 'aboveBar',
            color: '#2196F3',
            shape: 'circle',
            size: 2,
            text: 'Start'
          },
          // End was a LOW so place marker belowBar
          {
            time: end.time,
            position: 'belowBar',
            color: '#4CAF50',
            shape: 'circle',
            size: 2,
            text: 'End'
          }
        ]
      : [
          // Upwards draw: start is low, marker belowBar
          {
            time: start.time,
            position: 'belowBar',
            color: '#2196F3',
            shape: 'circle',
            size: 2,
            text: 'Start'
          },
          // End is high, marker aboveBar
          {
            time: end.time,
            position: 'aboveBar',
            color: '#4CAF50',
            shape: 'circle',
            size: 2,
            text: 'End'
          }
        ];

    const existingMarkers = candlestickSeries.markers() || [];
    const allMarkers = [...existingMarkers, ...markers].sort((a, b) => a.time - b.time);
    
    // Handle time collisions
    for (let i = 1; i < allMarkers.length; i++) {
      if (allMarkers[i].time <= allMarkers[i-1].time) {
        allMarkers[i].time = allMarkers[i-1].time + 60;
      }
    }
    
    candlestickSeries.setMarkers(allMarkers);
  };

  const createTrendline = (start, end) => {
    const lineSeries = chartInstance.addLineSeries({
      color: darkMode ? '#00ff88' : '#2196F3',
      lineWidth: 2,
      lineStyle: 0,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false
    });

    lineSeries.setData([
      { time: start.time, value: start.price },
      { time: end.time, value: end.price }
    ]);

    // Track this series for removal
    setAllLineSeries(prev => [...prev, lineSeries]);
  };

  const createFVGBox = (start, end) => {
    if (!chartInstance || !candlestickSeries) return;

    // Order the times so left-to-right is guaranteed
    const [startTime, endTime] = start.time < end.time
      ? [start.time, end.time]
      : [end.time, start.time];

    // Determine vertical boundaries
    const topPrice = Math.max(start.price, end.price);
    const bottomPrice = Math.min(start.price, end.price);

    // Re-use colour scheme from exam component
    const color = darkMode ? 'rgba(0,255,136,0.8)' : 'rgba(33,150,243,0.8)';

    // Price-axis reference lines (for labels)
    const topPriceLine = candlestickSeries.createPriceLine({
      price: topPrice,
      color,
      lineWidth: 2,
      lineStyle: 1,
      axisLabelVisible: true,
      title: 'FVG Top'
    });

    const bottomPriceLine = candlestickSeries.createPriceLine({
      price: bottomPrice,
      color,
      lineWidth: 2,
      lineStyle: 1,
      axisLabelVisible: true,
      title: 'FVG Bottom'
    });

    // Horizontal segment lines limited to the user-selected window
    const topSeries = chartInstance.addLineSeries({
      color,
      lineWidth: 2,
      lineStyle: 0,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false
    });

    const bottomSeries = chartInstance.addLineSeries({
      color,
      lineWidth: 2,
      lineStyle: 0,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false
    });

    topSeries.setData([
      { time: startTime, value: topPrice },
      { time: endTime,   value: topPrice }
    ]);

    bottomSeries.setData([
      { time: startTime, value: bottomPrice },
      { time: endTime,   value: bottomPrice }
    ]);

    // Track for undo / clear
    setAllPriceLines(prev => [...prev, topPriceLine, bottomPriceLine]);
    setAllLineSeries(prev => [...prev, topSeries, bottomSeries]);

    // Add start / end markers so users can see their anchor candles
    const markers = [
      {
        time: startTime,
        position: 'inBar',
        color,
        shape: 'square',
        text: 'FVG Start'
      },
      {
        time: endTime,
        position: 'inBar',
        color,
        shape: 'square',
        text: 'FVG End'
      }
    ];

    const existing = candlestickSeries.markers() || [];
    candlestickSeries.setMarkers([...existing, ...markers].sort((a,b) => a.time - b.time));
  };

  const createSwingPoint = (point) => {
    // Not used anymore; logic is embedded in handlePointClick
  };

  const clearAllDrawings = () => {
    // Remove all line series
    allLineSeries.forEach(series => {
      try {
        chartInstance.removeSeries(series);
      } catch (error) {
        console.warn('Error removing series:', error);
      }
    });
    
    // Clear all markers
    if (candlestickSeries) {
      candlestickSeries.setMarkers([]);
    }
    
    // Reset state
    setDrawings([]);
    setAllLineSeries([]);
    setStartPoint(null);
    
    // Remove all tracked price lines
    allPriceLines.forEach(line => {
      try {
        candlestickSeries.removePriceLine(line);
      } catch (err) {
        console.warn('Error removing price line:', err);
      }
    });
    setAllPriceLines([]);
    
    if (onDrawingUpdate) {
      onDrawingUpdate([]);
    }
  };

  const undoLastDrawing = () => {
    if (drawings.length === 0) return;

    const lastDrawing = drawings[drawings.length - 1];
    
    // Calculate how many series to remove based on drawing type
    let seriesToRemove = 1; // Default for trendline
    if (lastDrawing.type === DRAWING_TOOLS.FIBONACCI) {
      seriesToRemove = fibonacciLevels.filter(fib => fib.visible).length;
    } else if (lastDrawing.type === DRAWING_TOOLS.FVG) {
      // Each FVG adds 2 price lines and 2 horizontal line series
      const priceLinesToDelete = allPriceLines.slice(-2);
      priceLinesToDelete.forEach(line => {
        try { candlestickSeries.removePriceLine(line); } catch (err) {}
      });
      setAllPriceLines(prev => prev.slice(0, -2));

      seriesToRemove = 2; // top & bottom horizontal segments
    } else if (lastDrawing.type === DRAWING_TOOLS.SWING_POINT) {
      // Remove last swing marker by rebuilding marker list without it
      const newDrawingsList = drawings.slice(0, -1);
      // rebuild candlestick markers
      const newMarkers = newDrawingsList.filter(d=>d.type===DRAWING_TOOLS.SWING_POINT).map(d=>({
        time: d.time,
        position: d.pointType==='high'?'aboveBar':'belowBar',
        color: d.pointType==='high'?'#4CAF50':'#2196F3',
        shape: 'circle',
        size:2,
        text: d.pointType.toUpperCase()
      })).sort((a,b)=>a.time-b.time);
      candlestickSeries.setMarkers(newMarkers);

      seriesToRemove = 0;
    }
    
    // Remove the last N series
    const seriesToDelete = seriesToRemove > 0 ? allLineSeries.slice(-seriesToRemove) : [];
    seriesToDelete.forEach(series => {
      try {
        chartInstance.removeSeries(series);
      } catch (error) {
        console.warn('Error removing series:', error);
      }
    });
    
    // Update state
    if(seriesToRemove>0){
      setAllLineSeries(prev => prev.slice(0, -seriesToRemove));
    }

    setDrawings(prev => {
      const newDrawings = prev.slice(0, -1);
      if (onDrawingUpdate) {
        onDrawingUpdate(newDrawings);
      }
      return newDrawings;
    });
  };

  // Update levels from settings panel
  const handleFibLevelsChange = (newLevels) => {
    setFibonacciLevels(newLevels);

    // Re-draw existing fibs so visibility updates immediately
    const visibleSeriesCount = allLineSeries.length;
    if (visibleSeriesCount > 0) {
      allLineSeries.forEach(s => {
        try { chartInstance.removeSeries(s); } catch (e) {}
      });
      setAllLineSeries([]);
      drawings.forEach(d => createFibonacci(d.start, d.end));
    }
  };

  const toolButtons = [
    { type: DRAWING_TOOLS.POINTER, icon: FaMousePointer, label: 'Select' },
    { type: DRAWING_TOOLS.TRENDLINE, icon: FaRuler, label: 'Trendline' },
    { type: DRAWING_TOOLS.FIBONACCI, icon: FaPencilAlt, label: 'Fibonacci' },
    { type: DRAWING_TOOLS.FVG, icon: FaSquare, label: 'FVG Box' },
    { type: DRAWING_TOOLS.SWING_POINT, icon: FaCircle, label: 'Swing Point' }
  ];

  return (
    <>
      {/* Drawing Toolbar */}
      <div 
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '5px',
          padding: '8px',
          backgroundColor: darkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
          borderRadius: '8px',
          border: `1px solid ${darkMode ? '#333' : '#ddd'}`,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}
      >
        {toolButtons.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            onClick={() => setActiveTool(type)}
            title={label}
            style={{
              padding: '8px 12px',
              backgroundColor: activeTool === type 
                ? '#00ff88' 
                : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
              color: activeTool === type 
                ? '#000' 
                : (darkMode ? '#e0e0e0' : '#333'),
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Icon /> {label}
          </button>
        ))}
        
        <div style={{ width: '1px', height: '30px', backgroundColor: darkMode ? '#333' : '#ddd', margin: '0 5px' }} />
        
        <button
          onClick={undoLastDrawing}
          disabled={drawings.length === 0}
          title="Undo Last"
          style={{
            padding: '8px',
            backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            color: drawings.length === 0 ? '#666' : (darkMode ? '#e0e0e0' : '#333'),
            border: 'none',
            borderRadius: '4px',
            cursor: drawings.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          <FaUndo />
        </button>
        
        <button
          onClick={clearAllDrawings}
          disabled={drawings.length === 0}
          title="Clear All"
          style={{
            padding: '8px',
            backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            color: drawings.length === 0 ? '#666' : '#ff4757',
            border: 'none',
            borderRadius: '4px',
            cursor: drawings.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          <FaTrash />
        </button>

        {/* Gear icon only relevant for Fibonacci mode */}
        <button
          onClick={() => setShowFibSettings(prev=>!prev)}
          title="Fibonacci Settings"
          style={{
            padding:'8px',
            backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            color: activeTool===DRAWING_TOOLS.FIBONACCI ? (darkMode?'#00ff88':'#2196F3') : (darkMode? '#e0e0e0':'#333'),
            border:'none',
            borderRadius:'4px',
            cursor: activeTool===DRAWING_TOOLS.FIBONACCI ? 'pointer':'not-allowed',
            fontSize:'14px'
          }}
          disabled={activeTool!==DRAWING_TOOLS.FIBONACCI}
        >
          <FaCog />
        </button>
      </div>

      {/* Drawing status indicator */}
      {activeTool !== DRAWING_TOOLS.POINTER && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            zIndex: 20,
            padding: '8px 12px',
            backgroundColor: darkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
            border: `1px solid ${darkMode ? '#333' : '#ddd'}`,
            borderRadius: '6px',
            fontSize: '12px',
            color: darkMode ? '#e0e0e0' : '#333'
          }}
        >
          🎨 {activeTool} mode | {startPoint ? 'Click to finish' : 'Click to start'}
        </div>
      )}

      {/* Settings panel */}
      {showFibSettings && activeTool===DRAWING_TOOLS.FIBONACCI && (
        <div style={{position:'absolute', top:'60px', right:'10px', zIndex:30, width:'260px', maxHeight:'360px', overflowY:'auto', borderRadius:'8px'}}>
          <FibonacciSettings 
            isDarkMode={darkMode}
            levels={fibonacciLevels}
            onLevelsChange={handleFibLevelsChange}
          />
        </div>
      )}
    </>
  );
};

export default SandboxDrawingTools;