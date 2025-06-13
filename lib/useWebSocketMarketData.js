// lib/useWebSocketMarketData.js - React hook for WebSocket market data
import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebSocketMarketData = (symbols = []) => {
  const [marketData, setMarketData] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000); // Start with 1 second

  const connectWebSocket = useCallback(() => {
    try {
      // Determine WebSocket URL based on environment
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/api/ws/market-data`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        setError(null);
        reconnectAttempts.current = 0;
        reconnectDelay.current = 1000; // Reset delay
        
        // Subscribe to symbols
        if (symbols.length > 0) {
          ws.current.send(JSON.stringify({
            type: 'subscribe',
            symbols: symbols
          }));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'price_update':
              if (data.data && Array.isArray(data.data)) {
                setMarketData(prevData => {
                  const newData = { ...prevData };
                  data.data.forEach(priceInfo => {
                    newData[priceInfo.symbol] = {
                      price: priceInfo.price,
                      change24h: priceInfo.change24h || 0,
                      timestamp: priceInfo.timestamp,
                      source: 'websocket'
                    };
                  });
                  return newData;
                });
              }
              break;
            
            case 'pong':
              // Heartbeat response
              console.log('WebSocket heartbeat received');
              break;
            
            default:
              console.log('Unknown WebSocket message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect if not a normal close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          setTimeout(() => {
            reconnectAttempts.current++;
            reconnectDelay.current = Math.min(reconnectDelay.current * 2, 10000); // Exponential backoff, max 10s
            console.log(`Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
            connectWebSocket();
          }, reconnectDelay.current);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('Failed to reconnect to WebSocket after multiple attempts');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        setError('WebSocket connection error');
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setError('Failed to create WebSocket connection');
    }
  }, [symbols]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close(1000, 'User initiated disconnect');
      ws.current = null;
    }
  }, []);

  const subscribe = useCallback((newSymbols) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'subscribe',
        symbols: newSymbols
      }));
    }
  }, []);

  const sendHeartbeat = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'ping',
        timestamp: Date.now()
      }));
    }
  }, []);

  // Connect on mount and when symbols change
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      disconnect();
    };
  }, [connectWebSocket, disconnect]);

  // Update subscription when symbols change
  useEffect(() => {
    if (connectionStatus === 'connected' && symbols.length > 0) {
      subscribe(symbols);
    }
  }, [symbols, connectionStatus, subscribe]);

  // Heartbeat interval
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const heartbeatInterval = setInterval(sendHeartbeat, 30000); // Every 30 seconds
      
      return () => {
        clearInterval(heartbeatInterval);
      };
    }
  }, [connectionStatus, sendHeartbeat]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttempts.current = 0;
    reconnectDelay.current = 1000;
    setTimeout(connectWebSocket, 100);
  }, [disconnect, connectWebSocket]);

  return {
    marketData,
    connectionStatus,
    error,
    reconnect,
    subscribe,
    disconnect
  };
};

export default useWebSocketMarketData;