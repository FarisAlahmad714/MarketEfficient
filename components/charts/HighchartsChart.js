// components/charts/HighchartsChart.js
import React, { useEffect, useState, useContext, useRef } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import CryptoLoader from '../CryptoLoader';

// Import additional Highcharts modules
import AnnotationsModule from 'highcharts/modules/annotations';
import IndicatorsModule from 'highcharts/indicators/indicators';
import VolumeByPriceModule from 'highcharts/indicators/volume-by-price';

// Initialize the modules only if Highcharts is available and they haven't already been initialized
if (typeof Highcharts === 'object') {
  if (!Highcharts.Annotation) {
    AnnotationsModule(Highcharts);
  }
  if (!Highcharts.seriesTypes.sma) {
    IndicatorsModule(Highcharts);
  }
  if (!Highcharts.seriesTypes.vbp) {
    VolumeByPriceModule(Highcharts);
  }
}

const HighchartsChart = ({ 
  data, 
  height = 500, 
  onChartCreated = null,
  onSelection = null,
  config = {}
}) => {
  const { darkMode } = useContext(ThemeContext);
  const [isReady, setIsReady] = useState(false);
  const [chartOptions, setChartOptions] = useState(null);
  const [chartInstance, setChartInstance] = useState(null);
  const chartRef = useRef(null);
  const loaderRef = useRef(null);
  const configRef = useRef(config);

  // Keep track of config changes
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    // Log availability of Highcharts
    if (typeof window !== 'undefined') {
      console.log("Highcharts availability check:", {
        highchartsAvailable: !!Highcharts,
        annotationsAvailable: !!(Highcharts.Annotation),
        stockAvailable: !!(Highcharts.stockChart)
      });
    }

    // Prepare the data for Highcharts
    if (data) {
      // Convert data to Highcharts format
      const ohlcData = data.map(item => {
        const date = new Date(item.date).getTime(); // Convert date string to timestamp
        return [
          date,
          item.open,
          item.high,
          item.low,
          item.close
        ];
      });

      // Set up default Highcharts options
      const options = {
        chart: {
          type: 'candlestick',
          height: height,
          backgroundColor: darkMode ? '#262626' : 'white',
          style: {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
          },
          events: {
            load: function() {
              // Store chart instance for future reference
              const chart = this;
              console.log("Chart loaded in event handler");
              
              // Notify parent component
              if (typeof onChartCreated === 'function') {
                onChartCreated(chart);
              }
            }
          },
          zoomType: 'xy' // Default zoom type
        },
        credits: {
          enabled: false
        },
        title: {
          text: '',
          style: {
            color: darkMode ? '#e0e0e0' : '#333'
          }
        },
        rangeSelector: {
          enabled: false // Disable the range selector
        },
        navigator: {
          enabled: false // Disable the navigator
        },
        scrollbar: {
          enabled: false // Disable the scrollbar
        },
        xAxis: {
          type: 'datetime',
          labels: {
            style: {
              color: darkMode ? '#e0e0e0' : '#333'
            }
          },
          lineColor: darkMode ? '#444' : '#eee',
          tickColor: darkMode ? '#444' : '#eee'
        },
        yAxis: {
          title: {
            text: 'Price',
            style: {
              color: darkMode ? '#e0e0e0' : '#333'
            }
          },
          labels: {
            style: {
              color: darkMode ? '#e0e0e0' : '#333'
            },
            format: '{value:.2f}'
          },
          gridLineColor: darkMode ? '#333' : '#f5f5f5'
        },
        plotOptions: {
          candlestick: {
            color: '#ef5350', // Bearish/down candle color
            upColor: '#66bb6a', // Bullish/up candle color
            lineColor: '#ef5350', // Bearish/down candle border color
            upLineColor: '#66bb6a', // Bullish/up candle border color
            states: {
              hover: {
                lineWidth: 2
              }
            }
          }
        },
        series: [{
          type: 'candlestick',
          name: 'Price',
          data: ohlcData,
          tooltip: {
            pointFormat: '<span style="color:{point.color}">●</span> <b>{series.name}</b><br/>' +
              'Open: {point.open:.2f}<br/>' +
              'High: {point.high:.2f}<br/>' +
              'Low: {point.low:.2f}<br/>' +
              'Close: {point.close:.2f}<br/>'
          }
        }],
        tooltip: {
          backgroundColor: darkMode ? '#1e1e1e' : 'white',
          style: {
            color: darkMode ? '#e0e0e0' : '#333'
          },
          borderColor: darkMode ? '#444' : '#ddd',
          borderRadius: 8,
          useHTML: true,
          formatter: function() {
            if (!this.points || this.points.length === 0) return false;
            
            const point = this.points[0];
            const date = new Date(point.x);
            return `
              <div style="padding: 5px;">
                <b>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</b><br/>
                <span style="color:${point.point.open < point.point.close ? '#66bb6a' : '#ef5350'}">●</span> <b>${point.series.name}</b><br/>
                <div style="margin-top: 5px;">
                  <div>Open: <b>${point.point.open.toFixed(2)}</b></div>
                  <div>High: <b>${point.point.high.toFixed(2)}</b></div>
                  <div>Low: <b>${point.point.low.toFixed(2)}</b></div>
                  <div>Close: <b>${point.point.close.toFixed(2)}</b></div>
                </div>
              </div>
            `;
          },
          shared: true
        },
        // IMPORTANT FIX: Initialize annotations as an empty array
        annotations: [],
        // Merge in any additional config passed as props
        ...configRef.current
      };

      setChartOptions(options);

      // Set a small timeout to simulate loading and then hide loader
      const timer = setTimeout(() => {
        setIsReady(true);
        if (loaderRef.current) {
          loaderRef.current.hideLoader();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [data, darkMode, height, onChartCreated, onSelection]);

  // Handle chart creation/reference
  const afterChartCreated = (chart) => {
    console.log("Chart created callback", chart);
    setChartInstance(chart);
    
    if (onChartCreated) {
      // Check if we have a valid chart instance
      if (chart && chart.container) {
        console.log("Valid chart instance, calling onChartCreated");
        
        // Make sure annotations are initialized
        if (!chart.annotations) {
          chart.annotations = [];
        }
        
        onChartCreated(chart);
      } else {
        console.warn("Invalid chart instance in callback");
      }
    }
  };

  if (!data || !chartOptions) {
    return (
      <CryptoLoader
        ref={loaderRef}
        message="Preparing chart data..."
        height={`${height}px`}
        minDisplayTime={1000}
      />
    );
  }

  return (
    <div className="highcharts-container" style={{ position: 'relative' }}>
      {!isReady && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}>
          <CryptoLoader
            ref={loaderRef}
            message="Rendering chart..."
            height={`${height}px`}
            minDisplayTime={1000}
          />
        </div>
      )}

      <HighchartsReact
        highcharts={Highcharts}
        constructorType={'stockChart'}
        options={chartOptions}
        containerProps={{ 
          style: { 
            width: '100%', 
            height: `${height}px`, 
            opacity: isReady ? 1 : 0 
          },
          className: 'highcharts-wrapper' 
        }}
        callback={afterChartCreated}
        ref={chartRef}
      />
      
      {/* Debug information (remove this in production) */}
      {process.env.NODE_ENV !== 'production' && (
        <div 
          style={{ 
            position: 'absolute', 
            top: 0, 
            right: 0, 
            background: 'rgba(0,0,0,0.7)', 
            color: 'white', 
            padding: '5px', 
            fontSize: '10px',
            borderRadius: '0 0 0 5px',
            zIndex: 5
          }}
        >
          Chart status: {chartInstance ? 'Ready' : 'Initializing'}
        </div>
      )}
    </div>
  );
};

export default HighchartsChart;