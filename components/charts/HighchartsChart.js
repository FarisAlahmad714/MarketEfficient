// components/charts/HighchartsChart.js
import React, { useEffect, useState, useContext, useRef } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import CryptoLoader from '../CryptoLoader';

// Import additional Highcharts modules
import AnnotationsModule from 'highcharts/modules/annotations';

// Initialize the modules
AnnotationsModule(Highcharts);
// Note: Fibonacci retracements will be implemented using regular annotations

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
  const chartRef = useRef(null);
  const loaderRef = useRef(null);

  useEffect(() => {
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
          }
        },
        title: {
          text: '',
          style: {
            color: darkMode ? '#e0e0e0' : '#333'
          }
        },
        rangeSelector: {
          enabled: false // Disable the range selector for now
        },
        navigator: {
          enabled: false // Disable the navigator for now
        },
        scrollbar: {
          enabled: false // Disable the scrollbar for now
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
            text: 'Price (USD)',
            style: {
              color: darkMode ? '#e0e0e0' : '#333'
            }
          },
          labels: {
            style: {
              color: darkMode ? '#e0e0e0' : '#333'
            }
          },
          gridLineColor: darkMode ? '#333' : '#f5f5f5'
        },
        series: [{
          type: 'candlestick',
          name: 'Price',
          data: ohlcData,
          color: '#ef5350', // Bearish/down candle color
          upColor: '#66bb6a', // Bullish/up candle color
          lineColor: '#ef5350', // Bearish/down candle border color
          upLineColor: '#66bb6a', // Bullish/up candle border color
          tooltip: {
            valueDecimals: 2
          }
        }],
        tooltip: {
          backgroundColor: darkMode ? '#1e1e1e' : 'white',
          style: {
            color: darkMode ? '#e0e0e0' : '#333'
          },
          borderColor: darkMode ? '#444' : '#ddd'
        },
        // Enable annotations (drawing tools)
        annotations: {
          events: {
            afterUpdate: function() {
              // Callback after an annotation is updated
              if (onSelection) {
                const annotations = this.chart.annotations.allItems;
                onSelection(annotations);
              }
            }
          }
        },
        // Merge in any additional config passed as props
        ...config
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
  }, [data, darkMode, height, config]);

  // Handle chart creation/reference
  const afterChartCreated = (chart) => {
    if (onChartCreated) {
      onChartCreated(chart);
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
        containerProps={{ style: { width: '100%', height: `${height}px`, opacity: isReady ? 1 : 0 } }}
        callback={afterChartCreated}
        ref={chartRef}
      />
    </div>
  );
};

export default HighchartsChart;