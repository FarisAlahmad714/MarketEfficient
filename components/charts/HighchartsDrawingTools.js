// components/charts/HighchartsDrawingTools.js
import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import AnnotationsModule from 'highcharts/modules/annotations';

// Drawing tools types
const TOOL_TYPES = {
  POINTER: 'pointer',
  TRENDLINE: 'trendline',
  SWING_POINT: 'swingPoint',
  FIBONACCI: 'fibonacci',
  FVG: 'fvg', // Fair Value Gap
  ZOOM_IN: 'zoomIn',
  ZOOM_OUT: 'zoomOut',
  RESET_ZOOM: 'resetZoom'
};

// State indicator component
const DrawingStateIndicator = ({ isDrawing, activeTool, darkMode, startPoint }) => {
  if (!isDrawing) return null;
  
  let message = '';
  switch (activeTool) {
    case TOOL_TYPES.TRENDLINE:
      message = 'Click again to complete the trendline';
      break;
    case TOOL_TYPES.FIBONACCI:
      message = 'Click again to place the Fibonacci retracement';
      break;
    case TOOL_TYPES.FVG:
      message = 'Click again to create the Fair Value Gap';
      break;
    default:
      message = 'Click to complete drawing';
  }
  
  return (
    <div style={{
      position: 'absolute',
      top: '60px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: darkMode ? 'rgba(33,150,243,0.8)' : 'rgba(33,150,243,0.9)',
      color: 'white',
      padding: '8px 15px',
      borderRadius: '4px',
      fontWeight: 'bold',
      zIndex: 1000,
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      pointerEvents: 'none'
    }}>
      <i className="fas fa-info-circle" />
      {message}
      {startPoint && (
        <span style={{ marginLeft: '5px', fontSize: '0.9em', opacity: 0.8 }}>
          (Started at {new Date(startPoint.x).toLocaleTimeString()}, ${startPoint.y.toFixed(2)})
        </span>
      )}
    </div>
  );
};

// Component to render the toolbar
const DrawingToolbar = ({ activeTool, onToolSelect, onClearAll, darkMode }) => {
  const buttonStyle = (isActive) => ({
    padding: '8px 12px',
    marginRight: '8px',
    backgroundColor: isActive 
      ? (darkMode ? '#2196F3' : '#2196F3') 
      : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
    color: isActive 
      ? 'white' 
      : (darkMode ? '#e0e0e0' : '#333'),
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: isActive ? 'bold' : 'normal',
    transition: 'all 0.2s ease'
  });

  return (
    <div style={{
      padding: '10px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '5px',
      backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.9)',
      borderRadius: '8px',
      boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '10px'
    }}>
      {/* Navigation Tools */}
      <button 
        style={buttonStyle(activeTool === TOOL_TYPES.POINTER)}
        onClick={() => onToolSelect(TOOL_TYPES.POINTER)}
      >
        <i className="fas fa-mouse-pointer" style={{ marginRight: '5px' }}></i>
        Pointer
      </button>
      <button 
        style={buttonStyle(activeTool === TOOL_TYPES.ZOOM_IN)}
        onClick={() => onToolSelect(TOOL_TYPES.ZOOM_IN)}
      >
        <i className="fas fa-search-plus" style={{ marginRight: '5px' }}></i>
        Zoom In
      </button>
      <button 
        style={buttonStyle(activeTool === TOOL_TYPES.ZOOM_OUT)}
        onClick={() => onToolSelect(TOOL_TYPES.ZOOM_OUT)}
      >
        <i className="fas fa-search-minus" style={{ marginRight: '5px' }}></i>
        Zoom Out
      </button>
      <button 
        style={buttonStyle(activeTool === TOOL_TYPES.RESET_ZOOM)}
        onClick={() => onToolSelect(TOOL_TYPES.RESET_ZOOM)}
      >
        <i className="fas fa-expand" style={{ marginRight: '5px' }}></i>
        Reset View
      </button>

      <div style={{
        height: '24px',
        width: '1px',
        backgroundColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
        margin: '0 8px'
      }}></div>

      {/* Drawing Tools */}
      <button 
        style={buttonStyle(activeTool === TOOL_TYPES.TRENDLINE)}
        onClick={() => onToolSelect(TOOL_TYPES.TRENDLINE)}
      >
        <i className="fas fa-chart-line" style={{ marginRight: '5px' }}></i>
        Trendline
      </button>
      <button 
        style={buttonStyle(activeTool === TOOL_TYPES.SWING_POINT)}
        onClick={() => onToolSelect(TOOL_TYPES.SWING_POINT)}
      >
        <i className="fas fa-dot-circle" style={{ marginRight: '5px' }}></i>
        Swing Point
      </button>
      <button 
        style={buttonStyle(activeTool === TOOL_TYPES.FIBONACCI)}
        onClick={() => onToolSelect(TOOL_TYPES.FIBONACCI)}
      >
        <i className="fas fa-ruler-horizontal" style={{ marginRight: '5px' }}></i>
        Fibonacci
      </button>
      <button 
        style={buttonStyle(activeTool === TOOL_TYPES.FVG)}
        onClick={() => onToolSelect(TOOL_TYPES.FVG)}
      >
        <i className="fas fa-square" style={{ marginRight: '5px' }}></i>
        FVG
      </button>
      
      <div style={{ flex: 1 }}></div>
      
      <button 
        style={{
          padding: '8px 12px',
          backgroundColor: darkMode ? '#F44336' : '#ffebee',
          color: darkMode ? 'white' : '#d32f2f',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.9rem'
        }}
        onClick={onClearAll}
      >
        <i className="fas fa-trash-alt" style={{ marginRight: '5px' }}></i>
        Clear All
      </button>
    </div>
  );
};

