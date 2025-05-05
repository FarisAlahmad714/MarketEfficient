// components/charts/CandlestickChart.js
import React, { useContext } from 'react';
import dynamic from 'next/dynamic';
import { ThemeContext } from '../../contexts/ThemeContext';
import CryptoLoader from '../CryptoLoader';

// The loading component stays exactly the same
const LoadingChart = ({ height = 400 }) => {
  return <CryptoLoader height={`${height}px`} message="Loading chart data..." minDisplayTime={2000} />;
};

// The main chart component - this will be client-side only
const CandlestickChartComponent = ({ data, height = 400 }) => {
  const { darkMode } = useContext(ThemeContext);
  const containerRef = React.useRef(null);
  const chartRef = React.useRef(null);
  
  // Early return if no data - exactly like your original
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

  // Initialize chart once when component mounts
  React.useEffect(() => {
    const initializeChart = async () => {
      try {
        // Import TradingView library
        const { createChart } = await import('lightweight-charts');
        
        // Clear any existing chart
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
        
        // Make sure container exists
        if (!containerRef.current) return;
        
        // Create chart with theme colors
        chartRef.current = createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height: height,
          layout: {
            background: { 
              type: 'solid', 
              color: darkMode ? '#1e1e1e' : '#ffffff'
            },
            textColor: darkMode ? '#e0e0e0' : '#333333',
          },
          grid: {
            vertLines: { color: darkMode ? '#2e2e2e' : '#f0f0f0' },
            horzLines: { color: darkMode ? '#2e2e2e' : '#f0f0f0' },
          },
          crosshair: {
            mode: 1,
          },
          timeScale: {
            timeVisible: true,
            borderColor: darkMode ? '#555' : '#ddd',
          },
        });
        
        // Add candlestick series with colors matching your Plotly theme
        const series = chartRef.current.addCandlestickSeries({
          upColor: '#66bb6a',
          downColor: '#ef5350',
          borderUpColor: '#66bb6a',
          borderDownColor: '#ef5350',
          wickUpColor: '#66bb6a',
          wickDownColor: '#ef5350',
        });
        
        // Format data - carefully handling time values
        const formattedData = data.map(item => {
          let timeValue;
          
          if (typeof item.time === 'number') {
            timeValue = item.time;
          } else if (item.date) {
            // Handle date strings
            try {
              if (typeof item.date === 'string') {
                timeValue = Math.floor(new Date(item.date).getTime() / 1000);
              } else {
                timeValue = Math.floor(item.date / 1000);
              }
            } catch (e) {
              console.error('Invalid date format:', item.date);
              // Fallback
              timeValue = Math.floor(Date.now() / 1000) - (86400 * 30);
            }
          } else {
            // Default fallback
            timeValue = Math.floor(Date.now() / 1000) - (86400 * 30);
          }
          
          return {
            time: timeValue,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close
          };
        });
        
        // Set data and fit to view
        series.setData(formattedData);
        chartRef.current.timeScale().fitContent();
        
        // Handle window resize
        const handleResize = () => {
          if (chartRef.current && containerRef.current) {
            chartRef.current.applyOptions({
              width: containerRef.current.clientWidth
            });
            chartRef.current.timeScale().fitContent();
          }
        };
        
        window.addEventListener('resize', handleResize);
        
        // Return cleanup function
        return () => {
          window.removeEventListener('resize', handleResize);
        };
      } catch (error) {
        console.error('Failed to initialize chart:', error);
      }
    };
    
    initializeChart();
    
    // Cleanup when component unmounts
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, height, darkMode]); // Re-initialize when these props change
  
  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative', 
        height: `${height}px`,
        width: '100%',
        borderRadius: '4px',
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff'
      }}
    />
  );
};

// Use the same dynamic import pattern as your original code
export default dynamic(
  () => Promise.resolve(CandlestickChartComponent),
  { 
    ssr: false,
    loading: LoadingChart
  }
);