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
  // FIRST: Remove ALL existing tooltips and clear any global handlers
  const existingTooltips = document.querySelectorAll('#news-tooltip, [id^="news-tooltip"]');
  existingTooltips.forEach(tooltip => {
    if (tooltip.parentNode) {
      tooltip.remove();
    }
  });
  
  // Make sure global function is available as backup
  if (typeof window !== 'undefined') {
    window.hideNewsTooltip = () => {
      const existing = document.getElementById('news-tooltip');
      if (existing && existing.parentNode) {
        existing.remove();
      }
    };
  }
  
  const tooltip = document.createElement('div');
  tooltip.id = 'news-tooltip';
  
  // Check if mobile device
  const isMobile = window.innerWidth <= 768;
  const isVerySmall = window.innerWidth <= 480;
  
  // Calculate position for mobile-friendly display
  let left, top, maxWidth, width;
  
  if (isMobile) {
    // On mobile, use full width with margins and center vertically
    left = 10;
    top = Math.max(20, Math.min(point.y - 150, window.innerHeight - 400));
    maxWidth = window.innerWidth - 20;
    width = 'calc(100vw - 20px)';
  } else {
    // Desktop positioning
    left = Math.min(point.x + 15, window.innerWidth - 420);
    top = Math.max(point.y - 80, 10);
    maxWidth = 400;
    width = 'auto';
  }
  
  tooltip.style.cssText = `
    position: fixed;
    z-index: 10000;
    background: ${darkMode ? '#1a1a1a' : '#ffffff'};
    color: ${darkMode ? '#e0e0e0' : '#333333'};
    border: 2px solid ${getSentimentColor(news.sentiment, darkMode)};
    border-radius: ${isMobile ? '8px' : '12px'};
    padding: ${isVerySmall ? '10px' : isMobile ? '12px' : '16px'};
    max-width: ${maxWidth}px;
    width: ${width};
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    font-size: ${isVerySmall ? '12px' : isMobile ? '13px' : '14px'};
    line-height: 1.4;
    left: ${left}px;
    top: ${top}px;
    pointer-events: auto;
    transform: translateY(-5px);
    animation: slideIn 0.2s ease-out;
    box-sizing: border-box;
    overflow: hidden;
  `;
  
  // Add CSS animation if not already added
  if (!document.getElementById('news-tooltip-styles')) {
    const style = document.createElement('style');
    style.id = 'news-tooltip-styles';
    style.textContent = `
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(-15px); }
        to { opacity: 1; transform: translateY(-5px); }
      }
      #news-close-button:hover {
        background: ${darkMode ? '#555' : '#d0d0d0'} !important;
        transform: scale(1.02) !important;
      }
      #news-close-button:active {
        background: ${darkMode ? '#666' : '#c0c0c0'} !important;
        transform: scale(0.98) !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  const sentimentBadge = `<span style="
    background: ${getSentimentColor(news.sentiment, darkMode)};
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: ${isMobile ? '10px' : '11px'};
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  ">${news.sentiment}</span>`;
  
  const impactBadge = `<span style="
    background: ${news.impact === 'high' ? '#ff5722' : news.impact === 'medium' ? '#ff9800' : '#4caf50'};
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: ${isMobile ? '10px' : '11px'};
    font-weight: bold;
    margin-left: 6px;
    text-transform: uppercase;
  ">${news.impact} IMPACT</span>`;
  
  tooltip.innerHTML = `
    <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
      <div style="font-size: ${isVerySmall ? '18px' : isMobile ? '20px' : '24px'}; margin-right: 8px; flex-shrink: 0;">📰</div>
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: bold; font-size: ${isVerySmall ? '13px' : isMobile ? '14px' : '16px'}; margin-bottom: 8px; line-height: 1.3; word-wrap: break-word;">
          ${news.headline}
        </div>
        <div style="font-size: ${isVerySmall ? '10px' : isMobile ? '11px' : '12px'}; color: ${darkMode ? '#b0b0b0' : '#666'}; margin-bottom: 8px;">
          <strong>📅 ${formatNewsDate(news.date)}</strong>
        </div>
        <div style="margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 4px;">
          ${sentimentBadge}${impactBadge}
        </div>
      </div>
    </div>
    ${news.content ? `
      <div style="
        font-size: ${isVerySmall ? '11px' : isMobile ? '12px' : '13px'}; 
        line-height: 1.4; 
        margin-bottom: 10px;
        padding: 8px;
        background: ${darkMode ? '#2a2a2a' : '#f8f9fa'};
        border-radius: 6px;
        border-left: 3px solid ${getSentimentColor(news.sentiment, darkMode)};
        word-wrap: break-word;
        overflow-wrap: break-word;
      ">
        ${news.content}
      </div>
    ` : ''}
    <div style="
      font-size: ${isVerySmall ? '9px' : isMobile ? '10px' : '11px'}; 
      color: ${darkMode ? '#888' : '#999'}; 
      text-align: ${isMobile ? 'left' : 'right'};
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid ${darkMode ? '#333' : '#eee'};
      word-wrap: break-word;
      margin-bottom: 15px;
    ">
      Source: <strong>${news.source}</strong>
      ${news.url && news.url !== 'null' && news.url !== null && news.url.startsWith('http') ? 
        `<br><a href="${news.url}" target="_blank" rel="noopener noreferrer" style="color: ${getSentimentColor(news.sentiment, darkMode)}; text-decoration: none;">View Original →</a>` : 
        `<br><span style="color: ${darkMode ? '#666' : '#999'}; font-style: italic;">Original link not available</span>`
      }
    </div>
    <div style="text-align: center; margin-top: 15px;">
      <button id="news-close-button" style="
        background: ${darkMode ? '#444' : '#e0e0e0'};
        color: ${darkMode ? '#fff' : '#333'};
        border: 2px solid ${darkMode ? '#666' : '#ccc'};
        border-radius: ${isMobile ? '8px' : '6px'};
        padding: ${isMobile ? '12px 24px' : '8px 16px'};
        font-size: ${isMobile ? '16px' : '14px'};
        font-weight: bold;
        cursor: pointer;
        min-width: ${isMobile ? '120px' : '80px'};
        transition: all 0.2s ease;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      ">
        Close
      </button>
    </div>
  `;
  
  document.body.appendChild(tooltip);
  
  // Enhanced mobile-friendly event handling with new Close button
  const closeBtn = tooltip.querySelector('#news-close-button');
  let isClosing = false;
  
  const closeTooltip = () => {
    if (isClosing) return;
    isClosing = true;
    
    // Add visual feedback on mobile
    if (isMobile && closeBtn) {
      closeBtn.style.background = darkMode ? '#ff2222' : '#ff4444';
      closeBtn.style.transform = 'scale(0.7)';
      closeBtn.style.color = 'white';
      
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
    
    // Direct call instead of relying on global function
    const existing = document.getElementById('news-tooltip');
    if (existing) {
      // Clear any existing timeout
      if (existing._autoHideTimeout) {
        clearTimeout(existing._autoHideTimeout);
        existing._autoHideTimeout = null;
      }
      
      // Run cleanup function if it exists
      if (existing._cleanup) {
        existing._cleanup();
      }
      
      // Add fade out animation
      existing.style.opacity = '0';
      existing.style.transform = 'translateY(-15px)';
      
      // Remove after animation
      setTimeout(() => {
        if (existing.parentNode) {
          existing.remove();
        }
      }, 150);
    }
  };
  
  if (closeBtn) {
    // Add visual press feedback for Close button
    const addPressedState = () => {
      closeBtn.style.background = darkMode ? '#666' : '#ccc';
      closeBtn.style.transform = 'scale(0.95)';
      closeBtn.style.borderColor = darkMode ? '#888' : '#aaa';
    };
    
    const removePressedState = () => {
      closeBtn.style.background = darkMode ? '#444' : '#e0e0e0';
      closeBtn.style.transform = 'scale(1)';
      closeBtn.style.borderColor = darkMode ? '#666' : '#ccc';
    };
    
    // Multiple event types for maximum compatibility
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeTooltip();
    });
    
    closeBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      addPressedState();
    });
    
    closeBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeTooltip();
    });
    
    closeBtn.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      e.stopPropagation();
      removePressedState();
    });
    
    // Fallback for stubborn cases
    closeBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      addPressedState();
    });
    
    closeBtn.addEventListener('mouseup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeTooltip();
    });
  }
  
  // Enhanced click outside to close functionality
  let clickOutsideHandler;
  const setupClickOutside = () => {
    clickOutsideHandler = (e) => {
      // Don't close if clicking on the close button (handled above)
      if (closeBtn && closeBtn.contains(e.target)) {
        return;
      }
      
      // Close if clicking outside the tooltip
      if (!tooltip.contains(e.target)) {
        closeTooltip();
        cleanup();
      }
    };
    
    document.addEventListener('click', clickOutsideHandler, true);
    document.addEventListener('touchend', clickOutsideHandler, true);
  };
  
  const cleanup = () => {
    if (clickOutsideHandler) {
      document.removeEventListener('click', clickOutsideHandler, true);
      document.removeEventListener('touchend', clickOutsideHandler, true);
      clickOutsideHandler = null;
    }
  };
  
  // Delay adding click outside listener to prevent immediate closing
  setTimeout(setupClickOutside, 200);
  
  // Auto-hide functionality with longer time on mobile
  let autoHideTimeout = setTimeout(() => {
    closeTooltip();
    cleanup();
  }, isMobile ? 20000 : 12000);
  
  // Pause auto-hide on interaction
  const pauseAutoHide = () => {
    if (autoHideTimeout) {
      clearTimeout(autoHideTimeout);
      autoHideTimeout = null;
    }
  };
  
  const resumeAutoHide = () => {
    if (!autoHideTimeout) {
      autoHideTimeout = setTimeout(() => {
        closeTooltip();
        cleanup();
      }, 3000);
    }
  };
  
  // Event listeners for pausing auto-hide
  tooltip.addEventListener('mouseenter', pauseAutoHide);
  tooltip.addEventListener('touchstart', pauseAutoHide);
  tooltip.addEventListener('mouseleave', resumeAutoHide);
  
  // Store references for cleanup
  tooltip._autoHideTimeout = autoHideTimeout;
  tooltip._cleanup = cleanup;
};

