// lib/useWebSocketMarketData.js - React hook for REAL market data using your API
import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebSocketMarketData = (symbols = []) => {
  const [marketData, setMarketData] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const updateInterval = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const fetchRealMarketData = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No auth token available');
      }
      
      const symbolsString = symbols.join(',');
      const response = await fetch(`/api/sandbox/market-data?symbols=${symbolsString}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const newMarketData = {};
        data.data.forEach(item => {
          newMarketData[item.symbol] = {
            price: item.price,
            change24h: item.change24h || 0,
            timestamp: Date.now(),
            volume: item.volume || 0,
            source: item.source || 'api'
          };
        });
        
        setMarketData(newMarketData);
        setConnectionStatus('connected');
        setError(null);
        reconnectAttempts.current = 0;
        console.log('✅ Market data updated from API:', Object.keys(newMarketData));
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('❌ Failed to fetch market data:', error);
      setError(error.message);
      setConnectionStatus('error');
      reconnectAttempts.current++;
    }
  }, [symbols]);

  const connectWebSocket = useCallback(() => {
    // Prevent multiple connections
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
    }

    console.log('🔄 Starting real-time market data updates using your API...');
    
    // Initial fetch
    fetchRealMarketData();
    
    // Set up regular updates (every 30 seconds for real-time feel)
    updateInterval.current = setInterval(() => {
      fetchRealMarketData();
    }, 30000);
    
  }, [fetchRealMarketData]);

  const reconnect = useCallback(() => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      console.log(`🔄 Reconnecting... Attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts}`);
      setTimeout(() => {
        connectWebSocket();
      }, 1000 * Math.pow(2, reconnectAttempts.current)); // Exponential backoff
    } else {
      console.error('❌ Max reconnection attempts reached');
      setConnectionStatus('failed');
    }
  }, [connectWebSocket]);

  // Connect on mount and when symbols change
  useEffect(() => {
    if (symbols.length > 0) {
      connectWebSocket();
    }

    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [symbols, connectWebSocket]);

  // Auto-reconnect on error
  useEffect(() => {
    if (connectionStatus === 'error' && reconnectAttempts.current < maxReconnectAttempts) {
      const timeout = setTimeout(() => {
        reconnect();
      }, 5000); // Wait 5 seconds before reconnecting

      return () => clearTimeout(timeout);
    }
  }, [connectionStatus, reconnect]);

  return {
    marketData,
    connectionStatus,
    error,
    reconnect: () => {
      reconnectAttempts.current = 0;
      connectWebSocket();
    }
  };
};

export default useWebSocketMarketData;