// components/CandlestickChart.js
import React from 'react';
import Plot from 'react-plotly.js';

const CandlestickChart = ({ data, height = 400 }) => {
  if (!data || data.length === 0) return <div>No chart data available</div>;

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

export default CandlestickChart;