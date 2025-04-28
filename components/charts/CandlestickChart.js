// components/charts/CandlestickChart.js
import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function CandlestickChart({ data, title, height = 400 }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    // Clean up previous chart if exists
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {
        console.error("Error removing chart:", e);
      }
      chartRef.current = null;
    }

    // Create chart
    try {
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: height,
        layout: {
          background: { type: 'solid', color: '#1e1e2f' },
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
          horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: 'rgba(197, 203, 206, 0.8)',
        },
        rightPriceScale: {
          borderColor: 'rgba(197, 203, 206, 0.8)',
        },
      });

      chartRef.current = chart;

      // Add candlestick series
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderUpColor: '#26a69a',
        borderDownColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      // Format data for chart
      const formattedData = data.map(item => ({
        time: typeof item.date === 'string' ? 
          item.date.replace(/-/g, '-') : // Format ISO date strings
          Math.floor(new Date(item.date).getTime() / 1000), // Convert date objects to unix timestamp
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));

      // Set data
      candlestickSeries.setData(formattedData);

      // Fit content
      chart.timeScale().fitContent();

      // Add title if provided
      if (title) {
        const titleElement = document.createElement('div');
        titleElement.style.position = 'absolute';
        titleElement.style.top = '10px';
        titleElement.style.left = '10px';
        titleElement.style.color = '#d1d4dc';
        titleElement.style.fontSize = '14px';
        titleElement.innerHTML = title;
        chartContainerRef.current.appendChild(titleElement);
      }

      // Handle resize
      const handleResize = () => {
        if (chart && chartContainerRef.current) {
          chart.applyOptions({ 
            width: chartContainerRef.current.clientWidth 
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          try {
            chartRef.current.remove();
            chartRef.current = null;
          } catch (e) {
            console.error("Error removing chart during cleanup:", e);
          }
        }
      };
    } catch (error) {
      console.error("Error creating chart:", error);
    }
  }, [data, height, title]);

  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1e1e2f',
        color: '#d1d4dc',
        borderRadius: '8px'
      }}>
        No chart data available
      </div>
    );
  }

  return (
    <div ref={chartContainerRef} style={{ 
      position: 'relative', 
      width: '100%', 
      height: height,
      borderRadius: '8px',
      overflow: 'hidden'
    }}></div>
  );
}