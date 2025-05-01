// components/charts/HighchartsDrawingTools.js
import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

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
  onDrawingComplete = null,
  onDrawingChange = null
}) => {
  const { darkMode } = useContext(ThemeContext);
  const [activeTool, setActiveTool] = useState(TOOL_TYPES.POINTER);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawings, setDrawings] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [chartReady, setChartReady] = useState(false);

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
    if (!chartReady || !chart) return;
    
    try {
      // Enable chart pointer events based on the selected tool
      if (tool === TOOL_TYPES.POINTER) {
        // Remove click event handlers if they exist
        if (chart.container) {
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
        // For drawing tools, disable chart zoom
        chart.update({
          chart: {
            zoomType: null
          }
        }, false);
        chart.redraw();
        
        // Add click handler to chart container
        if (chart.container) {
          chart.container.onclick = (e) => handleChartContainerClick(e, tool);
        }
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
    if (!chart || !chart.xAxis || !chart.yAxis) return;
    
    try {
      // Get chart position
      const chartRect = chart.container.getBoundingClientRect();
      const chartX = event.clientX - chartRect.left;
      const chartY = event.clientY - chartRect.top;
      
      // Convert to chart coordinates
      let xValue, yValue;
      
      // Use chart.pointer if available, otherwise do manual conversion
      if (chart.pointer && chart.pointer.normalize) {
        const chartPosition = chart.pointer.normalize(event);
        xValue = chart.xAxis[0].toValue(chartPosition.chartX);
        yValue = chart.yAxis[0].toValue(chartPosition.chartY);
      } else {
        // Manual conversion as fallback
        const xAxisPixelRatio = chart.xAxis[0].width / (chart.xAxis[0].max - chart.xAxis[0].min);
        const yAxisPixelRatio = chart.yAxis[0].height / (chart.yAxis[0].max - chart.yAxis[0].min);
        
        // Adjust for chart plot positions
        const plotLeft = chart.plotLeft || 0;
        const plotTop = chart.plotTop || 0;
        
        xValue = chart.xAxis[0].min + (chartX - plotLeft) / xAxisPixelRatio;
        yValue = chart.yAxis[0].max - (chartY - plotTop) / yAxisPixelRatio;
      }
      
      console.log(`Chart clicked at x=${xValue}, y=${yValue} with tool=${tool}`);
      
      if (tool === TOOL_TYPES.SWING_POINT) {
        // Swing points only require a single click
        addSwingPoint({ x: xValue, y: yValue });
      } else if (!isDrawing) {
        // First click for other tools - start drawing
        setStartPoint({ x: xValue, y: yValue });
        setIsDrawing(true);
      } else {
        // Second click - complete drawing
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
    if (!chart) return;
    
    try {
      const id = `trendline-${Date.now()}`;
      
      // Create the annotation configuration
      const annotationOptions = {
        labelOptions: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          style: {
            color: '#FFFFFF'
          },
          borderWidth: 0,
          borderRadius: 3
        },
        labels: [{
          point: {
            x: start.x,
            y: start.y,
            xAxis: 0,
            yAxis: 0
          },
          text: 'Start'
        }, {
          point: {
            x: end.x,
            y: end.y,
            xAxis: 0,
            yAxis: 0
          },
          text: 'End'
        }],
        shapes: [{
          type: 'path',
          points: [
            { x: start.x, y: start.y, xAxis: 0, yAxis: 0 },
            { x: end.x, y: end.y, xAxis: 0, yAxis: 0 }
          ],
          stroke: '#3f51b5',
          strokeWidth: 2
        }],
        draggable: true,
        id: id
      };
      
      // Add the annotation to the chart
      chart.addAnnotation(annotationOptions);
      
      console.log(`Added trendline from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
      
      // Add to local state
      const newDrawing = {
        id,
        type: TOOL_TYPES.TRENDLINE,
        points: [start, end]
      };
      
      updateDrawings(newDrawing);
    } catch (err) {
      console.error("Error adding trendline:", err);
    }
  };

  // Add a swing point annotation
  const addSwingPoint = (point) => {
    if (!chart) return;
    
    try {
      const id = `swingPoint-${Date.now()}`;
      
      // Create the annotation configuration with explicit axis references
      const annotationOptions = {
        labelOptions: {
          backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          style: {
            color: darkMode ? '#81c784' : '#388E3C',
            fontWeight: 'bold'
          },
          borderWidth: 0,
          borderRadius: 3,
          y: -25
        },
        labels: [{
          point: {
            x: point.x,
            y: point.y,
            xAxis: 0,
            yAxis: 0
          },
          text: 'Swing'
        }],
        shapes: [{
          type: 'circle',
          point: {
            x: point.x,
            y: point.y,
            xAxis: 0,
            yAxis: 0
          },
          r: 6,
          fill: darkMode ? '#81c784' : '#388E3C',
          stroke: darkMode ? '#2E7D32' : '#1B5E20',
          strokeWidth: 2
        }],
        draggable: true,
        id: id
      };
      
      // Add the annotation to the chart
      chart.addAnnotation(annotationOptions);
      
      console.log(`Added swing point at (${point.x}, ${point.y})`);
      
      // Add to local state
      const newDrawing = {
        id,
        type: TOOL_TYPES.SWING_POINT,
        points: [point]
      };
      
      updateDrawings(newDrawing);
    } catch (err) {
      console.error("Error adding swing point:", err);
    }
  };

  // Add a Fibonacci retracement annotation
  const addFibonacciRetracement = (start, end) => {
    if (!chart) return;
    
    try {
      const id = `fibonacci-${Date.now()}`;
      
      // Fibonacci levels
      const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
      const colors = ["#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688"];
      
      // Calculate the price range
      const priceRange = end.y - start.y;
      
      // Create shapes and labels for each Fibonacci level
      const shapes = [];
      const labels = [];
      
      levels.forEach((level, i) => {
        const levelPrice = start.y + priceRange * level;
        
        // Add horizontal line for this level
        shapes.push({
          type: 'path',
          points: [
            { x: start.x, y: levelPrice, xAxis: 0, yAxis: 0 },
            { x: end.x, y: levelPrice, xAxis: 0, yAxis: 0 }
          ],
          stroke: colors[i],
          strokeWidth: 1,
          dashStyle: 'dash'
        });
        
        // Add label for this level
        labels.push({
          point: {
            x: end.x,
            y: levelPrice,
            xAxis: 0,
            yAxis: 0
          },
          text: level.toFixed(3),
          x: 5, // Offset to position label to the right of the end point
          backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          style: {
            color: colors[i],
            fontSize: '12px'
          }
        });
      });
      
      // Add the main trend line
      shapes.push({
        type: 'path',
        points: [
          { x: start.x, y: start.y, xAxis: 0, yAxis: 0 },
          { x: end.x, y: end.y, xAxis: 0, yAxis: 0 }
        ],
        stroke: '#9C27B0',
        strokeWidth: 2
      });
      
      // Create the annotation configuration with proper labelOptions
      const annotationOptions = {
        labelOptions: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          style: {
            color: '#FFFFFF'
          },
          borderWidth: 0,
          borderRadius: 3
        },
        labels: labels,
        shapes: shapes,
        draggable: true,
        id: id
      };
      
      // Add the annotation to the chart
      chart.addAnnotation(annotationOptions);
      
      console.log(`Added Fibonacci retracement from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
      
      // Add to local state
      const newDrawing = {
        id,
        type: TOOL_TYPES.FIBONACCI,
        points: [start, end]
      };
      
      updateDrawings(newDrawing);
    } catch (err) {
      console.error("Error adding Fibonacci retracement:", err);
    }
  };

  // Add a Fair Value Gap (FVG) annotation
  const addFairValueGap = (start, end) => {
    if (!chart) return;
    
    try {
      const id = `fvg-${Date.now()}`;
      
      // Get the minimum and maximum values for proper rectangle positioning
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);
      
      // Calculate width and height
      const width = maxX - minX;
      const height = maxY - minY;
      
      // Create the annotation configuration with explicit axis references
      const annotationOptions = {
        labelOptions: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          style: {
            color: darkMode ? '#FFB74D' : '#EF6C00',
            fontWeight: 'bold',
            fontSize: '14px'
          },
          borderWidth: 0,
          borderRadius: 5,
          padding: 5
        },
        labels: [{
          point: {
            x: minX + width / 2,
            y: minY + height / 2,
            xAxis: 0,
            yAxis: 0
          },
          text: 'FVG'
        }],
        shapeOptions: {
          fill: 'rgba(255, 152, 0, 0.2)',
          stroke: '#EF6C00',
          strokeWidth: 1
        },
        shapes: [{
          type: 'rect',
          points: [{
            x: minX,
            y: minY,
            xAxis: 0,
            yAxis: 0
          }, {
            x: maxX,
            y: maxY,
            xAxis: 0,
            yAxis: 0
          }]
        }],
        draggable: true,
        id: id
      };
      
      // Add the annotation to the chart
      chart.addAnnotation(annotationOptions);
      
      console.log(`Added FVG from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
      
      // Add to local state
      const newDrawing = {
        id,
        type: TOOL_TYPES.FVG,
        points: [start, end]
      };
      
      updateDrawings(newDrawing);
    } catch (err) {
      console.error("Error adding FVG:", err);
    }
  };

  // Update the local drawings array and notify parent
  const updateDrawings = (newDrawing) => {
    const updatedDrawings = [...drawings, newDrawing];
    setDrawings(updatedDrawings);
    
    if (onDrawingComplete) {
      onDrawingComplete(newDrawing);
    }
    
    if (onDrawingChange) {
      onDrawingChange(updatedDrawings);
    }
  };

  // Clear all annotations
  const handleClearAll = () => {
    if (!chart) return;
    
    try {
      // Clear all annotations from the chart
      if (chart.annotations && chart.annotations.length > 0) {
        // We need to clone the array because destroying annotations modifies the array
        const annotationsToRemove = [...chart.annotations];
        annotationsToRemove.forEach(annotation => {
          try {
            annotation.destroy();
          } catch (err) {
            console.error("Error destroying annotation:", err);
          }
        });
      }
      
      // Make sure annotations array is properly reset
      chart.annotations = [];
      
      // Clear local state
      setDrawings([]);
      
      if (onDrawingChange) {
        onDrawingChange([]);
      }
    } catch (err) {
      console.error("Error clearing annotations:", err);
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
      
      {isDrawing && (
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