// components/charts/VolumeChart.js
import React, { useContext, useEffect, useRef } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

const VolumeChart = ({ data, height = 120, width = '100%' }) => {
  const { darkMode } = useContext(ThemeContext);
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  // Early return if no data or no volume data
  if (!data || data.length === 0 || !data.some(item => item.volume > 0)) {
    return (
      <div style={{ 
        height: `${height}px`, 
        width: width,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: darkMode ? '#1e1e1e' : '#f5f5f5',
        color: darkMode ? '#e0e0e0' : '#666',
        borderRadius: '4px',
        transition: 'all 0.3s ease'
      }}>
        No volume data available
      </div>
    );
  }

  // Initialize chart once when component mounts
  useEffect(() => {
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
        
        // Create chart specifically for volume
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
          timeScale: {
            timeVisible: true,
            borderColor: darkMode ? '#555' : '#ddd',
            rightOffset: 5,
            barSpacing: 6,
          },
          rightPriceScale: {
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            },
            borderColor: darkMode ? '#555' : '#ddd',
          },
        });
        
        // Add volume histogram series
        const volumeSeries = chartRef.current.addHistogramSeries({
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: 'right',
        });
        
        // Format volume data
        const volumeData = data.map(item => {
          let timeValue;
          
          if (typeof item.time === 'number') {
            timeValue = item.time;
          } else if (item.date) {
            try {
              if (typeof item.date === 'string') {
                timeValue = Math.floor(new Date(item.date).getTime() / 1000);
              } else {
                timeValue = Math.floor(item.date / 1000);
              }
            } catch (e) {
              console.error('Invalid date format:', item.date);
              timeValue = Math.floor(Date.now() / 1000) - (86400 * 30);
            }
          } else {
            timeValue = Math.floor(Date.now() / 1000) - (86400 * 30);
          }
          
          // Determine color based on price movement (green for up, red for down)
          const isUp = item.close >= item.open;
          return {
            time: timeValue,
            value: item.volume || 0,
            color: isUp ? '#66bb6a' : '#ef5350',
          };
        });
        
        // Set data and fit to view
        volumeSeries.setData(volumeData);
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
        console.error('Failed to initialize volume chart:', error);
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
        width: width,
        borderRadius: '4px',
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        marginTop: '2px', // Small gap between charts
      }}
    />
  );
};

export default VolumeChart;