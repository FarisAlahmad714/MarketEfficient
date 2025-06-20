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
const CandlestickChartComponent = ({ data, height = 400, timeframe = 'daily' }) => {
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
        
        // Configure timeframe-specific chart settings
        const getTimeframeConfig = (tf) => {
          const configs = {
            '4h': { barSpacing: 8, rightOffset: 10 },
            'daily': { barSpacing: 6, rightOffset: 5 },
            'weekly': { barSpacing: 12, rightOffset: 3 },
            'monthly': { barSpacing: 15, rightOffset: 2 }
          };
          return configs[tf] || configs['daily'];
        };
        
        const timeframeConfig = getTimeframeConfig(timeframe);
        
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
            secondsVisible: false,
            borderColor: darkMode ? '#555' : '#ddd',
            rightOffset: timeframeConfig.rightOffset,
            barSpacing: timeframeConfig.barSpacing,
            fixLeftEdge: false,
            fixRightEdge: false,
            lockVisibleTimeRangeOnResize: true,
          },
          rightPriceScale: {
            borderColor: darkMode ? '#555' : '#ddd',
          },
        });
        
        // Add candlestick series with colors matching your Plotly theme
        const candlestickSeries = chartRef.current.addCandlestickSeries({
          upColor: '#66bb6a',
          downColor: '#ef5350',
          borderUpColor: '#66bb6a',
          borderDownColor: '#ef5350',
          wickUpColor: '#66bb6a',
          wickDownColor: '#ef5350',
        });
        
        // Format data - carefully handling time values with proper timezone handling
        const formattedData = data.map((item, index) => {
          let timeValue;
          
          if (typeof item.time === 'number') {
            // If already a timestamp, use it
            timeValue = item.time > 1000000000000 ? Math.floor(item.time / 1000) : item.time;
          } else if (item.date) {
            // Handle date strings with proper parsing
            try {
              let dateObj;
              if (typeof item.date === 'string') {
                // Parse ISO string and ensure UTC interpretation
                dateObj = new Date(item.date);
                // Check if date is valid
                if (isNaN(dateObj.getTime())) {
                  throw new Error('Invalid date');
                }
              } else if (item.date instanceof Date) {
                dateObj = item.date;
              } else {
                // Assume it's a timestamp
                dateObj = new Date(item.date);
              }
              
              // Convert to Unix timestamp (seconds since epoch)
              timeValue = Math.floor(dateObj.getTime() / 1000);
              
              // Validate the timestamp is reasonable (not in the future, not too old)
              const now = Math.floor(Date.now() / 1000);
              const oneYearAgo = now - (365 * 24 * 60 * 60);
              const oneYearFromNow = now + (365 * 24 * 60 * 60);
              
              if (timeValue < oneYearAgo || timeValue > oneYearFromNow) {
                console.warn('Timestamp seems out of reasonable range:', item.date, timeValue);
              }
              
            } catch (e) {
              console.error('Invalid date format:', item.date, e);
              // Create fallback timestamp based on index (going backwards in time)
              const now = Math.floor(Date.now() / 1000);
              timeValue = now - ((data.length - index) * 86400); // 1 day intervals as fallback
            }
          } else {
            // Default fallback - create sequential timestamps
            const now = Math.floor(Date.now() / 1000);
            timeValue = now - ((data.length - index) * 86400); // 1 day intervals as fallback
          }
          
          return {
            time: timeValue,
            open: parseFloat(item.open) || 0,
            high: parseFloat(item.high) || 0,
            low: parseFloat(item.low) || 0,
            close: parseFloat(item.close) || 0
          };
        }).filter(item => 
          // Filter out any invalid data points
          !isNaN(item.time) && 
          !isNaN(item.open) && 
          !isNaN(item.high) && 
          !isNaN(item.low) && 
          !isNaN(item.close)
        ).sort((a, b) => a.time - b.time); // Ensure chronological order
        
        // Set data and fit to view
        candlestickSeries.setData(formattedData);
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
  }, [data, height, darkMode, timeframe]); // Re-initialize when these props change
  
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