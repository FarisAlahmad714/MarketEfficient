// components/charts/CandlestickChart.js
import React, { useContext } from 'react';
import dynamic from 'next/dynamic';
import { ThemeContext } from '../../contexts/ThemeContext';
import CryptoLoader from '../CryptoLoader';

// Helper functions for news annotations
const getSentimentColor = (sentiment, darkMode) => {
  const colors = {
    positive: darkMode ? '#4caf50' : '#2e7d32',
    negative: darkMode ? '#f44336' : '#c62828',
    neutral: darkMode ? '#ff9800' : '#f57c00'
  };
  return colors[sentiment] || colors.neutral;
};

const formatNewsDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  } catch (e) {
    return dateString;
  }
};

const showNewsTooltip = (point, news, darkMode) => {
  // Remove existing tooltip
  hideNewsTooltip();
  
  const tooltip = document.createElement('div');
  tooltip.id = 'news-tooltip';
  tooltip.style.cssText = `
    position: fixed;
    z-index: 9999;
    background: ${darkMode ? '#1a1a1a' : '#ffffff'};
    color: ${darkMode ? '#e0e0e0' : '#333333'};
    border: 2px solid ${getSentimentColor(news.sentiment, darkMode)};
    border-radius: 12px;
    padding: 16px;
    max-width: 400px;
    min-width: 280px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    font-size: 14px;
    line-height: 1.5;
    left: ${Math.min(point.x + 15, window.innerWidth - 420)}px;
    top: ${Math.max(point.y - 80, 10)}px;
    pointer-events: auto;
    cursor: pointer;
    transform: translateY(-10px);
    animation: slideIn 0.2s ease-out;
  `;
  
  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(-10px); }
    }
  `;
  document.head.appendChild(style);
  
  const sentimentBadge = `<span style="
    background: ${getSentimentColor(news.sentiment, darkMode)};
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  ">${news.sentiment}</span>`;
  
  const impactBadge = `<span style="
    background: ${news.impact === 'high' ? '#ff5722' : news.impact === 'medium' ? '#ff9800' : '#4caf50'};
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: bold;
    margin-left: 6px;
    text-transform: uppercase;
  ">${news.impact} IMPACT</span>`;
  
  tooltip.innerHTML = `
    <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
      <div style="font-size: 24px; margin-right: 8px;">📰</div>
      <div style="flex: 1;">
        <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; line-height: 1.3;">
          ${news.headline}
        </div>
        <div style="font-size: 12px; color: ${darkMode ? '#b0b0b0' : '#666'}; margin-bottom: 8px;">
          <strong>📅 ${formatNewsDate(news.date)}</strong>
        </div>
        <div style="margin-bottom: 10px;">
          ${sentimentBadge}${impactBadge}
        </div>
      </div>
    </div>
    ${news.content ? `
      <div style="
        font-size: 13px; 
        line-height: 1.4; 
        margin-bottom: 10px;
        padding: 8px;
        background: ${darkMode ? '#2a2a2a' : '#f8f9fa'};
        border-radius: 6px;
        border-left: 3px solid ${getSentimentColor(news.sentiment, darkMode)};
      ">
        ${news.content}
      </div>
    ` : ''}
    <div style="
      font-size: 11px; 
      color: ${darkMode ? '#888' : '#999'}; 
      text-align: right;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid ${darkMode ? '#333' : '#eee'};
    ">
      Source: <strong>${news.source}</strong>
      ${news.url && news.url !== 'null' && news.url !== null && news.url.startsWith('http') ? 
        ` • <a href="${news.url}" target="_blank" rel="noopener noreferrer" style="color: ${getSentimentColor(news.sentiment, darkMode)}; text-decoration: none;">View Original</a>` : 
        ` • <span style="color: ${darkMode ? '#666' : '#999'}; font-style: italic;">Original link not available</span>`
      }
    </div>
    <div style="
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 16px;
      color: ${darkMode ? '#666' : '#ccc'};
      cursor: pointer;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: ${darkMode ? '#333' : '#f0f0f0'};
    " onclick="hideNewsTooltip()">×</div>
  `;
  
  document.body.appendChild(tooltip);
  
  // Auto-hide after 10 seconds unless hovered
  let autoHideTimeout = setTimeout(() => {
    hideNewsTooltip();
  }, 10000);
  
  tooltip.addEventListener('mouseenter', () => {
    clearTimeout(autoHideTimeout);
  });
  
  tooltip.addEventListener('mouseleave', () => {
    autoHideTimeout = setTimeout(() => {
      hideNewsTooltip();
    }, 2000);
  });
};

const hideNewsTooltip = () => {
  const existing = document.getElementById('news-tooltip');
  if (existing) {
    existing.remove();
  }
};

// The loading component stays exactly the same
const LoadingChart = ({ height = 400 }) => {
  return <CryptoLoader height={`${height}px`} message="Loading chart data..." minDisplayTime={2000} />;
};

// The main chart component - this will be client-side only
const CandlestickChartComponent = ({ data, height = 400, timeframe = 'daily', newsAnnotations = [] }) => {
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
        
        // Add news annotations if provided
        if (newsAnnotations && newsAnnotations.length > 0) {
          const markers = newsAnnotations.map(annotation => {
            const annotationTime = Math.floor(new Date(annotation.date).getTime() / 1000);
            
            return {
              time: annotationTime,
              position: 'aboveBar',
              color: getSentimentColor(annotation.news.sentiment, darkMode),
              shape: 'circle',
              text: '📰', // News emoji marker
              size: 2, // Larger size for better visibility
              id: `news_${annotationTime}`
            };
          });
          
          candlestickSeries.setMarkers(markers);
          
          // Add click handler for news markers
          let newsTooltipTimeout;
          
          chartRef.current.subscribeCrosshairMove((param) => {
            if (param.point && param.time) {
              // Find if we're near a news marker
              const hoveredAnnotation = newsAnnotations.find(annotation => {
                const annotationTime = Math.floor(new Date(annotation.date).getTime() / 1000);
                return Math.abs(param.time - annotationTime) < 7200; // Within 2 hours for better targeting
              });
              
              if (hoveredAnnotation) {
                // Clear any existing timeout
                clearTimeout(newsTooltipTimeout);
                
                // Show tooltip with a slight delay to avoid flickering
                newsTooltipTimeout = setTimeout(() => {
                  showNewsTooltip(param.point, hoveredAnnotation.news, darkMode);
                }, 100);
              } else {
                // Clear timeout and hide tooltip with a delay
                clearTimeout(newsTooltipTimeout);
                newsTooltipTimeout = setTimeout(() => {
                  hideNewsTooltip();
                }, 300);
              }
            }
          });
          
          // Add click handler for persistent news display
          chartRef.current.subscribeClick((param) => {
            if (param.point && param.time) {
              const clickedAnnotation = newsAnnotations.find(annotation => {
                const annotationTime = Math.floor(new Date(annotation.date).getTime() / 1000);
                return Math.abs(param.time - annotationTime) < 7200; // Within 2 hours
              });
              
              if (clickedAnnotation) {
                // Clear any timeouts for persistent display
                clearTimeout(newsTooltipTimeout);
                showNewsTooltip(param.point, clickedAnnotation.news, darkMode);
              }
            }
          });
        }
        
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
  }, [data, height, darkMode, timeframe, newsAnnotations]); // Re-initialize when these props change
  
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