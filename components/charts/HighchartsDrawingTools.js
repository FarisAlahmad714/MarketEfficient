// components/charts/HighchartsDrawingTools.js
import React, { useState, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

// Drawing tools types
const TOOL_TYPES = {
  POINTER: 'pointer',
  TRENDLINE: 'trendline',
  SWING_POINT: 'swingPoint',
  FIBONACCI: 'fibonacci',
  FVG: 'fvg' // Fair Value Gap
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
      <button 
        style={buttonStyle(activeTool === TOOL_TYPES.POINTER)}
        onClick={() => onToolSelect(TOOL_TYPES.POINTER)}
      >
        Pointer
      </button>
      <button 
        style={buttonStyle(activeTool === TOOL_TYPES.TRENDLINE)}
        onClick={() => onToolSelect(TOOL_TYPES.TRENDLINE)}
      >
        Trendline
      </button>
      <button 
        style={buttonStyle(activeTool === TOOL_TYPES.SWING_POINT)}
        onClick={() => onToolSelect(TOOL_TYPES.SWING_POINT)}
      >
        Swing Point
      </button>
      <button 
        style={buttonStyle(activeTool === TOOL_TYPES.FIBONACCI)}
        onClick={() => onToolSelect(TOOL_TYPES.FIBONACCI)}
      >
        Fibonacci
      </button>
      <button 
        style={buttonStyle(activeTool === TOOL_TYPES.FVG)}
        onClick={() => onToolSelect(TOOL_TYPES.FVG)}
      >
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

  // Handler when a tool is selected
  const handleToolSelect = (tool) => {
    setActiveTool(tool);
    
    if (!chart) return;
    
    // Enable chart pointer events based on the selected tool
    if (tool === TOOL_TYPES.POINTER) {
      // Enable normal chart interactions
      chart.update({
        chart: {
          events: {},
          zoomType: 'xy'
        }
      });
    } else {
      // Disable zooming and enable click events for drawing
      chart.update({
        chart: {
          zoomType: '',
          events: {
            click: (event) => handleChartClick(event, tool)
          }
        }
      });
    }
  };

  // Handle a click on the chart
  const handleChartClick = (event, tool) => {
    if (!chart) return;
    
    // Get the click coordinates in terms of the chart data
    const xValue = event.xAxis[0].value;
    const yValue = event.yAxis[0].value;
    
    if (!isDrawing) {
      // First click - start drawing
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
        case TOOL_TYPES.SWING_POINT:
          addSwingPoint(endPoint); // We just need one point for swing points
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
      
      // If we're drawing swing points, don't reset the tool
      if (tool !== TOOL_TYPES.SWING_POINT) {
        setActiveTool(TOOL_TYPES.POINTER);
        // Re-enable normal chart interactions
        chart.update({
          chart: {
            events: {},
            zoomType: 'xy'
          }
        });
      }
    }
  };

  // Add a trendline annotation
  const addTrendline = (start, end) => {
    if (!chart) return;
    
    const id = `trendline-${Date.now()}`;
    const annotation = {
      type: 'line',
      typeOptions: {
        points: [
          { x: start.x, y: start.y },
          { x: end.x, y: end.y }
        ]
      },
      draggable: true,
      shapes: [{
        type: 'path',
        points: [
          { x: start.x, y: start.y },
          { x: end.x, y: end.y }
        ],
        stroke: '#3f51b5',
        strokeWidth: 2
      }],
      id: id
    };
    
    chart.addAnnotation(annotation);
    
    // Add to local state
    const newDrawing = {
      id,
      type: TOOL_TYPES.TRENDLINE,
      points: [start, end]
    };
    
    updateDrawings(newDrawing);
  };

  // Add a swing point annotation
  const addSwingPoint = (point) => {
    if (!chart) return;
    
    const id = `swingPoint-${Date.now()}`;
    const annotation = {
      type: 'basicAnnotation',
      typeOptions: {},
      draggable: true,
      shapes: [{
        type: 'circle',
        point: { x: point.x, y: point.y },
        r: 6,
        fill: '#388E3C',
        stroke: '#2E7D32',
        strokeWidth: 2
      }],
      id: id
    };
    
    chart.addAnnotation(annotation);
    
    // Add to local state
    const newDrawing = {
      id,
      type: TOOL_TYPES.SWING_POINT,
      points: [point]
    };
    
    updateDrawings(newDrawing);
  };

  // Add a Fibonacci retracement annotation
  const addFibonacciRetracement = (start, end) => {
    if (!chart) return;
    
    const id = `fibonacci-${Date.now()}`;
    
    // Fibonacci levels
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const colors = ["#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688"];
    
    // Calculate the price range
    const priceRange = end.y - start.y;
    
    // Create shapes for each Fibonacci level
    const shapes = [];
    const labels = [];
    
    levels.forEach((level, i) => {
      const levelPrice = start.y + priceRange * level;
      
      // Add horizontal line for this level
      shapes.push({
        type: 'path',
        points: [
          { x: start.x, y: levelPrice },
          { x: end.x, y: levelPrice }
        ],
        stroke: colors[i],
        strokeWidth: 1,
        dashStyle: 'dash'
      });
      
      // Add label for this level
      labels.push({
        point: { x: end.x, y: levelPrice },
        text: level.toFixed(3),
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
        { x: start.x, y: start.y },
        { x: end.x, y: end.y }
      ],
      stroke: '#9C27B0',
      strokeWidth: 2
    });
    
    const annotation = {
      type: 'basicAnnotation',
      typeOptions: {},
      draggable: true,
      shapes: shapes,
      labels: labels,
      id: id
    };
    
    chart.addAnnotation(annotation);
    
    // Add to local state
    const newDrawing = {
      id,
      type: TOOL_TYPES.FIBONACCI,
      points: [start, end]
    };
    
    updateDrawings(newDrawing);
  };

  // Add a Fair Value Gap (FVG) annotation
  const addFairValueGap = (start, end) => {
    if (!chart) return;
    
    const id = `fvg-${Date.now()}`;
    
    // Create rectangle between the points
    const annotation = {
      type: 'basicAnnotation',
      typeOptions: {},
      draggable: true,
      shapes: [{
        type: 'rect',
        x: start.x,
        y: Math.min(start.y, end.y),
        width: end.x - start.x,
        height: Math.abs(end.y - start.y),
        fill: {
          color: '#FF9800',
          opacity: 0.2
        },
        stroke: '#EF6C00',
        strokeWidth: 1
      }],
      labels: [{
        point: { 
          x: start.x + (end.x - start.x) / 2, 
          y: Math.min(start.y, end.y) + Math.abs(end.y - start.y) / 2 
        },
        text: 'FVG',
        style: {
          color: '#EF6C00',
          fontWeight: 'bold'
        }
      }],
      id: id
    };
    
    chart.addAnnotation(annotation);
    
    // Add to local state
    const newDrawing = {
      id,
      type: TOOL_TYPES.FVG,
      points: [start, end]
    };
    
    updateDrawings(newDrawing);
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
    
    // Remove all annotations from the chart
    chart.annotations.forEach(annotation => {
      annotation.destroy();
    });
    
    // Clear local state
    setDrawings([]);
    
    if (onDrawingChange) {
      onDrawingChange([]);
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
      
      {isDrawing && (
        <div style={{
          padding: '10px 15px',
          backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
          borderRadius: '4px',
          marginBottom: '15px',
          color: darkMode ? '#90caf9' : '#1976d2',
          border: `1px solid ${darkMode ? '#1976d2' : '#bbdefb'}`
        }}>
          <p style={{ margin: 0 }}>Click on the chart to complete your {activeTool} drawing</p>
        </div>
      )}
    </div>
  );
};

export default HighchartsDrawingTools;