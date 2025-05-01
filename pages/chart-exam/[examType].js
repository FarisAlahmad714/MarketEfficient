import React, { useState, useEffect, useContext, useRef } from 'react';
import { useRouter } from 'next/router';
import { ThemeContext } from '../../contexts/ThemeContext';
import Link from 'next/link';
import CryptoLoader from '../../components/CryptoLoader';
import { fetchCoinGeckoOHLC } from '../../lib/data-service';
import Highcharts from 'highcharts';
import HighchartsStock from 'highcharts/modules/stock';
import HighchartsReact from 'highcharts-react-official';
import AnnotationsModule from 'highcharts/modules/annotations';

// Initialize Highcharts modules - order matters!
if (typeof Highcharts === 'object') {
  try {
    // Order matters - stock must be before annotations
    HighchartsStock(Highcharts);
    
    // Wait for stock to be initialized before adding annotations
    if (typeof Highcharts.Renderer === 'function') {
      AnnotationsModule(Highcharts);
    } else {
      console.error('Highcharts.Renderer not available for annotations');
    }
  } catch (error) {
    console.error('Error initializing Highcharts modules:', error);
  }
}

// Initialize Highcharts modules - ensure it works in the browser environment
if (typeof window !== 'undefined' && typeof Highcharts === 'object') {
  HighchartsStock(Highcharts);
  AnnotationsModule(Highcharts);
}

// Properly initialize Highcharts with all required modules
if (typeof window !== 'undefined' && typeof Highcharts === 'object') {
  try {
    // First initialize stock
    HighchartsStock(Highcharts);
    
    // Then add annotations support
    AnnotationsModule(Highcharts);
    
    // Additional configuration to ensure annotations work
    if (Highcharts.Annotation) {
      console.log("Annotation module loaded successfully");
    } else {
      console.error("Annotation module failed to load properly");
    }
  } catch (e) {
    console.error("Error initializing Highcharts modules:", e);
  }
}

// Exam type configuration
const examConfigs = {
  'swing-points': {
    title: 'Swing Point Analysis Exam',
    description: 'Identify important swing highs and swing lows on the chart. These are key turning points that determine market structure.',
    instructions: 'Use the drawing tools to mark significant swing points on the chart. Mark at least 3 major swing highs and 3 major swing lows.',
    cryptoAssets: ['bitcoin', 'ethereum', 'ripple', 'cardano'],
    timeframes: [7, 14, 30, 90],
    defaultTimeframe: 30,
    defaultCrypto: 'bitcoin'
  },
  'fibonacci': {
    title: 'Fibonacci Retracements Exam',
    description: 'Apply Fibonacci retracement levels to identify potential support and resistance zones.',
    instructions: 'Select a significant trend, then draw Fibonacci retracement levels from the start to the end of the trend. Identify key levels at 0.236, 0.382, 0.618, and 0.786.',
    cryptoAssets: ['bitcoin', 'ethereum', 'solana', 'polkadot'],
    timeframes: [14, 30, 90, 180],
    defaultTimeframe: 90,
    defaultCrypto: 'ethereum'
  },
  'fvg': {
    title: 'Fair Value Gaps (FVG) Exam',
    description: 'Identify Fair Value Gaps - areas where price makes a significant move, leaving an imbalance that often gets filled later.',
    instructions: 'Mark Fair Value Gaps on the chart by identifying areas where price has made a rapid move, creating an imbalance that is likely to be filled in the future.',
    cryptoAssets: ['bitcoin', 'ethereum', 'binancecoin', 'avalanche-2'],
    timeframes: [1, 7, 14, 30],
    defaultTimeframe: 7,
    defaultCrypto: 'binancecoin'
  }
};

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
  // More obvious styling for active tools
  const buttonStyle = (isActive) => ({
    padding: '8px 12px',
    marginRight: '8px',
    backgroundColor: isActive 
      ? (darkMode ? '#2196F3' : '#2196F3') 
      : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
    color: isActive 
      ? 'white' 
      : (darkMode ? '#e0e0e0' : '#333'),
    border: isActive ? '2px solid #FFC107' : 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: isActive ? 'bold' : 'normal',
    transition: 'all 0.2s ease',
    position: 'relative',
    boxShadow: isActive ? '0 0 8px rgba(33, 150, 243, 0.6)' : 'none'
  });
  
  const activeIndicatorStyle = {
    position: 'absolute',
    bottom: '-8px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '0',
    height: '0',
    borderLeft: '8px solid transparent',
    borderRight: '8px solid transparent',
    borderBottom: '8px solid #FFC107',
    display: 'block',
  };

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
        {activeTool === TOOL_TYPES.POINTER && <span style={activeIndicatorStyle}></span>}
      </button>
      <button 
        style={buttonStyle(activeTool === TOOL_TYPES.TRENDLINE)}
        onClick={() => onToolSelect(TOOL_TYPES.TRENDLINE)}
      >
        Trendline
        {activeTool === TOOL_TYPES.TRENDLINE && <span style={activeIndicatorStyle}></span>}
      </button>
      <button 
        style={buttonStyle(activeTool === TOOL_TYPES.SWING_POINT)}
        onClick={() => onToolSelect(TOOL_TYPES.SWING_POINT)}
      >
        Swing Point
        {activeTool === TOOL_TYPES.SWING_POINT && <span style={activeIndicatorStyle}></span>}
      </button>
      <button 
        style={buttonStyle(activeTool === TOOL_TYPES.FIBONACCI)}
        onClick={() => onToolSelect(TOOL_TYPES.FIBONACCI)}
      >
        Fibonacci
        {activeTool === TOOL_TYPES.FIBONACCI && <span style={activeIndicatorStyle}></span>}
      </button>
      <button 
        style={buttonStyle(activeTool === TOOL_TYPES.FVG)}
        onClick={() => onToolSelect(TOOL_TYPES.FVG)}
      >
        FVG
        {activeTool === TOOL_TYPES.FVG && <span style={activeIndicatorStyle}></span>}
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