// Make hideNewsTooltip globally accessible
const hideNewsTooltip = () => {
  const existing = document.getElementById('news-tooltip');
  if (existing) {
    // Clear any existing timeout
    if (existing._autoHideTimeout) {
      clearTimeout(existing._autoHideTimeout);
      existing._autoHideTimeout = null;
    }
    
    // Run cleanup function if it exists
    if (existing._cleanup) {
      existing._cleanup();
    }
    
    // Add fade out animation
    existing.style.opacity = '0';
    existing.style.transform = 'translateY(-15px)';
    
    // Remove after animation
    setTimeout(() => {
      if (existing.parentNode) {
        existing.remove();
      }
    }, 150);
  }
};

// Make function globally accessible for inline handlers - ROBUST VERSION
if (typeof window !== 'undefined') {
  // Create a robust global function that always works
  window.hideNewsTooltip = function() {
    try {
      // Find and remove ALL news tooltips
      const tooltips = document.querySelectorAll('#news-tooltip, [id^="news-tooltip"], .news-tooltip');
      tooltips.forEach(tooltip => {
        if (tooltip.parentNode) {
          // Clear any timeouts
          if (tooltip._autoHideTimeout) {
            clearTimeout(tooltip._autoHideTimeout);
          }
          // Run cleanup
          if (tooltip._cleanup) {
            tooltip._cleanup();
          }
          // Remove immediately
          tooltip.remove();
        }
      });
      
      // Also call the local function if it exists
      if (typeof hideNewsTooltip === 'function') {
        hideNewsTooltip();
      }
    } catch (error) {
      console.error('Error in global hideNewsTooltip:', error);
      // Fallback: just remove any element with news-tooltip id
      const fallback = document.getElementById('news-tooltip');
      if (fallback && fallback.parentNode) {
        fallback.remove();
      }
    }
  };
  
  // Double-check it's available
  if (!window.hideNewsTooltip) {
    console.error('CRITICAL: Failed to register hideNewsTooltip globally');
  } else {
    console.log('Global hideNewsTooltip successfully registered');
  }
}

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
              const threeYearsAgo = now - (3 * 365 * 24 * 60 * 60); // 3 years ago
              const oneMonthFromNow = now + (30 * 24 * 60 * 60); // 1 month in future
              
              if (timeValue < threeYearsAgo || timeValue > oneMonthFromNow) {
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
          const isMobile = window.innerWidth <= 768;
          
          const markers = newsAnnotations.map(annotation => {
            const annotationTime = Math.floor(new Date(annotation.date).getTime() / 1000);
            
            return {
              time: annotationTime,
              position: 'aboveBar',
              color: getSentimentColor(annotation.news.sentiment, darkMode),
              shape: 'circle',
              text: '📰', // News emoji marker
              size: isMobile ? 4 : 3, // Much larger size for better visibility since no hover
              id: `news_${annotationTime}`
            };
          });
          
          candlestickSeries.setMarkers(markers);
          
          // Add handlers for news markers
          let newsTooltipTimeout;
          let lastHoveredAnnotation = null;
          
          // Enhanced hover detection for better mobile support
          chartRef.current.subscribeCrosshairMove((param) => {
            if (param.point && param.time) {
              // Find if we're near a news marker - increased tolerance for mobile
              const tolerance = isMobile ? 14400 : 7200; // 4 hours on mobile, 2 hours on desktop
              const hoveredAnnotation = newsAnnotations.find(annotation => {
                const annotationTime = Math.floor(new Date(annotation.date).getTime() / 1000);
                return Math.abs(param.time - annotationTime) < tolerance;
              });
              
              // Only show tooltip if we're hovering a different annotation or first time
              if (hoveredAnnotation && hoveredAnnotation !== lastHoveredAnnotation) {
                lastHoveredAnnotation = hoveredAnnotation;
                
                // Clear any existing timeout
                clearTimeout(newsTooltipTimeout);
                
                // Show tooltip with a slight delay to avoid flickering
                newsTooltipTimeout = setTimeout(() => {
                  showNewsTooltip(param.point, hoveredAnnotation.news, darkMode);
                }, isMobile ? 200 : 100);
              } else if (!hoveredAnnotation && lastHoveredAnnotation) {
                // Clear when moving away from annotation
                lastHoveredAnnotation = null;
                clearTimeout(newsTooltipTimeout);
                newsTooltipTimeout = setTimeout(() => {
                  hideNewsTooltip();
                }, isMobile ? 500 : 300);
              }
            }
          });
          
          // Enhanced click handler for news display
          chartRef.current.subscribeClick((param) => {
            if (param.point && param.time) {
              const tolerance = isMobile ? 14400 : 7200; // Same increased tolerance for clicks
              const clickedAnnotation = newsAnnotations.find(annotation => {
                const annotationTime = Math.floor(new Date(annotation.date).getTime() / 1000);
                return Math.abs(param.time - annotationTime) < tolerance;
              });
              
              if (clickedAnnotation) {
                // Clear any timeouts for persistent display
                clearTimeout(newsTooltipTimeout);
                lastHoveredAnnotation = clickedAnnotation;
                showNewsTooltip(param.point, clickedAnnotation.news, darkMode);
              } else {
                // Click outside of news markers closes tooltip
                hideNewsTooltip();
                lastHoveredAnnotation = null;
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