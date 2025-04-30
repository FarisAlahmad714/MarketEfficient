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
}) => {
  const { darkMode } = useContext(ThemeContext);
  const [isReady, setIsReady] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [layout, setLayout] = useState(null);
  const [chartConfig, setChartConfig] = useState(null);
  const plotRef = useRef(null);
  const loaderRef = useRef(null);

  useEffect(() => {
    // Prepare the data structure for Plotly
    if (data) {
      // If data is already in Plotly format, use it directly
      const processedData = Array.isArray(data) ? data : [data];
      setChartData(processedData);
      
      // Set up the default layout
      const defaultLayout = {
        dragmode: 'zoom',
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
      
      // Set up the default config
      const defaultConfig = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
        displaylogo: false,
        ...config
      };
      
      setChartConfig(defaultConfig);
      
      // Mark as ready after a brief delay to ensure proper rendering
      const timer = setTimeout(() => {
        setIsReady(true);
        if (loaderRef.current) {
          loaderRef.current.hideLoader();
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [data, darkMode, height, config]);
  
  // Handle chart initialization
  const handlePlotInitialized = (figure) => {
    if (onInitialized) {
      onInitialized(figure);
    }
  };
  
  // Handle layout changes (like zooming)
  const handleRelayout = (eventData) => {
    if (onRelayout) {
      onRelayout(eventData);
    }
  };
  
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

export default PlotlyChart; 