export default function ChartExam() {
  const router = useRouter();
  const { examType } = router.query;
  const { darkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [selectedCrypto, setSelectedCrypto] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState(0);
  const [error, setError] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [chartOptions, setChartOptions] = useState(null);
  const [chartInstance, setChartInstance] = useState(null);
  const [activeTool, setActiveTool] = useState(TOOL_TYPES.POINTER);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const cryptoLoaderRef = useRef(null);
  const chartRef = useRef(null);

  // Initialize exam configuration based on the examType
  useEffect(() => {
    if (!examType || !examConfigs[examType]) {
      if (router.isReady) {
        setError('Invalid exam type selected');
        setLoading(false);
      }
      return;
    }

    // Set defaults from config
    const config = examConfigs[examType];
    setSelectedCrypto(config.defaultCrypto);
    setSelectedTimeframe(config.defaultTimeframe);
    
    // Simulate loading time and then hide loader
    const timer = setTimeout(() => {
      setLoading(false);
      if (cryptoLoaderRef.current) {
        cryptoLoaderRef.current.hideLoader();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [examType, router.isReady]);

  const handleCryptoChange = (e) => {
    setSelectedCrypto(e.target.value);
  };

  const handleTimeframeChange = (e) => {
    setSelectedTimeframe(parseInt(e.target.value, 10));
  };

  const handleStartExam = async () => {
    try {
      setLoading(true);
      
      // Fetch actual data from CoinGecko using our service
      const data = await fetchCoinGeckoOHLC(selectedCrypto, selectedTimeframe);
      
      // Format the data for Highcharts
      const formattedData = formatDataForHighcharts(data);
      setChartData(formattedData);
      
      // Create Highcharts options
      const options = createChartOptions(formattedData);
      setChartOptions(options);
      
      // Reset drawings when starting a new exam
      setDrawings([]);
      setActiveTool(TOOL_TYPES.POINTER);
      
      // Simulate loading time and then hide loader
      setTimeout(() => {
        setLoading(false);
        if (cryptoLoaderRef.current) {
          cryptoLoaderRef.current.hideLoader();
        }
      }, 1500);
    } catch (err) {
      setError(`Failed to load chart data: ${err.message}`);
      setLoading(false);
    }
  };

  // Format data for Highcharts
  const formatDataForHighcharts = (data) => {
    // Check if data is in Plotly format
    if (data && data.x && data.open && data.high && data.low && data.close) {
      return data.x.map((date, i) => {
        // Ensure date is a timestamp for Highcharts
        const timestamp = date instanceof Date ? date.getTime() : new Date(date).getTime();
        return [
          timestamp,
          data.open[i],
          data.high[i],
          data.low[i],
          data.close[i]
        ];
      });
    }
    
    // If data is already in OHLC format with date objects
    if (Array.isArray(data) && data.length > 0 && data[0].date) {
      return data.map(item => {
        const timestamp = item.date instanceof Date ? item.date.getTime() : new Date(item.date).getTime();
        return [
          timestamp,
          item.open,
          item.high,
          item.low,
          item.close
        ];
      });
    }
    
    // If data is already in Highcharts format, return as is
    return data;
  };

  // Create Highcharts options
  const createChartOptions = (ohlcData) => {
    return {
      chart: {
        type: 'candlestick',
        height: 600,
        backgroundColor: darkMode ? '#262626' : 'white',
        events: {
          // Explicitly define the click handler within options to ensure it's properly bound
          click: function(event) {
            // Log the click event for debugging
            console.log("Chart clicked:", event);
            
            // Get the click coordinates
            const xValue = event.xAxis[0].value;
            const yValue = event.yAxis[0].value;
            
            // Only process if we're in drawing mode
            if (activeTool !== TOOL_TYPES.POINTER) {
              if (!isDrawing) {
                // First click - start drawing
                console.log("Starting drawing at:", { x: xValue, y: yValue });
                setStartPoint({ x: xValue, y: yValue });
                setIsDrawing(true);
              } else {
                // Second click - complete drawing
                const endPoint = { x: xValue, y: yValue };
                console.log("Completing drawing at:", endPoint);
                
                // Create different annotation types based on the active tool
                switch (activeTool) {
                  case TOOL_TYPES.TRENDLINE:
                    addTrendline(startPoint, endPoint);
                    break;
                  case TOOL_TYPES.SWING_POINT:
                    addSwingPoint(endPoint);
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
                if (activeTool !== TOOL_TYPES.SWING_POINT) {
                  setActiveTool(TOOL_TYPES.POINTER);
                }
              }
            }
          }
        }
      },
      title: {
        text: '',
      },
      rangeSelector: {
        enabled: false
      },
      navigator: {
        enabled: false
      },
      scrollbar: {
        enabled: false
      },
      xAxis: {
        type: 'datetime',
        labels: {
          style: {
            color: darkMode ? '#e0e0e0' : '#333'
          }
        },
        lineColor: darkMode ? '#444' : '#eee',
        tickColor: darkMode ? '#444' : '#eee'
      },
      yAxis: {
        title: {
          text: 'Price (USD)',
          style: {
            color: darkMode ? '#e0e0e0' : '#333'
          }
        },
        labels: {
          style: {
            color: darkMode ? '#e0e0e0' : '#333'
          }
        },
        gridLineColor: darkMode ? '#333' : '#f5f5f5'
      },
      series: [{
        type: 'candlestick',
        name: 'Price',
        data: ohlcData,
        color: '#ef5350',
        upColor: '#66bb6a',
        lineColor: '#ef5350',
        upLineColor: '#66bb6a',
        tooltip: {
          valueDecimals: 2
        }
      }],
      tooltip: {
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        style: {
          color: darkMode ? '#e0e0e0' : '#333'
        },
        borderColor: darkMode ? '#444' : '#ddd'
      },
      credits: {
        enabled: false
      }
    };
  };

  // Handle chart creation callback
  const handleChartCreated = (chart) => {
    console.log("Chart instance created:", chart);
    
    if (!chart) {
      console.error("Invalid chart instance");
      return;
    }
    
    // Reset any previous charts to avoid duplicates
    if (chartInstance) {
      console.log("Cleaning up previous chart instance");
      setChartInstance(null);
    }
    
    // Ensure the chart is ready to use annotations
    if (!chart.annotations) {
      console.log("Initializing annotations in chart");
      chart.annotations = { allItems: [] };
    }
    
    // Set up event handlers if needed
    chart.update({
      chart: {
        events: {
          click: handleChartClick
        }
      }
    }, false);
    
    // Store chart instance
    setChartInstance(chart);
    console.log("Chart successfully initialized with annotations support");
  };

  // Handle tool selection
  const handleToolSelect = (tool) => {
    console.log("Tool selected:", tool);
    
    // Reset drawing state when changing tools
    if (isDrawing) {
      setIsDrawing(false);
      setStartPoint(null);
    }
    
    // Set the new active tool
    setActiveTool(tool);
    
    // If no chart instance, just exit
    if (!chartInstance) {
      console.warn("Chart instance not available for tool selection");
      return;
    }
    
    try {
      // Configure chart behavior based on selected tool
      // Enable/disable chart zooming based on tool
      chartInstance.update({
        chart: {
          zooming: {
            enabled: tool === TOOL_TYPES.POINTER
          },
          panning: {
            enabled: tool === TOOL_TYPES.POINTER
          }
        }
      }, false);
      
      // Add cursor style based on tool
      let cursor = 'default';
      switch (tool) {
        case TOOL_TYPES.POINTER:
          cursor = 'default';
          break;
        case TOOL_TYPES.TRENDLINE:
        case TOOL_TYPES.FIBONACCI:
        case TOOL_TYPES.FVG:
          cursor = 'crosshair';
          break;
        case TOOL_TYPES.SWING_POINT:
          cursor = 'pointer';
          break;
        default:
          cursor = 'default';
      }
      
      // Apply cursor style to chart container
      if (chartInstance.container) {
        chartInstance.container.style.cursor = cursor;
      }
      
      console.log(`Tool ${tool} ready to use`);
    } catch (error) {
      console.error("Error configuring chart for tool:", error);
    }
  };

  // Handle click on the chart
  const handleChartClick = (event) => {
    if (activeTool === TOOL_TYPES.POINTER || !chartInstance) return;
    
    // Get the click coordinates in terms of the chart data
    const xValue = event.xAxis[0].value;
    const yValue = event.yAxis[0].value;
    
    // Process based on which tool is active
    console.log("Processing click with active tool:", activeTool);
    
    // Get the tool type and handle accordingly
    switch (activeTool) {
      case TOOL_TYPES.POINTER:
        // Just a regular click, do nothing special
        console.log("Regular pointer click, no drawing action");
        break;
        
      case TOOL_TYPES.SWING_POINT:
        // Swing points only need one click - add immediately
        console.log("Adding swing point at:", { x: xValue, y: yValue });
        addSwingPoint({ x: xValue, y: yValue });
        break;
        
      case TOOL_TYPES.TRENDLINE:
      case TOOL_TYPES.FIBONACCI:
      case TOOL_TYPES.FVG:
        // These tools need two points (start and end)
        if (!isDrawing) {
          // First click - start drawing
          console.log("Starting drawing at:", { x: xValue, y: yValue });
          setStartPoint({ x: xValue, y: yValue });
          setIsDrawing(true);
        } else {
          // Second click - complete drawing
          const endPoint = { x: xValue, y: yValue };
          console.log("Completing drawing at:", endPoint);
          
          // Create annotation based on the active tool
          if (activeTool === TOOL_TYPES.TRENDLINE) {
            addTrendline(startPoint, endPoint);
          } else if (activeTool === TOOL_TYPES.FIBONACCI) {
            addFibonacciRetracement(startPoint, endPoint);
          } else if (activeTool === TOOL_TYPES.FVG) {
            addFairValueGap(startPoint, endPoint);
          }
          
          // Reset drawing state
          setIsDrawing(false);
          setStartPoint(null);
          
          // If we're drawing swing points, don't reset the tool
          if (activeTool !== TOOL_TYPES.SWING_POINT) {
            setActiveTool(TOOL_TYPES.POINTER);
            
            // Re-enable chart zooming
            chartInstance.update({
              chart: {
                zooming: {
                  enabled: true
                }
              }
            }, false);
          }
        }
        break;
      default:
        break;
    }
  };

  // Add a trendline annotation
  const addTrendline = (start, end) => {
    if (!chartInstance) {
      console.error("Chart instance not available");
      return;
    }
    
    try {
      console.log("Adding trendline from", start, "to", end);
      
      // Create a unique ID for this annotation
      const id = `trendline-${Date.now()}`;
      
      // Create the simplest possible annotation
      const annotation = {
        labels: [],
        labelOptions: {
          style: {
            color: '#3f51b5'
          }
        },
        shapes: [{
          type: 'path',
          points: [
            { x: start.x, y: start.y },
            { x: end.x, y: end.y }
          ],
          markerEnd: 'arrow',
          stroke: '#3f51b5',
          strokeWidth: 2
        }],
        draggable: true,
        id: id
      };
      
      console.log("Annotation config:", annotation);
      
      // Try to add the annotation
      if (typeof chartInstance.addAnnotation === 'function') {
        chartInstance.addAnnotation(annotation);
        console.log("Annotation added successfully");
      } else {
        console.error("addAnnotation method not available");
        if (chartInstance.renderer) {
          // Fallback: Draw directly on the chart
          console.log("Falling back to renderer");
          chartInstance.renderer
            .path(['M', chartInstance.xAxis[0].toPixels(start.x), chartInstance.yAxis[0].toPixels(start.y),
                   'L', chartInstance.xAxis[0].toPixels(end.x), chartInstance.yAxis[0].toPixels(end.y)])
            .attr({
              'stroke-width': 2,
              'stroke': '#3f51b5',
              'zIndex': 5
            })
            .add();
        }
      }
      
      // Add to local state
      const newDrawing = {
        id,
        type: TOOL_TYPES.TRENDLINE,
        points: [start, end]
      };
      
      updateDrawings(newDrawing);
    } catch (error) {
      console.error('Failed to add trendline annotation:', error, error.stack);
    }
  };

  // Add a swing point annotation
  const addSwingPoint = (point) => {
    if (!chartInstance) {
      console.error("Chart instance not available");
      return;
    }
    
    try {
      console.log("Adding swing point at position:", point);
      
      // Create a unique ID for this annotation
      const id = `swingPoint-${Date.now()}`;
      
      // Try using the standard annotation API first
      if (typeof chartInstance.addAnnotation === 'function') {
        const annotation = {
          shapes: [{
            type: 'circle',
            point: { x: point.x, y: point.y },
            r: 8,
            fill: '#4CAF50'
          }],
          draggable: true,
          id: id
        };
        
        chartInstance.addAnnotation(annotation);
        console.log("Swing point added via annotation API");
      } 
      // Fallback to renderer method if annotation API fails
      else if (chartInstance.renderer) {
        console.log("Using renderer fallback for swing point");
        const x = chartInstance.xAxis[0].toPixels(point.x);
        const y = chartInstance.yAxis[0].toPixels(point.y);
        
        chartInstance.renderer.circle(x, y, 8)
          .attr({
            fill: '#4CAF50',
            stroke: '#388E3C',
            'stroke-width': 2,
            zIndex: 10
          })
          .add();
        
        console.log("Swing point added via renderer at:", x, y);
      }
      else {
        throw new Error("No suitable method found to add swing point");
      }
      
      // Add to local state
      const newDrawing = {
        id,
        type: TOOL_TYPES.SWING_POINT,
        points: [point]
      };
      
      updateDrawings(newDrawing);
      console.log("Swing point registered in drawings:", drawings.length + 1);
    } catch (error) {
      console.error('Failed to add swing point:', error);
      // Try one more fallback method
      try {
        const x = chartInstance.xAxis[0].toPixels(point.x);
        const y = chartInstance.yAxis[0].toPixels(point.y);
        
        // Use direct SVG element creation
        const svgNS = "http://www.w3.org/2000/svg";
        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", 8);
        circle.setAttribute("fill", "#4CAF50");
        circle.setAttribute("stroke", "#388E3C");
        circle.setAttribute("stroke-width", 2);
        
        // Get the chart's SVG element and append the circle
        const svg = chartInstance.container.querySelector("svg");
        if (svg) {
          svg.appendChild(circle);
          console.log("Swing point added via direct SVG manipulation");
          
          // Add to local state
          const newDrawing = {
            id: `swingPoint-${Date.now()}`,
            type: TOOL_TYPES.SWING_POINT,
            points: [point]
          };
          
          updateDrawings(newDrawing);
        }
      } catch (secondError) {
        console.error("All swing point addition methods failed:", secondError);
      }
    }
  };

  // Add a Fibonacci retracement annotation
  const addFibonacciRetracement = (start, end) => {
    if (!chartInstance) return;
    
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
    
    chartInstance.addAnnotation(annotation);
    
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
    if (!chartInstance) return;
    
    const id = `fvg-${Date.now()}`;
    
    // Create rectangle between the points
    const annotation = {
      type: 'basicAnnotation',
      typeOptions: {},
      draggable: true,
      shapes: [{
        type: 'rect',
        point: {
          x: start.x,
          y: Math.min(start.y, end.y)
        },
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
    
    chartInstance.addAnnotation(annotation);
    
    // Add to local state
    const newDrawing = {
      id,
      type: TOOL_TYPES.FVG,
      points: [start, end]
    };
    
    updateDrawings(newDrawing);
  };

  // Update drawings state
  const updateDrawings = (newDrawing) => {
    const updatedDrawings = [...drawings, newDrawing];
    setDrawings(updatedDrawings);
  };

  // Update drawings from chart annotations
  const updateDrawingsFromAnnotations = () => {
    if (!chartInstance) return;
    
    // Safely access annotations
    const annotations = chartInstance.annotations ? 
      (chartInstance.annotations.allItems || []) : [];
    
    // Map annotations to drawings format if needed
    console.log("Current annotations:", annotations.length);
  };

  // Clear all annotations
  const handleClearAll = () => {
    if (!chartInstance) {
      console.error("No chart instance available");
      return;
    }
    
    try {
      console.log("Attempting to clear all annotations");
      
      // Check if annotations exist
      if (!chartInstance.annotations || !chartInstance.annotations.allItems) {
        console.log("No annotations to clear");
        return;
      }
      
      // Make a copy of the array since we'll be modifying it while iterating
      const annotations = [...chartInstance.annotations.allItems];
      
      // Remove each annotation
      annotations.forEach(annotation => {
        if (annotation && typeof annotation.destroy === 'function') {
          annotation.destroy();
        }
      });
      
      // Clear local state
      setDrawings([]);
      console.log("All annotations cleared successfully");
    } catch (error) {
      console.error("Error clearing annotations:", error);
      alert("Could not clear annotations. Please try again.");
    }
  };

  // Handle submission of analysis
  const handleSubmitAnalysis = () => {
    // Validate that the user has made the required drawings based on the exam type
    if (drawings.length === 0) {
      alert('Please add at least one drawing to the chart before submitting.');
      return;
    }

    // Count drawing types to validate against exam requirements
    const drawingTypes = drawings.reduce((counts, drawing) => {
      counts[drawing.type] = (counts[drawing.type] || 0) + 1;
      return counts;
    }, {});

    // Check specific requirements for each exam type
    if (examType === 'swing-points' && (!drawingTypes.swingPoint || drawingTypes.swingPoint < 6)) {
      alert('Please mark at least 6 swing points (3 highs and 3 lows) before submitting.');
      return;
    }

    if (examType === 'fibonacci' && (!drawingTypes.fibonacci || drawingTypes.fibonacci < 1)) {
      alert('Please draw at least one Fibonacci retracement before submitting.');
      return;
    }

    if (examType === 'fvg' && (!drawingTypes.fvg || drawingTypes.fvg < 2)) {
      alert('Please identify at least 2 Fair Value Gaps before submitting.');
      return;
    }

    // If validation passes, we would submit the drawings to the backend
    alert('Analysis submitted successfully! Your results will be available soon.');
    
    // In a real implementation, you would send the drawings to the server
    // and redirect to a results page
  };

  if (!examType || !examConfigs[examType]) {
    return (
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '40px 20px', 
        textAlign: 'center',
        color: darkMode ? '#e0e0e0' : '#333'
      }}>
        <div style={{ 
          backgroundColor: darkMode ? '#332d10' : '#fff9c4', 
          padding: '20px', 
          borderRadius: '8px', 
          color: darkMode ? '#ffee58' : '#f57f17' 
        }}>
          <p>Invalid exam type selected. Please return to the exam selection page.</p>
          <Link
            href="/chart-exam"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              marginTop: '15px',
              fontWeight: 'bold'
            }}
          >
            Back to Exam Selection
          </Link>
        </div>
      </div>
    );
  }

  // Get exam config for the selected exam type
  const config = examConfigs[examType];

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '40px 20px',
      color: darkMode ? '#e0e0e0' : '#333'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        color: darkMode ? '#e0e0e0' : '#333'
      }}>
        {config.title}
      </h1>

      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : '#f8f9fa',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px',
        boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <p style={{ 
          marginBottom: '15px',
          lineHeight: '1.6',
          color: darkMode ? '#b0b0b0' : '#555'
        }}>
          {config.description}
        </p>
        <div style={{
          backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '15px',
          borderLeft: '4px solid #2196F3'
        }}>
          <p style={{
            color: darkMode ? '#e0e0e0' : '#333',
            fontWeight: 'bold',
            marginBottom: '5px'
          }}>Instructions:</p>
          <p style={{
            color: darkMode ? '#b0b0b0' : '#555',
          }}>
            {config.instructions}
          </p>
        </div>
      </div>

      {!chartData && (
        <div style={{
          backgroundColor: darkMode ? '#262626' : 'white',
          borderRadius: '8px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            marginBottom: '20px',
            color: darkMode ? '#e0e0e0' : '#333',
            fontSize: '1.3rem'
          }}>
            Select Chart Settings
          </h2>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <div>
              <label 
                htmlFor="cryptoSelect" 
                style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  color: darkMode ? '#b0b0b0' : '#555',
                  fontWeight: '500'
                }}
              >
                Cryptocurrency:
              </label>
              <select 
                id="cryptoSelect"
                value={selectedCrypto}
                onChange={handleCryptoChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: darkMode ? '#333' : 'white',
                  color: darkMode ? '#e0e0e0' : '#333',
                  border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              >
                {config.cryptoAssets.map(asset => (
                  <option key={asset} value={asset}>
                    {asset.charAt(0).toUpperCase() + asset.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label 
                htmlFor="timeframeSelect" 
                style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  color: darkMode ? '#b0b0b0' : '#555',
                  fontWeight: '500'
                }}
              >
                Timeframe (Days):
              </label>
              <select 
                id="timeframeSelect"
                value={selectedTimeframe}
                onChange={handleTimeframeChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: darkMode ? '#333' : 'white',
                  color: darkMode ? '#e0e0e0' : '#333',
                  border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              >
                {config.timeframes.map(days => (
                  <option key={days} value={days}>
                    {days} Days
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleStartExam}
              style={{
                padding: '15px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Start Exam
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ marginBottom: '30px' }}>
          <CryptoLoader 
            ref={cryptoLoaderRef} 
            message="Loading chart data..." 
            height="500px" 
            minDisplayTime={1500}
          />
        </div>
      )}

      {error && (
        <div style={{ 
          backgroundColor: darkMode ? '#3a181a' : '#ffebee', 
          padding: '20px', 
          borderRadius: '8px', 
          color: darkMode ? '#ff8a80' : '#d32f2f',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            style={{
              padding: '8px 16px',
              backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '4px',
              color: darkMode ? '#e0e0e0' : '#333',
              marginTop: '15px',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {chartData && !loading && chartOptions && (
        <div style={{
          backgroundColor: darkMode ? '#262626' : 'white',
          borderRadius: '8px',
          padding: '30px',
          marginBottom: '30px',
          position: 'relative',
          boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            marginBottom: '20px',
            color: darkMode ? '#e0e0e0' : '#333',
            fontSize: '1.3rem'
          }}>
            Chart Analysis
          </h2>
          
          {/* Drawing Tools Toolbar */}
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
          
          {/* Instructions for the current tool */}
          <div style={{
            padding: '10px 15px',
            backgroundColor: darkMode ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.1)',
            borderRadius: '4px',
            marginBottom: '15px',
            color: darkMode ? '#ffd54f' : '#ff8f00',
            border: `1px solid ${darkMode ? '#ffb300' : '#ffe082'}`
          }}>
            {activeTool === TOOL_TYPES.POINTER && (
              <p style={{ margin: 0 }}><strong>Pointer Tool:</strong> Use to pan and zoom the chart. Click and drag to move.</p>
            )}
            {activeTool === TOOL_TYPES.SWING_POINT && (
              <p style={{ margin: 0 }}><strong>Swing Point Tool:</strong> Click directly on the chart to mark important swing highs and lows.</p>
            )}
            {activeTool === TOOL_TYPES.TRENDLINE && (
              <p style={{ margin: 0 }}><strong>Trendline Tool:</strong> Click once to start the line, then click again to complete it.</p>
            )}
            {activeTool === TOOL_TYPES.FIBONACCI && (
              <p style={{ margin: 0 }}><strong>Fibonacci Tool:</strong> Click at the start of a trend, then click again at the end to draw retracement levels.</p>
            )}
            {activeTool === TOOL_TYPES.FVG && (
              <p style={{ margin: 0 }}><strong>FVG Tool:</strong> Click at one corner of the gap, then click at the opposite corner to highlight it.</p>
            )}
          </div>
          
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
          
          <div style={{ position: 'relative' }}>
            <HighchartsReact
              highcharts={Highcharts}
              constructorType={'stockChart'}
              options={chartOptions}
              callback={handleChartCreated}
              ref={chartRef}
              containerProps={{ 
                style: { 
                  height: '600px',
                  cursor: activeTool === TOOL_TYPES.POINTER ? 'default' : 'crosshair'
                },
                className: 'chart-container'
              }}
              immutable={false}
              allowChartUpdate={true}
              updateArgs={[true, true, true]}
              onClick={(e) => console.log("Chart container clicked", e)}
            />
          </div>
          
          <div style={{ 
            marginTop: '30px',
            backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            padding: '15px',
            borderRadius: '8px',
          }}>
            <p style={{
              color: darkMode ? '#b0b0b0' : '#555',
              marginBottom: '15px'
            }}>
              <span style={{ fontWeight: 'bold', color: darkMode ? '#e0e0e0' : '#333' }}>Drawing Count:</span> {drawings.length} {drawings.length === 1 ? 'drawing' : 'drawings'} added
            </p>
            
            {examType === 'swing-points' && (
              <div style={{ 
                backgroundColor: darkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                <p style={{ color: darkMode ? '#81c784' : '#388e3c' }}>
                  <strong>Required:</strong> Mark at least 6 swing points (3 highs and 3 lows)
                </p>
                <p style={{ color: darkMode ? '#81c784' : '#388e3c', marginTop: '5px' }}>
                  <strong>Current:</strong> {drawings.filter(d => d.type === TOOL_TYPES.SWING_POINT).length} swing points marked
                </p>
              </div>
            )}
            
            {examType === 'fibonacci' && (
              <div style={{ 
                backgroundColor: darkMode ? 'rgba(156, 39, 176, 0.1)' : 'rgba(156, 39, 176, 0.1)',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                <p style={{ color: darkMode ? '#ce93d8' : '#7b1fa2' }}>
                  <strong>Required:</strong> Draw at least 1 Fibonacci retracement from a significant low to high (or high to low)
                </p>
                <p style={{ color: darkMode ? '#ce93d8' : '#7b1fa2', marginTop: '5px' }}>
                  <strong>Current:</strong> {drawings.filter(d => d.type === TOOL_TYPES.FIBONACCI).length} Fibonacci retracements drawn
                </p>
              </div>
            )}
            
            {examType === 'fvg' && (
              <div style={{ 
                backgroundColor: darkMode ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                <p style={{ color: darkMode ? '#ffb74d' : '#ef6c00' }}>
                  <strong>Required:</strong> Identify at least 2 Fair Value Gaps
                </p>
                <p style={{ color: darkMode ? '#ffb74d' : '#ef6c00', marginTop: '5px' }}>
                  <strong>Current:</strong> {drawings.filter(d => d.type === TOOL_TYPES.FVG).length} Fair Value Gaps identified
                </p>
              </div>
            )}
          </div>
          
          <div style={{
            marginTop: '30px',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <button
              onClick={handleSubmitAnalysis}
              style={{
                padding: '15px 40px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Submit Analysis
            </button>
          </div>
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        marginTop: '30px'
      }}>
        <Link
          href="/chart-exam"
          style={{
            padding: '12px 25px',
            backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            color: darkMode ? '#e0e0e0' : '#333',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: '500'
          }}
        >
          Back to Exam Selection
        </Link>
      </div>
    </div>
  );
}