import React, { useState, useEffect, useRef, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
//           'Content-Type': 'application/json'
import logger from '../../lib/logger';
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

// Main DrawingToolsOverlay component
const DrawingToolsOverlay = ({ 
  plotlyNode, 
  onDrawingComplete = null,
  onDrawingChange = null
}) => {
  const { darkMode } = useContext(ThemeContext);
  const [activeTool, setActiveTool] = useState(TOOL_TYPES.POINTER);
  const [drawings, setDrawings] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const drawingAreaRef = useRef(null);

  logger.log("DrawingToolsOverlay rendering with plotlyNode:", plotlyNode);

  // Helper to find Plotly container and create overlay
  const setupDrawingOverlay = () => {
    try {
      // Find Plotly container in the DOM
      const plotlyContainer = document.querySelector('.js-plotly-plot');
      if (!plotlyContainer) {
        return;
      }
      
      logger.log("Found Plotly container:", plotlyContainer);
      
      // Find the plot area (the main SVG or the plot div)
      const mainSvg = plotlyContainer.querySelector('.main-svg');
      if (!mainSvg) {
        return;
      }
      
      logger.log("Found main SVG:", mainSvg);
      
      // Create drawing area if it doesn't exist
      if (!drawingAreaRef.current) {
        logger.log("Creating drawing area");
        const drawingArea = document.createElement('div');
        drawingArea.className = 'drawing-overlay';
        drawingArea.style.position = 'absolute';
        drawingArea.style.top = '0';
        drawingArea.style.left = '0';
        drawingArea.style.width = '100%';
        drawingArea.style.height = '100%';
        drawingArea.style.zIndex = '10';
        drawingArea.style.pointerEvents = activeTool === TOOL_TYPES.POINTER ? 'none' : 'auto';
        
        // Add to the container
        containerRef.current.appendChild(drawingArea);
        drawingAreaRef.current = drawingArea;
      }
      
      // Create SVG for drawings if it doesn't exist
      if (drawingAreaRef.current && !svgRef.current) {
        logger.log("Creating SVG overlay");
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.pointerEvents = activeTool === TOOL_TYPES.POINTER ? 'none' : 'auto';
        
        drawingAreaRef.current.appendChild(svg);
        svgRef.current = svg;
      }
      
      // Position the drawing area to match the Plotly chart
      positionDrawingArea(mainSvg);
      
      // Create a resize observer to update positioning when the chart resizes
      const resizeObserver = new ResizeObserver(() => {
        positionDrawingArea(mainSvg);
      });
      
      resizeObserver.observe(mainSvg);
      
      return () => {
        resizeObserver.disconnect();
      };
    } catch (err) {
    }
  };
  
  // Helper to position the drawing area
  const positionDrawingArea = (plotElement) => {
    if (!drawingAreaRef.current || !containerRef.current || !plotElement) return;
    
    try {
      const plotRect = plotElement.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      const drawingArea = drawingAreaRef.current;
      drawingArea.style.width = `${plotRect.width}px`;
      drawingArea.style.height = `${plotRect.height}px`;
      drawingArea.style.top = `${plotRect.top - containerRect.top}px`;
      drawingArea.style.left = `${plotRect.left - containerRect.left}px`;
      
      logger.log("Drawing area positioned:", {
        width: plotRect.width,
        height: plotRect.height,
        top: plotRect.top - containerRect.top,
        left: plotRect.left - containerRect.left
      });
    } catch (err) {
    }
  };

  // Setup drawing area and SVG overlay
  useEffect(() => {
    // Give time for Plotly to render
    const timer = setTimeout(() => {
      setupDrawingOverlay();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle tool changes
  useEffect(() => {
    logger.log("Tool changed to:", activeTool);
    
    try {
      // Update drawing area pointer events
      if (drawingAreaRef.current) {
        drawingAreaRef.current.style.pointerEvents = activeTool === TOOL_TYPES.POINTER ? 'none' : 'auto';
      }
      
      if (svgRef.current) {
        svgRef.current.style.pointerEvents = activeTool === TOOL_TYPES.POINTER ? 'none' : 'auto';
      }
      
      // Change Plotly's dragmode
      if (plotlyNode && plotlyNode.setDragMode) {
        if (activeTool === TOOL_TYPES.POINTER) {
          plotlyNode.setDragMode('pan');
        } else {
          plotlyNode.setDragMode(false);
        }
      } else {
        // Fallback method - use window.Plotly directly
        const plotlyDiv = document.querySelector('.js-plotly-plot');
        if (plotlyDiv && window.Plotly) {
          if (activeTool === TOOL_TYPES.POINTER) {
            window.Plotly.relayout(plotlyDiv, { dragmode: 'pan' });
          } else {
            window.Plotly.relayout(plotlyDiv, { dragmode: false });
          }
        }
      }
    } catch (err) {
    }
  }, [activeTool, plotlyNode]);

  // Helper function to convert pixel coordinates to data values
  const pixelToDataCoordinates = (x, y) => {
    try {
      // Find the Plotly chart
      const plotlyDiv = document.querySelector('.js-plotly-plot');
      if (!plotlyDiv || !window.Plotly) {
        return { date: new Date(), price: 0 };
      }
      
      // Get the full layout with axes
      const fullLayout = plotlyDiv._fullLayout;
      if (!fullLayout || !fullLayout.xaxis || !fullLayout.yaxis) {
        return { date: new Date(), price: 0 };
      }
      
      // Convert coordinates
      const date = fullLayout.xaxis.p2d(x);
      const price = fullLayout.yaxis.p2d(y);
      
      return { date: new Date(date), price };
    } catch (error) {
      return { date: new Date(), price: 0 };
    }
  };
  
  // Helper function to convert data coordinates to pixel position
  const dataToPixelCoordinates = (date, price) => {
    try {
      // Find the Plotly chart
      const plotlyDiv = document.querySelector('.js-plotly-plot');
      if (!plotlyDiv || !window.Plotly) {
        return { x: 0, y: 0 };
      }
      
      // Get the full layout with axes
      const fullLayout = plotlyDiv._fullLayout;
      if (!fullLayout || !fullLayout.xaxis || !fullLayout.yaxis) {
        return { x: 0, y: 0 };
      }
      
      // Convert data coordinates to pixels
      const x = fullLayout.xaxis.d2p(date instanceof Date ? date.getTime() : date);
      const y = fullLayout.yaxis.d2p(price);
      
      return { x, y };
    } catch (error) {
      return { x: 0, y: 0 };
    }
  };

  // Drawing event handlers
  const handleMouseDown = (e) => {
    if (activeTool === TOOL_TYPES.POINTER) return;
    
    logger.log("Mouse down in drawing area");
    
    const rect = drawingAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const dataCoords = pixelToDataCoordinates(x, y);
    logger.log("Start point data coordinates:", dataCoords);
    
    setStartPoint(dataCoords);
    setCurrentPoint(dataCoords);
    setIsDrawing(true);
  };
  
  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    
    const rect = drawingAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const dataCoords = pixelToDataCoordinates(x, y);
    setCurrentPoint(dataCoords);
  };
  
  const handleMouseUp = () => {
    if (!isDrawing) return;
    
    logger.log("Mouse up in drawing area");
    
    // Create the drawing object based on tool type
    if (startPoint && currentPoint) {
      const newDrawing = {
        id: Date.now().toString(),
        type: activeTool,
        points: [startPoint, currentPoint]
      };
      
      logger.log("Creating new drawing:", newDrawing);
      
      // Add to drawings array
      const updatedDrawings = [...drawings, newDrawing];
      setDrawings(updatedDrawings);
      
      // Notify parent component
      if (onDrawingComplete) {
        onDrawingComplete(newDrawing);
      }
      
      if (onDrawingChange) {
        onDrawingChange(updatedDrawings);
      }
    }
    
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };
  
  // Handle clearing all drawings
  const handleClearAll = () => {
    setDrawings([]);
    if (onDrawingChange) {
      onDrawingChange([]);
    }
  };
  
  // Render drawings on SVG overlay
  useEffect(() => {
    if (!svgRef.current) return;
    
    logger.log("Rendering drawings:", drawings.length);
    
    // Clear existing drawings
    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }
    
    // Render all saved drawings
    drawings.forEach(drawing => {
      renderDrawing(svgRef.current, drawing, false);
    });
    
    // Render current drawing in progress
    if (isDrawing && startPoint && currentPoint) {
      renderDrawing(svgRef.current, {
        type: activeTool,
        points: [startPoint, currentPoint]
      }, true);
    }
  }, [drawings, isDrawing, startPoint, currentPoint, activeTool]);
  
  // Function to handle tool selection
  const handleToolSelect = (tool) => {
    logger.log("Tool selected:", tool);
    setActiveTool(tool);
  };

  // Functions to render different drawing types
  const renderDrawing = (svg, drawing, isTemp = false) => {
    switch (drawing.type) {
      case TOOL_TYPES.TRENDLINE:
        renderTrendline(svg, drawing, isTemp);
        break;
      case TOOL_TYPES.SWING_POINT:
        renderSwingPoint(svg, drawing, isTemp);
        break;
      case TOOL_TYPES.FIBONACCI:
        renderFibonacci(svg, drawing, isTemp);
        break;
      case TOOL_TYPES.FVG:
        renderFVG(svg, drawing, isTemp);
        break;
      default:
        break;
    }
  };
  
  // Render a trendline
  const renderTrendline = (svg, drawing, isTemp) => {
    const [start, end] = drawing.points;
    const startPx = dataToPixelCoordinates(start.date, start.price);
    const endPx = dataToPixelCoordinates(end.date, end.price);
    
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", startPx.x);
    line.setAttribute("y1", startPx.y);
    line.setAttribute("x2", endPx.x);
    line.setAttribute("y2", endPx.y);
    line.setAttribute("stroke", isTemp ? "#5c6bc0" : "#3f51b5");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("stroke-opacity", isTemp ? "0.6" : "1");
    
    if (isTemp) {
      line.setAttribute("stroke-dasharray", "5,5");
    }
    
    svg.appendChild(line);
  };
  
  // Render a swing point
  const renderSwingPoint = (svg, drawing, isTemp) => {
    const [point] = drawing.points;
    const pointPx = dataToPixelCoordinates(point.date, point.price);
    
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", pointPx.x);
    circle.setAttribute("cy", pointPx.y);
    circle.setAttribute("r", "6");
    circle.setAttribute("fill", isTemp ? "#4CAF50" : "#388E3C");
    circle.setAttribute("fill-opacity", isTemp ? "0.6" : "0.8");
    circle.setAttribute("stroke", isTemp ? "#81C784" : "#2E7D32");
    circle.setAttribute("stroke-width", "2");
    
    svg.appendChild(circle);
  };
  
  // Render Fibonacci retracement levels
  const renderFibonacci = (svg, drawing, isTemp) => {
    const [start, end] = drawing.points;
    const startPx = dataToPixelCoordinates(start.date, start.price);
    const endPx = dataToPixelCoordinates(end.date, end.price);
    
    // Fibonacci levels: 0, 0.236, 0.382, 0.5, 0.618, 0.786, 1
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const colors = ["#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688"];
    
    // Create the main trend line
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", startPx.x);
    line.setAttribute("y1", startPx.y);
    line.setAttribute("x2", endPx.x);
    line.setAttribute("y2", endPx.y);
    line.setAttribute("stroke", "#9C27B0");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("stroke-opacity", isTemp ? "0.6" : "1");
    
    svg.appendChild(line);
    
    // Line from start to end of horizontal zone
    const priceRange = end.price - start.price;
    
    levels.forEach((level, i) => {
      const levelPrice = start.price + priceRange * level;
      const levelPx = dataToPixelCoordinates(end.date, levelPrice);
      
      // Create horizontal line at each level
      const levelLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      levelLine.setAttribute("x1", startPx.x);
      levelLine.setAttribute("y1", levelPx.y);
      levelLine.setAttribute("x2", endPx.x);
      levelLine.setAttribute("y2", levelPx.y);
      levelLine.setAttribute("stroke", colors[i]);
      levelLine.setAttribute("stroke-width", "1");
      levelLine.setAttribute("stroke-opacity", isTemp ? "0.5" : "0.7");
      
      if (isTemp) {
        levelLine.setAttribute("stroke-dasharray", "3,3");
      }
      
      svg.appendChild(levelLine);
      
      // Add label for each level
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", endPx.x + 5);
      label.setAttribute("y", levelPx.y + 4);
      label.setAttribute("font-size", "12");
      label.setAttribute("fill", colors[i]);
      label.textContent = level.toFixed(3);
      
      svg.appendChild(label);
    });
  };
  
  // Render Fair Value Gap (FVG)
  const renderFVG = (svg, drawing, isTemp) => {
    const [start, end] = drawing.points;
    const startPx = dataToPixelCoordinates(start.date, start.price);
    const endPx = dataToPixelCoordinates(end.date, end.price);
    
    // Create a rectangle representing the FVG
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", startPx.x);
    rect.setAttribute("y", Math.min(startPx.y, endPx.y));
    rect.setAttribute("width", endPx.x - startPx.x);
    rect.setAttribute("height", Math.abs(endPx.y - startPx.y));
    rect.setAttribute("fill", isTemp ? "#FF9800" : "#F57C00");
    rect.setAttribute("fill-opacity", "0.2");
    rect.setAttribute("stroke", isTemp ? "#FFB74D" : "#EF6C00");
    rect.setAttribute("stroke-width", "1");
    rect.setAttribute("stroke-opacity", "0.8");
    
    svg.appendChild(rect);
    
    // Add a label
    const labelX = startPx.x + (endPx.x - startPx.x) / 2;
    const labelY = Math.min(startPx.y, endPx.y) + Math.abs(endPx.y - startPx.y) / 2;
    
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", labelX);
    label.setAttribute("y", labelY);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "middle");
    label.setAttribute("font-size", "12");
    label.setAttribute("fill", "#EF6C00");
    label.setAttribute("fill-opacity", "0.9");
    label.textContent = "FVG";
    
    svg.appendChild(label);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <DrawingToolbar
        activeTool={activeTool}
        onToolSelect={handleToolSelect}
        onClearAll={handleClearAll}
        darkMode={darkMode}
      />
      
      {drawingAreaRef.current && (
        <div 
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: activeTool === TOOL_TYPES.POINTER ? 'none' : 'auto',
            cursor: activeTool === TOOL_TYPES.POINTER ? 'default' : 'crosshair'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      )}
    </div>
  );
};

export default DrawingToolsOverlay;