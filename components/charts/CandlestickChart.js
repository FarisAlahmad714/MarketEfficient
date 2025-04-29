// components/charts/CandlestickChart.js
import React from 'react';
import dynamic from 'next/dynamic';

// Create a placeholder component to show while the chart is loading
const LoadingChart = ({ height = 400 }) => (
  <div 
    style={{ 
      height: `${height}px`, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#1e1e1e',
      color: '#e0e0e0',
      borderRadius: '4px'
    }}
  >
    Loading chart...
  </div>
);

// Export a dynamic component with SSR disabled
const CandlestickChart = ({ data, height = 400 }) => {
  // Early return if no data
  if (!data || data.length === 0) {
    return (
      <div 
        style={{ 
          height: `${height}px`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#1e1e1e',
          color: '#e0e0e0',
          borderRadius: '4px'
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

  const layout = {
    dragmode: 'zoom',
    margin: { r: 20, t: 50, b: 50, l: 70 },
    showlegend: false,
    xaxis: { autorange: true, title: 'Date', rangeslider: { visible: false } },
    yaxis: { autorange: true, title: 'Price' },
    plot_bgcolor: '#1e1e1e',
    paper_bgcolor: '#1e1e1e',
    font: { color: '#e0e0e0' },
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