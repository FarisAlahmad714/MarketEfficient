// components/charts/TVLightChart.js
import React, { useEffect, useRef, useContext } from 'react';
import dynamic from 'next/dynamic';
import { ThemeContext } from '../../contexts/ThemeContext';
import CryptoLoader from '../CryptoLoader';

// Create a placeholder component to show while the chart is loading
const LoadingChart = ({ height = 400 }) => {
  return <CryptoLoader height={`${height}px`} message="Loading chart data..." minDisplayTime={1000} />;
};

// This component will be loaded client-side only
const TVLightChart = ({ data, height = 400 }) => {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
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

  useEffect(() => {
    const handleResize = () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
      }
    };

    const initChart = async () => {
      try {
        if (!chartContainerRef.current) return;

        // We need to ensure the lightweight-charts lib is loaded
        const { createChart } = await import('lightweight-charts');
        
        const chartOptions = {
          width: chartContainerRef.current.clientWidth,
          height: height,
          layout: {
            background: { color: darkMode ? '#1e1e1e' : '#ffffff' },
            textColor: darkMode ? '#d9d9d9' : '#333333',
          },
          grid: {
            vertLines: { color: darkMode ? '#2e2e2e' : '#f0f0f0' },
            horzLines: { color: darkMode ? '#2e2e2e' : '#f0f0f0' },
          },
          crosshair: {
            mode: 1,
            vertLine: {
              width: 1,
              color: darkMode ? '#505050' : '#999999',
              style: 0,
            },
            horzLine: {
              width: 1,
              color: darkMode ? '#505050' : '#999999',
              style: 0,
            },
          },
          timeScale: {
            borderColor: darkMode ? '#505050' : '#d6d6d6',
            timeVisible: true,
            secondsVisible: false,
          },
          rightPriceScale: {
            borderColor: darkMode ? '#505050' : '#d6d6d6',
          },
          handleScale: true,
          handleScroll: true,
        };

        // Create a chart instance
        chartInstanceRef.current = createChart(chartContainerRef.current, chartOptions);
        
        // Format data for TradingView Lightweight Charts
        const formattedData = data.map(item => ({
          time: typeof item.time === 'number' 
            ? item.time 
            : Math.floor(new Date(item.date).getTime() / 1000),
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close
        }));

        // Add candlestick series
        const candlestickSeries = chartInstanceRef.current.addCandlestickSeries({
          upColor: '#4CAF50',
          downColor: '#FF5252',
          borderUpColor: '#4CAF50',
          borderDownColor: '#FF5252',
          wickUpColor: '#4CAF50',
          wickDownColor: '#FF5252',
        });
        
        candlestickSeries.setData(formattedData);
        
        // Fit content to show all data
        chartInstanceRef.current.timeScale().fitContent();

        // Add window resize event listener
        window.addEventListener('resize', handleResize);
      } catch (error) {
      }
    };

    initChart();
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [data, height, darkMode]);

  return (
    <div 
      ref={chartContainerRef} 
      style={{ 
        height: `${height}px`, 
        width: '100%', 
        transition: 'all 0.3s ease',
        borderRadius: '4px',
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff'
      }}
    />
  );
};

// Export a dynamic component with SSR disabled
export default dynamic(
  () => Promise.resolve(TVLightChart),
  { 
    ssr: false,
    loading: LoadingChart
  }
);