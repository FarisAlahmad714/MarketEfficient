import React, { useEffect, useState, useContext, useRef } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import dynamic from 'next/dynamic';
import CryptoLoader from '../CryptoLoader';

// Dynamic import of Plotly to avoid SSR issues
const Plot = dynamic(
  () => import('react-plotly.js'),
  { ssr: false, loading: () => <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading Plotly...</p></div> }
);

const PlotlyChart = ({ 
  data, 
  height = 500, 
  onInitialized = null, 
  onRelayout = null,
  config = {}
}, ref) => {
  const { darkMode } = useContext(ThemeContext);
  const [isReady, setIsReady] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [layout, setLayout] = useState(null);
  const [chartConfig, setChartConfig] = useState(null);
  const plotRef = useRef(null);
  const loaderRef = useRef(null);
  const configRef = useRef(config);
  const plotlyInstanceRef = useRef(null);
  
  useEffect(() => {
    const currentConfigStr = JSON.stringify(configRef.current || {});
    const newConfigStr = JSON.stringify(config || {});
    
    if (currentConfigStr !== newConfigStr) {
      configRef.current = config;
    }
  }, [config]);

  useEffect(() => {
    if (data) {
      const processedData = Array.isArray(data) ? data : [data];
      setChartData(processedData);
      
      const defaultLayout = {
        dragmode: 'pan', // Default to pan mode
        margin: { r: 20, t: 50, b: 50, l: 70 },
        showlegend: false,
        xaxis: {
          autorange: true,
          title: 'Date',
          rangeslider: { visible: false },
          type: 'date',
          color: darkMode ? '#e0e0e0' : '#333'
        },
        yaxis: {
          autorange: true,
          title: 'Price (USD)',
          color: darkMode ? '#e0e0e0' : '#333'
        },
        plot_bgcolor: darkMode ? '#1e1e1e' : '#f8f9fa',
        paper_bgcolor: darkMode ? '#262626' : 'white',
        font: { color: darkMode ? '#e0e0e0' : '#333' },
        height: height
      };
      
      setLayout(defaultLayout);
      
      const currentConfig = configRef.current || {};
      const defaultConfig = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
        displaylogo: false,
        ...currentConfig
      };
      
      setChartConfig(defaultConfig);
      
      const timer = setTimeout(() => {
        setIsReady(true);
        if (loaderRef.current) {
          loaderRef.current.hideLoader();
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [data, darkMode, height]);
  
  // Properly store the Plotly instance when initialized
  const handlePlotInitialized = (figure) => {
    console.log('Plotly chart initialized:', figure);
    plotlyInstanceRef.current = figure;
    
    // Store a reference to the DOM element for easier access
    if (figure && figure.el) {
      // Create _container property to help with DOM operations
      figure._container = figure.el;
    }
    
    if (onInitialized) {
      onInitialized(figure);
    }
  };
  
  const handleRelayout = (eventData) => {
    console.log('Plotly chart relayout:', eventData);
    
    if (onRelayout) {
      onRelayout(eventData);
    }
  };
  
  // Updated function to change the dragmode
  const setDragMode = (mode) => {
    console.log("setDragMode called with:", mode);
    
    try {
      // Try multiple methods to find and update the Plotly element
      if (typeof window !== 'undefined' && window.Plotly) {
        // Method 1: Use the stored plotly instance
        if (plotlyInstanceRef.current && plotlyInstanceRef.current._container) {
          console.log("Using plotlyInstance._container");
          window.Plotly.relayout(plotlyInstanceRef.current._container, { dragmode: mode });
          return true;
        }
        
        // Method 2: Find Plotly element in the DOM
        const plotlyDiv = document.querySelector('.js-plotly-plot');
        if (plotlyDiv) {
          console.log("Using DOM element:", plotlyDiv);
          window.Plotly.relayout(plotlyDiv, { dragmode: mode });
          return true;
        }
      }
      
      console.warn("Could not set dragmode - Plotly not available");
      return false;
    } catch (err) {
      console.error("Error in setDragMode:", err);
      return false;
    }
  };
  
  // Make functions available via ref
  React.useImperativeHandle(ref, () => ({
    setDragMode,
    getPlotlyInstance: () => plotlyInstanceRef.current
  }));
  
  if (!data || !chartData || !layout) {
    return (
      <CryptoLoader
        ref={loaderRef}
        message="Preparing chart data..."
        height={`${height}px`}
        minDisplayTime={1000}
      />
    );
  }
  
  return (
    <div className="plotly-chart-container" style={{ position: 'relative' }}>
      {!isReady && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}>
          <CryptoLoader
            ref={loaderRef}
            message="Rendering chart..."
            height={`${height}px`}
            minDisplayTime={1000}
          />
        </div>
      )}
      
      <Plot
        ref={plotRef}
        data={chartData}
        layout={layout}
        config={chartConfig}
        style={{ width: '100%', height: `${height}px`, opacity: isReady ? 1 : 0 }}
        onInitialized={handlePlotInitialized}
        onRelayout={handleRelayout}
        onError={(err) => console.error('Plotly error:', err)}
      />
    </div>
  );
};

export default React.forwardRef(PlotlyChart);