// Main HighchartsDrawingTools component
const HighchartsDrawingTools = ({ 
  chart, 
  examConfig = null ,
  onDrawingComplete = null,
  onDrawingChange = null
}) => {
  const { darkMode } = useContext(ThemeContext);
  const [activeTool, setActiveTool] = useState(TOOL_TYPES.POINTER);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawings, setDrawings] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [chartReady, setChartReady] = useState(false);

  // Utility function to help with coordinate conversion
  const getPixelCoordinates = (dataX, dataY) => {
    if (!chart || !chart.xAxis || !chart.yAxis) {
      return null;
    }
    
    try {
      const xAxis = chart.xAxis[0];
      const yAxis = chart.yAxis[0];
      
      const pixelX = xAxis.toPixels(dataX);
      const pixelY = yAxis.toPixels(dataY);
      
      return { x: pixelX, y: pixelY };
    } catch (err) {
      console.error("Error converting coordinates:", err);
      return null;
    }
  };

  // Effect to monitor chart instance changes
  useEffect(() => {
    if (!chart) return;
    
    console.log("Chart instance received in drawing tools:", chart);
    
    // Wait for the chart to be fully initialized
    const checkChartReady = () => {
      // Make sure chart has critical properties
      if (chart && chart.series && chart.series.length > 0 && 
          chart.xAxis && chart.xAxis.length > 0 && 
          chart.yAxis && chart.yAxis.length > 0) {
        console.log("Chart is fully initialized and ready for drawing tools");
        setChartReady(true);
        
        // Make sure annotations array exists
        if (!chart.annotations) {
          chart.annotations = [];
        }
        
        return true;
      }
      return false;
    };
    
    // Try checking immediately
    if (!checkChartReady()) {
      // If not ready, set a timeout to check again
      const timer = setTimeout(() => {
        checkChartReady();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [chart]);

  // Effect to handle tool changes
  useEffect(() => {
    if (!chartReady || !chart) return;
    
    // Special handling for zoom tools which are immediate actions
    if (activeTool === TOOL_TYPES.ZOOM_IN) {
      handleZoomIn();
      // Reset back to pointer tool after zooming
      setActiveTool(TOOL_TYPES.POINTER);
      return;
    } else if (activeTool === TOOL_TYPES.ZOOM_OUT) {
      handleZoomOut();
      // Reset back to pointer tool after zooming
      setActiveTool(TOOL_TYPES.POINTER);
      return;
    } else if (activeTool === TOOL_TYPES.RESET_ZOOM) {
      handleResetZoom();
      // Reset back to pointer tool after resetting
      setActiveTool(TOOL_TYPES.POINTER);
      return;
    }
    
    updateChartInteraction(activeTool);
  }, [activeTool, chartReady, chart]);

  // Helper function to update chart interaction based on active tool
  const updateChartInteraction = (tool) => {
    if (!chartReady || !chart) {
      console.error('Chart not ready or not available');
      return;
    }
    
    console.log(`Updating chart interaction for tool: ${tool}`);
    
    try {
      // Enable chart pointer events based on the selected tool
      if (tool === TOOL_TYPES.POINTER) {
        console.log('Enabling standard pointer interactions');
        
        // Remove click event handlers if they exist
        if (chart.container) {
          console.log('Removing click handler from chart container');
          chart.container.onclick = null;
        }
        
        // Enable normal chart interactions with zoomType
        chart.update({
          chart: {
            zoomType: 'xy'
          }
        }, false);
        chart.redraw();
      } else {
        console.log(`Setting up drawing tool: ${tool}`);
        
        // For drawing tools, disable chart zoom
        chart.update({
          chart: {
            zoomType: null
          }
        }, false);
        chart.redraw();
        
        // IMPORTANT: Add debugging to find the chart container
        if (!chart.container) {
          console.error('Chart container not found!');
          
          // Try to find it anyway
          const chartDiv = document.querySelector('.highcharts-container');
          if (chartDiv) {
            console.log('Found chart container via querySelector');
            chart.container = chartDiv;
          } else {
            console.error('Could not find chart container with any method');
            return;
          }
        } else {
          console.log('Chart container found:', chart.container);
        }
        
        // Create a wrapped click handler with debugging
        const clickHandler = function(e) {
          console.log(`Chart clicked with tool: ${tool}`);
          e.preventDefault();
          e.stopPropagation();
          handleChartContainerClick(e, tool);
        };
        
        // CRITICAL: Make sure existing handler is removed first
        if (chart.container.onclick) {
          chart.container.onclick = null;
        }
        
        // Directly attach listener to ensure it works
        chart.container.addEventListener('click', clickHandler);
        
        console.log(`Click handler attached for tool: ${tool}`);
        
        // Show visual feedback that drawing mode is active
        chart.container.style.cursor = 'crosshair';
      }
    } catch (err) {
      console.error("Error updating chart interaction:", err);
    }
  };

  // Handler when a tool is selected
  const handleToolSelect = (tool) => {
    console.log("Tool selected:", tool);
    setActiveTool(tool);
    
    // If switching to pointer tool when drawing, cancel drawing
    if (tool === TOOL_TYPES.POINTER && isDrawing) {
      setIsDrawing(false);
      setStartPoint(null);
    }
  };

  // Zoom control handlers
  const handleZoomIn = () => {
    if (!chart || !chart.xAxis || !chart.yAxis) return;
    try {
      // Get the current extremes
      const xAxis = chart.xAxis[0];
      const yAxis = chart.yAxis[0];
      
      const xMin = xAxis.getExtremes().min;
      const xMax = xAxis.getExtremes().max;
      const yMin = yAxis.getExtremes().min;
      const yMax = yAxis.getExtremes().max;
      
      // Calculate new ranges (zoom in by 20%)
      const xRange = xMax - xMin;
      const yRange = yMax - yMin;
      const newXMin = xMin + xRange * 0.1;
      const newXMax = xMax - xRange * 0.1;
      const newYMin = yMin + yRange * 0.1;
      const newYMax = yMax - yRange * 0.1;
      
      // Set new extremes
      xAxis.setExtremes(newXMin, newXMax);
      yAxis.setExtremes(newYMin, newYMax);
    } catch (err) {
      console.error("Error zooming in:", err);
    }
  };
  
  const handleZoomOut = () => {
    if (!chart || !chart.xAxis || !chart.yAxis) return;
    try {
      // Get the current extremes
      const xAxis = chart.xAxis[0];
      const yAxis = chart.yAxis[0];
      
      const xMin = xAxis.getExtremes().min;
      const xMax = xAxis.getExtremes().max;
      const yMin = yAxis.getExtremes().min;
      const yMax = yAxis.getExtremes().max;
      
      // Calculate new ranges (zoom out by 20%)
      const xRange = xMax - xMin;
      const yRange = yMax - yMin;
      const newXMin = xMin - xRange * 0.125;
      const newXMax = xMax + xRange * 0.125;
      const newYMin = yMin - yRange * 0.125;
      const newYMax = yMax + yRange * 0.125;
      
      // Set new extremes
      xAxis.setExtremes(newXMin, newXMax);
      yAxis.setExtremes(newYMin, newYMax);
    } catch (err) {
      console.error("Error zooming out:", err);
    }
  };
  
  const handleResetZoom = () => {
    if (!chart) return;
    try {
      if (chart.zoomOut) {
        chart.zoomOut();
      } else {
        // Alternative approach
        chart.xAxis[0].setExtremes(null, null);
        chart.yAxis[0].setExtremes(null, null);
      }
    } catch (err) {
      console.error("Error resetting zoom:", err);
    }
  };

  // Handle click directly on chart container
  const handleChartContainerClick = (event, tool) => {
    console.log(`Chart container clicked. Tool: ${tool}`, event);
    
    if (!chart) {
      console.error('Chart instance not available');
      return;
    }
    
    if (!chart.xAxis || !chart.yAxis) {
      console.error('Chart axes not available');
      return;
    }
    
    // Check if addAnnotation method exists
    if (typeof chart.addAnnotation !== 'function') {
      console.error('addAnnotation method not available on chart instance');
      
      // Try to reinitialize annotations
      try {
        console.log('Attempting to reinitialize annotations module');
        if (typeof Highcharts === 'object') {
          AnnotationsModule(Highcharts);
          
          // Add basic implementation if still missing
          if (typeof chart.addAnnotation !== 'function') {
            chart.annotations = chart.annotations || [];
            chart.addAnnotation = function(options) {
              console.log('Using manual addAnnotation implementation:', options);
              this.annotations.push(options);
              this.redraw();
            };
          }
        }
      } catch (err) {
        console.error('Failed to reinitialize annotations:', err);
      }
      
      if (typeof chart.addAnnotation !== 'function') {
        console.error('Still unable to initialize addAnnotation method');
        return;
      }
    }
    
    try {
      // Get chart position - IMPROVED VERSION
      const chartRect = chart.container.getBoundingClientRect();
      console.log('Chart rectangle:', chartRect);
      
      // Calculate relative position within chart
      const chartX = event.clientX - chartRect.left;
      const chartY = event.clientY - chartRect.top;
      console.log(`Click at chart-relative coordinates: x=${chartX}, y=${chartY}`);
      
      // Convert to chart coordinates
      let xValue, yValue;
      
      // Multiple conversion approaches for redundancy
      try {
        if (chart.pointer && chart.pointer.normalize) {
          // Method 1: Use chart's pointer normalize
          const chartPosition = chart.pointer.normalize(event);
          xValue = chart.xAxis[0].toValue(chartPosition.chartX);
          yValue = chart.yAxis[0].toValue(chartPosition.chartY);
          console.log('Coordinates via pointer.normalize:', { x: xValue, y: yValue });
        } else {
          throw new Error('chart.pointer.normalize not available');
        }
      } catch (err) {
        console.warn('Using fallback coordinate conversion:', err.message);
        
        // Method 2: Manual conversion 
        // Adjust for chart plot area position
        const plotLeft = chart.plotLeft || 0;
        const plotTop = chart.plotTop || 0;
        
        console.log('Plot area offset:', { plotLeft, plotTop });
        
        // Calculate click position relative to plot area
        const plotX = chartX - plotLeft;
        const plotY = chartY - plotTop;
        
        // Convert from pixels to data values
        try {
          xValue = chart.xAxis[0].toValue(plotX);
          yValue = chart.yAxis[0].toValue(plotY);
          console.log('Coordinates via manual conversion:', { x: xValue, y: yValue });
        } catch (convErr) {
          console.error('Error in manual coordinate conversion:', convErr);
          return;
        }
      }
      
      console.log(`Final converted coordinates: x=${xValue}, y=${yValue} with tool=${tool}`);
      
      // Process click based on tool type
      if (tool === TOOL_TYPES.SWING_POINT) {
        // Swing points only require a single click
        console.log('Adding swing point at', { x: xValue, y: yValue });
        addSwingPoint({ x: xValue, y: yValue });
      } else if (!isDrawing) {
        // First click for other tools - start drawing
        console.log('Starting drawing from', { x: xValue, y: yValue });
        setStartPoint({ x: xValue, y: yValue });
        setIsDrawing(true);
      } else {
        // Second click - complete drawing
        console.log('Completing drawing to', { x: xValue, y: yValue });
        const endPoint = { x: xValue, y: yValue };
        
        // Create different annotation types based on the active tool
        switch (tool) {
          case TOOL_TYPES.TRENDLINE:
            addTrendline(startPoint, endPoint);
            break;
          case TOOL_TYPES.FIBONACCI:
            addFibonacciRetracement(startPoint, endPoint);
            break;
          case TOOL_TYPES.FVG:
            addFairValueGap(startPoint, endPoint);
            break;
          default:
            console.warn(`No handler for tool type: ${tool}`);
            break;
        }
        
        // Reset drawing state
        setIsDrawing(false);
        setStartPoint(null);
      }
    } catch (err) {
      console.error("Error handling chart click:", err);
    }
  };

  // Add a trendline annotation
  const addTrendline = (start, end) => {
    if (!chart) {
      console.error('Chart instance not available');
      return;
    }
    
    console.log(`Adding trendline from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
    
    try {
      const id = `trendline-${Date.now()}`;
      
      // Always use manual rendering for reliability
      console.log('Using direct manual rendering for trendline');
      
      // Get axes
      const xAxis = chart.xAxis[0];
      const yAxis = chart.yAxis[0];
      
      if (!xAxis || !yAxis) {
        console.error('Chart axes not available');
        return;
      }
      
      // Convert data coordinates to pixel coordinates
      const x1 = xAxis.toPixels(start.x);
      const y1 = yAxis.toPixels(start.y);
      const x2 = xAxis.toPixels(end.x);
      const y2 = yAxis.toPixels(end.y);
      
      console.log('Rendering line at pixels:', { x1, y1, x2, y2 });
      
      // Draw the line with high zIndex
      const line = chart.renderer.path(['M', x1, y1, 'L', x2, y2])
        .attr({
          'stroke-width': 2,
          stroke: '#3f51b5',
          zIndex: 1000,
          dashStyle: 'Solid'
        })
        .add();
      
      // Add slope and distance labels
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const slope = dy / dx;
      const priceChange = end.y - start.y;
      const percentChange = (priceChange / start.y * 100).toFixed(2);
      
      // Place label at the midpoint of the line
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      
      const label = chart.renderer.text(
        `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)} (${percentChange}%)`, 
        midX, 
        midY - 10
      )
      .attr({
        align: 'center',
        zIndex: 1000
      })
      .css({
        color: priceChange >= 0 ? '#4CAF50' : '#F44336',
        fontSize: '12px',
        fontWeight: 'bold'
      })
      .add();
      
      // Add background to make text readable
      const box = label.getBBox();
      const labelBackground = chart.renderer.rect(box.x - 3, box.y - 3, box.width + 6, box.height + 6, 2)
        .attr({
          fill: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
          stroke: priceChange >= 0 ? '#4CAF50' : '#F44336',
          'stroke-width': 1,
          zIndex: 999
        })
        .add();
      
      // Move label to front
      label.toFront();
      
      console.log('Manual rendering successful');
      
      // Add to local state
      const newDrawing = {
        id,
        type: TOOL_TYPES.TRENDLINE,
        points: [start, end],
        elements: [line, label, labelBackground] // Store for potential removal later
      };
      
      updateDrawings(newDrawing);
    } catch (err) {
      console.error("Error adding trendline:", err);
    }
  };
  

  const renderManualTrendline = (start, end) => {
    console.log('Attempting manual trendline rendering');
    
    try {
      if (!chart || !chart.renderer) {
        console.error('Chart renderer not available');
        return false;
      }
      
      // Get axes
      const xAxis = chart.xAxis[0];
      const yAxis = chart.yAxis[0];
      
      if (!xAxis || !yAxis) {
        console.error('Chart axes not available');
        return false;
      }
      
      // Convert data coordinates to pixel coordinates
      const x1 = xAxis.toPixels(start.x);
      const y1 = yAxis.toPixels(start.y);
      const x2 = xAxis.toPixels(end.x);
      const y2 = yAxis.toPixels(end.y);
      
      console.log('Rendering line at pixels:', { x1, y1, x2, y2 });
      
      // Draw the line
      const line = chart.renderer.path(['M', x1, y1, 'L', x2, y2])
        .attr({
          'stroke-width': 2,
          stroke: '#3f51b5',
          zIndex: 5
        })
        .add();
      
      console.log('Manual rendering successful');
      return true;
    } catch (renderError) {
      console.error('Error in manual rendering:', renderError);
      return false;
    }
  };
  
  // Add a swing point annotation
  const addSwingPoint = (point) => {
    if (!chart) {
      console.error('Chart instance not available');
      return;
    }
    
    console.log(`Adding swing point at (${point.x}, ${point.y})`);
    
    try {
      const id = `swingPoint-${Date.now()}`;
      
      // IMPORTANT: Always use the manual rendering approach since it's more reliable
      console.log('Using direct manual rendering for swing point');
      
      // Get axes
      const xAxis = chart.xAxis[0];
      const yAxis = chart.yAxis[0];
      
      if (!xAxis || !yAxis) {
        console.error('Chart axes not available');
        return;
      }
      
      // Convert data coordinates to pixel coordinates
      const x = xAxis.toPixels(point.x);
      const y = yAxis.toPixels(point.y);
      
      console.log('Rendering circle at pixels:', { x, y });
      
      // Draw the circle with high zIndex to ensure visibility
      const circle = chart.renderer.circle(x, y, 6)
        .attr({
          fill: '#4CAF50',
          stroke: '#2E7D32',
          'stroke-width': 2,
          zIndex: 1000 // Very high zIndex to ensure it's on top
        })
        .add();
      
      // Add label above the point
      const label = chart.renderer.text(`${point.y.toFixed(2)}`, x, y - 15)
        .attr({
          align: 'center',
          zIndex: 1000
        })
        .css({
          color: '#4CAF50',
          fontSize: '12px',
          fontWeight: 'bold'
        })
        .add();
      
      // Add background to make text readable
      const box = label.getBBox();
      const labelBackground = chart.renderer.rect(box.x - 3, box.y - 3, box.width + 6, box.height + 6, 2)
        .attr({
          fill: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
          stroke: '#4CAF50',
          'stroke-width': 1,
          zIndex: 999 // Just below the text
        })
        .add();
      
      // Move label to front
      label.toFront();
      
      console.log('Manual rendering successful');
      
      // Add to local state
      const newDrawing = {
        id,
        type: TOOL_TYPES.SWING_POINT,
        points: [point],
        elements: [circle, label, labelBackground] // Store for potential removal later
      };
      
      updateDrawings(newDrawing);
    } catch (err) {
      console.error("Error adding swing point:", err);
    }
  };
  

  const renderManualSwingPoint = (point) => {
    console.log('Attempting manual swing point rendering');
    
    try {
      if (!chart || !chart.renderer) {
        console.error('Chart renderer not available');
        return false;
      }
      
      // Get axes
      const xAxis = chart.xAxis[0];
      const yAxis = chart.yAxis[0];
      
      if (!xAxis || !yAxis) {
        console.error('Chart axes not available');
        return false;
      }
      
      // Convert data coordinates to pixel coordinates
      const x = xAxis.toPixels(point.x);
      const y = yAxis.toPixels(point.y);
      
      console.log('Rendering circle at pixels:', { x, y });
      
      // Draw the circle
      const circle = chart.renderer.circle(x, y, 6)
        .attr({
          fill: '#4CAF50',
          stroke: '#2E7D32',
          'stroke-width': 2,
          zIndex: 5
        })
        .add();
      
      console.log('Manual rendering successful');
      return true;
    } catch (renderError) {
      console.error('Error in manual rendering:', renderError);
      return false;
    }
  };

  // Add a Fibonacci retracement annotation
  const addFibonacciRetracement = (start, end) => {
    if (!chart) {
      console.error('Chart instance not available');
      return;
    }
    
    console.log(`Adding Fibonacci retracement from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
    
    try {
      const id = `fibonacci-${Date.now()}`;
      
      // Always use manual rendering for reliability
      console.log('Using direct manual rendering for Fibonacci');
      
      // Get axes
      const xAxis = chart.xAxis[0];
      const yAxis = chart.yAxis[0];
      
      if (!xAxis || !yAxis) {
        console.error('Chart axes not available');
        return;
      }
      
      // Convert data coordinates to pixel coordinates
      const x1 = xAxis.toPixels(start.x);
      const y1 = yAxis.toPixels(start.y);
      const x2 = xAxis.toPixels(end.x);
      const y2 = yAxis.toPixels(end.y);
      
      // Fibonacci levels: 0, 0.236, 0.382, 0.5, 0.618, 0.786, 1
      const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
      const colors = ["#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688"];
      
      // Calculate the price range
      const priceRange = end.y - start.y;
      
      // Create elements array to store all rendered elements
      const elements = [];
      
      // Draw the main trend line
      const mainLine = chart.renderer.path(['M', x1, y1, 'L', x2, y2])
        .attr({
          'stroke-width': 2,
          stroke: '#9C27B0',
          zIndex: 1000
        })
        .add();
      
      elements.push(mainLine);
      
      // Create lines and labels for each Fibonacci level
      levels.forEach((level, i) => {
        const levelPrice = start.y + priceRange * level;
        const levelY = yAxis.toPixels(levelPrice);
        
        // Draw horizontal line for this level
        const line = chart.renderer.path(['M', x1, levelY, 'L', x2, levelY])
          .attr({
            'stroke-width': 1,
            stroke: colors[i],
            zIndex: 1000,
            dashStyle: 'Dash'
          })
          .add();
        
        elements.push(line);
        
        // Add label for this level
        const label = chart.renderer.text(
          `${level.toFixed(3)} - ${levelPrice.toFixed(2)}`, 
          x2 + 5, 
          levelY + 4
        )
        .attr({
          align: 'left',
          zIndex: 1000
        })
        .css({
          color: colors[i],
          fontSize: '11px',
          fontWeight: 'bold'
        })
        .add();
        
        elements.push(label);
        
        // Add background for label
        const box = label.getBBox();
        const labelBackground = chart.renderer.rect(box.x - 2, box.y - 2, box.width + 4, box.height + 4, 2)
          .attr({
            fill: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
            zIndex: 999
          })
          .add();
        
        elements.push(labelBackground);
        
        // Move label to front
        label.toFront();
      });
      
      console.log('Manual rendering successful');
      
      // Add to local state
      const newDrawing = {
        id,
        type: TOOL_TYPES.FIBONACCI,
        points: [start, end],
        elements: elements // Store all elements for potential removal later
      };
      
      updateDrawings(newDrawing);
    } catch (err) {
      console.error("Error adding Fibonacci retracement:", err);
    }
  };
  
  const addFairValueGap = (start, end) => {
    if (!chart) {
      console.error('Chart instance not available');
      return;
    }
    
    console.log(`Adding FVG from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
    
    try {
      const id = `fvg-${Date.now()}`;
      
      // Always use manual rendering for reliability
      console.log('Using direct manual rendering for FVG');
      
      // Get axes
      const xAxis = chart.xAxis[0];
      const yAxis = chart.yAxis[0];
      
      if (!xAxis || !yAxis) {
        console.error('Chart axes not available');
        return;
      }
      
      // Convert data coordinates to pixel coordinates
      const x1 = xAxis.toPixels(start.x);
      const y1 = yAxis.toPixels(start.y);
      const x2 = xAxis.toPixels(end.x);
      const y2 = yAxis.toPixels(end.y);
      
      // Get the min/max values for the rectangle
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      
      // Draw the rectangle
      const rect = chart.renderer.rect(minX, minY, maxX - minX, maxY - minY)
        .attr({
          fill: 'rgba(255, 152, 0, 0.2)',
          stroke: '#EF6C00',
          'stroke-width': 1,
          zIndex: 990 // Below other elements but still visible
        })
        .add();
      
      // Add FVG label in the center
      const centerX = minX + (maxX - minX) / 2;
      const centerY = minY + (maxY - minY) / 2;
      
      const label = chart.renderer.text('FVG', centerX, centerY)
        .attr({
          align: 'center',
          zIndex: 1000
        })
        .css({
          color: '#EF6C00',
          fontSize: '14px',
          fontWeight: 'bold'
        })
        .add();
      
      // Center the label (adjust position based on text size)
      const box = label.getBBox();
      label.attr({
        x: centerX - box.width / 2,
        y: centerY + box.height / 4
      });
      
      console.log('Manual rendering successful');
      
      // Add to local state
      const newDrawing = {
        id,
        type: TOOL_TYPES.FVG,
        points: [start, end],
        elements: [rect, label] // Store for potential removal later
      };
      
      updateDrawings(newDrawing);
    } catch (err) {
      console.error("Error adding FVG:", err);
    }
  };

  // Update the local drawings array and notify parent
  // Updated updateDrawings function to properly track elements
// In HighchartsDrawingTools.js - Fix the updateDrawings function
// Update the local drawings array and notify parent
const updateDrawings = (newDrawing) => {
  try {
    // Add the new drawing to the existing drawings
    const updatedDrawings = [...drawings, newDrawing];
    setDrawings(updatedDrawings);
    
    // Notify parent component
    if (onDrawingChange) {
      onDrawingChange(updatedDrawings);
    }
    
    // Notify on completion if handler exists
    if (onDrawingComplete) {
      onDrawingComplete(newDrawing);
    }
    
    console.log(`Drawing updated: ${newDrawing.type}`);
  } catch (error) {
    console.error('Error updating drawings:', error);
  }
};
  // Clear all annotations
  const handleClearAll = () => {
    if (!chart) return;
    
    try {
      console.log('Clearing all drawings, current count:', drawings.length);
      
      // Remove all manually rendered elements
      drawings.forEach(drawing => {
        if (drawing.elements && Array.isArray(drawing.elements)) {
          drawing.elements.forEach(element => {
            if (element && typeof element.destroy === 'function') {
              try {
                console.log(`Destroying element for ${drawing.type}`);
                element.destroy();
              } catch (e) {
                console.warn('Error destroying element:', e);
              }
            }
          });
        } else {
          console.log(`Drawing ${drawing.id} has no elements array`);
        }
      });
      
      // Force a redraw of the chart to ensure elements are removed
      if (chart.redraw) {
        chart.redraw();
      }
      
      // Clear local state
      setDrawings([]);
      
      // Notify parent component
      if (onDrawingChange) {
        onDrawingChange([]);
      }
      
      console.log('All drawings cleared');
    } catch (err) {
      console.error("Error clearing drawings:", err);
    }
  };
  

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <DrawingToolbar
        activeTool={activeTool}
        onToolSelect={handleToolSelect}
        onClearAll={handleClearAll}
        darkMode={darkMode}
      />
      
      {/* Drawing state indicator (New component) */}
      <DrawingStateIndicator 
        isDrawing={isDrawing} 
        activeTool={activeTool} 
        darkMode={darkMode} 
        startPoint={startPoint}
      />
      
      {!chartReady && (
        <div style={{
          padding: '10px 15px',
          backgroundColor: darkMode ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
          borderRadius: '4px',
          marginBottom: '15px',
          color: darkMode ? '#ffcc80' : '#e65100',
          border: `1px solid ${darkMode ? '#e65100' : '#ffe0b2'}`
        }}>
          <p style={{ margin: 0 }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
            Initializing chart tools...
          </p>
        </div>
      )}
      
      {/* Existing isDrawing message (can be removed since we have the new indicator) */}
      {false && isDrawing && (
        <div style={{
          padding: '10px 15px',
          backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
          borderRadius: '4px',
          marginBottom: '15px',
          color: darkMode ? '#90caf9' : '#1976d2',
          border: `1px solid ${darkMode ? '#1976d2' : '#bbdefb'}`
        }}>
          <p style={{ margin: 0 }}>
            <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
            {activeTool === TOOL_TYPES.SWING_POINT
              ? 'Click on the chart to place swing points'
              : 'Click on the chart again to complete your drawing'}
          </p>
        </div>
      )}
    </div>
  );
};

export default HighchartsDrawingTools;