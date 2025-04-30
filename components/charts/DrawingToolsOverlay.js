// components/charts/DrawingToolsOverlay.js
import React, { useState, useEffect, useRef, useContext } from 'react';
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

  // Create and position the SVG overlay on the Plotly chart
  useEffect(() => {
    if (!plotlyNode || !containerRef.current) {
      console.warn('Missing plotlyNode or containerRef');
      return;
    }
    
    // Try to find the plot area using different approaches
    let plotArea = null;
    
    // Check what kind of object plotlyNode is
    if (typeof plotlyNode === 'object') {
      // First, try to access it as a Plotly object
      if (plotlyNode._fullLayout && plotlyNode._fullLayout.plot) {
        // It's a Plotly object
        plotArea = plotlyNode._fullLayout.plot;
      } 
      // Then try to access it as a DOM element
      else if (plotlyNode.querySelector) {
        try {
          // It's a DOM element
          plotArea = plotlyNode.querySelector('.plot');
        } catch (err) {
          console.warn('Error using querySelector:', err);
        }
      }
      // Additional check - maybe plotlyNode itself is the plot area
      else if (plotlyNode.getBoundingClientRect) {
        plotArea = plotlyNode;
      }
    }
    
    // If we still don't have a plot area, log a warning and return
    if (!plotArea) {
      console.warn('Could not find plot area in Plotly node:', plotlyNode);
      return;
    }
    
    // Get the drawing area dimensions and position
    const updateDrawingAreaSize = () => {
      if (!drawingAreaRef.current || !plotArea) return;
      
      try {
        const rect = plotArea.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        drawingAreaRef.current.style.width = `${rect.width}px`;
        drawingAreaRef.current.style.height = `${rect.height}px`;
        drawingAreaRef.current.style.top = `${rect.top - containerRect.top}px`;
        drawingAreaRef.current.style.left = `${rect.left - containerRect.left}px`;
      } catch (err) {
        console.warn('Error updating drawing area size:', err);
      }
    };
    
    // Create SVG overlay if it doesn't exist
    if (!svgRef.current && drawingAreaRef.current) {
      try {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.pointerEvents = 'none';
        
        drawingAreaRef.current.appendChild(svg);
        svgRef.current = svg;
      } catch (err) {
        console.warn('Error creating SVG element:', err);
      }
    }
    
    // Initial size update
    updateDrawingAreaSize();
    
    // Update dimensions when window resizes
    try {
      const resizeObserver = new ResizeObserver(updateDrawingAreaSize);
      resizeObserver.observe(plotArea);
      
      return () => {
        resizeObserver.disconnect();
      };
    } catch (err) {
      console.warn('Error setting up ResizeObserver:', err);
      // Fallback to window resize event
      window.addEventListener('resize', updateDrawingAreaSize);
      return () => {
        window.removeEventListener('resize', updateDrawingAreaSize);
      };
    }
  }, [plotlyNode]);

  // Helper function to convert pixel coordinates to data values
  const pixelToDataCoordinates = (x, y) => {
    if (!plotlyNode) return { date: new Date(), price: 0 };
    
    try {
      // Access Plotly's internal layout object
      const layout = plotlyNode._fullLayout;
      if (!layout || !layout.xaxis || !layout.yaxis) {
        console.warn('Plotly layout axes not available');
        return { date: new Date(), price: 0 };
      }
      
      // Convert pixels to data coordinates
      const date = layout.xaxis.p2d(x);
      const price = layout.yaxis.p2d(y);
      
      return { date: new Date(date), price };
    } catch (error) {
      console.error('Error converting pixel to data coordinates:', error);
      return { date: new Date(), price: 0 };
    }
  };
  
  // Helper function to convert data coordinates to pixel position
  const dataToPixelCoordinates = (date, price) => {
    if (!plotlyNode) return { x: 0, y: 0 };
    
    try {
      // Access Plotly's internal layout object
      const layout = plotlyNode._fullLayout;
      if (!layout || !layout.xaxis || !layout.yaxis) {
        console.warn('Plotly layout axes not available');
        return { x: 0, y: 0 };
      }
      
      // Convert data coordinates to pixels
      const x = layout.xaxis.d2p(date instanceof Date ? date.getTime() : date);
      const y = layout.yaxis.d2p(price);
      
      return { x, y };
    } catch (error) {
      console.error('Error converting data to pixel coordinates:', error);
      return { x: 0, y: 0 };
    }
  };

  // Drawing event handlers
  const handleMouseDown = (e) => {
    if (activeTool === TOOL_TYPES.POINTER) return;
    
    const rect = drawingAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const dataCoords = pixelToDataCoordinates(x, y);
    setStartPoint(dataCoords);
    setCurrentPoint(dataCoords);
    setIsDrawing(true);
  };
  
  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    
    const rect = drawingAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentPoint(pixelToDataCoordinates(x, y));
  };
  
  const handleMouseUp = () => {
    if (!isDrawing) return;
    
    // Create the drawing object based on tool type
    if (startPoint && currentPoint) {
      const newDrawing = {
        id: Date.now().toString(),
        type: activeTool,
        points: [startPoint, currentPoint]
      };
      
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
  
  // Function to render different drawing types
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
        onToolSelect={setActiveTool}
        onClearAll={handleClearAll}
        darkMode={darkMode}
      />
      
      <div 
        ref={drawingAreaRef}
        style={{ 
          position: 'absolute',
          pointerEvents: activeTool === TOOL_TYPES.POINTER ? 'none' : 'auto',
          cursor: activeTool === TOOL_TYPES.POINTER ? 'default' : 'crosshair'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};

export default DrawingToolsOverlay;