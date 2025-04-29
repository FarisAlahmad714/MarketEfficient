import React, { useContext } from 'react';
import dynamic from 'next/dynamic';
import { ThemeContext } from '../../contexts/ThemeContext';
import CryptoLoader from '../CryptoLoader'; // Import the new loader

// Create a placeholder component to show while the chart is loading
const LoadingChart = ({ height = 400 }) => {
  // Use the CryptoLoader instead of the simple loading text
  return <CryptoLoader height={`${height}px`} message="Loading chart data..." />;
};

// Export a dynamic component with SSR disabled
const CandlestickChart = ({ data, height = 400 }) => {
  const { darkMode } = useContext(ThemeContext);
  
  // Early return if no data
  if (!data || data.length === 0) {
    return (
      <div 
        style={{ 
          height: `${height}px`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: darkMode ? '#1e1e1e' : '#f5f5f5',
          color: darkMode ? '#e0e0e0' : '#666',
          borderRadius: '4px',
          transition: 'all 0.3s ease'
        }}
      >
        No chart data available
      </div>
    );
  }

  // We'll use the client-side only Plot component
  const Plot = require('react-plotly.js').default;

  const chartData = {
    x: data.map(item => new Date(item.date)),
    open: data.map(item => item.open),
    high: data.map(item => item.high),
    low: data.map(item => item.low),
    close: data.map(item => item.close),
    type: 'candlestick',
    increasing: { line: { color: '#66bb6a' } },
    decreasing: { line: { color: '#ef5350' } },
  };

  const bgColor = darkMode ? '#1e1e1e' : '#ffffff';
  const textColor = darkMode ? '#e0e0e0' : '#333333';

  const layout = {
    dragmode: 'zoom',
    margin: { r: 20, t: 50, b: 50, l: 70 },
    showlegend: false,
    xaxis: { autorange: true, title: 'Date', rangeslider: { visible: false }, color: textColor },
    yaxis: { autorange: true, title: 'Price', color: textColor },
    plot_bgcolor: bgColor,
    paper_bgcolor: bgColor,
    font: { color: textColor },
  };

  return (
    <Plot
      data={[chartData]}
      layout={layout}
      style={{ width: '100%', height }}
      config={{ responsive: true }}
    />
  );
};

// This creates a new component with SSR disabled
export default dynamic(
  () => Promise.resolve(CandlestickChart),
  { 
    ssr: false,
    loading: LoadingChart
  }
);