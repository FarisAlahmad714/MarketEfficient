// lib/websocket-server.js - WebSocket server for real-time market data
const { WebSocketServer } = require('ws');
const connectDB = require('./database');
const SandboxTrade = require('../models/SandboxTrade');

// Import sandbox constants dynamically to avoid ES6 module issues
let SANDBOX_ASSETS;
let liquidationChecker = null;

async function loadConstants() {
  if (!SANDBOX_ASSETS) {
    const constants = await import('./sandbox-constants.js');
    SANDBOX_ASSETS = constants.SANDBOX_ASSETS;
  }
}

class MarketDataWebSocketServer {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.prices = new Map();
    this.externalConnections = new Map();
    this.isInitialized = false;
  }

  async initialize(server) {
    if (this.isInitialized) return;

    // Load constants first
    await loadConstants();

    // Create WebSocket server attached to HTTP server
    this.wss = new WebSocketServer({ 
      server,
      path: '/api/ws/market-data'
    });

    this.wss.on('connection', (ws, req) => {
      this.clients.add(ws);

      // Send current prices immediately
      this.sendCurrentPrices(ws);

      // Handle client messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        this.clients.delete(ws);
      });
    });

    this.isInitialized = true;
    
    // Initialize with some test data
    this.initializeTestData();
    
    // Connect to external data sources after a delay
    setTimeout(() => {
      this.connectToExternalSources();
    }, 2000);
  }

  handleClientMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        // Client wants to subscribe to specific symbols
        ws.symbols = data.symbols || this.getAllSymbols();
        this.sendCurrentPrices(ws);
        break;
      
      case 'ping':
        // Heartbeat
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      
      default:
    }
  }

  sendCurrentPrices(ws) {
    const symbols = ws.symbols || this.getAllSymbols();
    const priceData = [];

    symbols.forEach(symbol => {
      const price = this.prices.get(symbol);
      if (price) {
        priceData.push({
          symbol,
          price: price.value,
          change24h: price.change24h || 0,
          timestamp: price.timestamp,
          source: 'websocket'
        });
      }
    });

    if (priceData.length > 0) {
      ws.send(JSON.stringify({
        type: 'price_update',
        data: priceData,
        timestamp: Date.now()
      }));
    }
  }

  async broadcastPriceUpdate(symbol, priceData) {
    // Update internal price storage
    this.prices.set(symbol, {
      value: priceData.price,
      change24h: priceData.change24h || 0,
      timestamp: Date.now()
    });

    // Check for liquidations, stop losses, and take profits on this symbol
    this.checkAutomaticCloses(symbol, priceData.price).catch(error => {
      console.error('[WebSocket] Automatic close check error:', error);
    });

    // Broadcast to all connected clients
    const message = JSON.stringify({
      type: 'price_update',
      data: [{
        symbol,
        price: priceData.price,
        change24h: priceData.change24h || 0,
        timestamp: Date.now(),
        source: 'websocket'
      }]
    });

    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        const clientSymbols = client.symbols || this.getAllSymbols();
        if (clientSymbols.includes(symbol)) {
          client.send(message);
        }
      }
    });
  }

  async checkAutomaticCloses(symbol, currentPrice) {
    console.log(`[WebSocket] Checking automatic closes for ${symbol} at price ${currentPrice}`);
    try {
      // Ensure database connection
      await connectDB();

      // Use the stop loss monitor instance
      const SandboxStopLossMonitor = require('./sandbox-stop-loss-monitor');
      const monitor = new SandboxStopLossMonitor();

      // Find ALL open positions for this symbol (with SL/TP or leverage > 1)
      const openTrades = await SandboxTrade.find({
        status: 'open',
        symbol: symbol,
        $or: [
          { 'stopLoss.price': { $exists: true, $ne: null } },
          { 'takeProfit.price': { $exists: true, $ne: null } },
          { 'leverage': { $gt: 1 } } // For liquidations
        ]
      }).populate('userId');

      console.log(`[WebSocket] Found ${openTrades.length} open trades for ${symbol}`);
      
      for (const trade of openTrades) {
        console.log(`[WebSocket] Checking trade: ${trade.symbol} ${trade.side} ${trade.leverage}x, SL: ${trade.stopLoss?.price}, TP: ${trade.takeProfit?.price}`);
        
        // Use the monitor's shouldExecuteTrade logic (handles SL, TP, and liquidations)
        const shouldExecute = monitor.shouldExecuteTrade(trade, currentPrice);
        
        if (shouldExecute) {
          console.log(`[WebSocket Auto-Close] Executing ${shouldExecute.reason} for ${trade.symbol} ${trade.side} at ${currentPrice}`);
          await monitor.executeAutomaticClose(trade, shouldExecute.triggerPrice || currentPrice, shouldExecute.reason);
        } else {
          console.log(`[WebSocket] No action needed for trade: ${trade._id}`);
        }
      }
    } catch (error) {
      console.error(`[WebSocket Auto-Close] Error checking ${symbol}:`, error);
    }
  }

  calculateLiquidationPrice(trade) {
    if (!trade || trade.leverage <= 1) return null;
    
    // Liquidation at 90% loss of margin
    const liquidationThreshold = 0.9;
    const priceMovementRatio = liquidationThreshold / trade.leverage;
    
    if (trade.side === 'long') {
      return trade.entryPrice * (1 - priceMovementRatio);
    } else {
      return trade.entryPrice * (1 + priceMovementRatio);
    }
  }

  connectToExternalSources() {
    // Use TwelveData API for consistent price data across the system
    this.connectToTwelveDataPolling();
  }

  connectToTwelveDataPolling() {
    if (!process.env.TWELVE_DATA_API_KEY) {
      console.warn('[WebSocket] ⚠️ TWELVE_DATA_API_KEY not configured - Using SIMULATED prices (NOT REAL MARKET DATA)');
      this.usePriceSimulator();
      return;
    }

    console.log('[WebSocket] Starting TwelveData polling service');
    const pollInterval = 10000; // Poll every 10 seconds to respect rate limits
    
    const fetchPrices = async () => {
      console.log('[WebSocket] Fetching prices from TwelveData...');
      try {
        // Get all symbols we need to track
        const symbols = [];
        if (SANDBOX_ASSETS) {
          SANDBOX_ASSETS.crypto.forEach(asset => symbols.push(asset.symbol));
          SANDBOX_ASSETS.stocks.forEach(asset => symbols.push(asset.symbol));
        }

        if (symbols.length === 0) return;

        // Convert to TwelveData format
        const { getAPISymbol } = require('./sandbox-constants-data');
        const apiSymbols = symbols.map(getAPISymbol).join(',');

        // Fetch batch prices from TwelveData
        const url = `https://api.twelvedata.com/price?symbol=${apiSymbols}&apikey=${process.env.TWELVE_DATA_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        // Process prices
        if (symbols.length === 1) {
          // Single symbol response
          if (data.price && !isNaN(parseFloat(data.price))) {
            const price = parseFloat(data.price);
            
            // Validate price before broadcasting
            if (this.validatePrice(symbols[0], price)) {
              console.log(`[WebSocket] Broadcasting price update for ${symbols[0]}: ${price}`);
              this.broadcastPriceUpdate(symbols[0], {
                price: price,
                change24h: 0 // TwelveData requires separate call for this
              });
            }
          }
        } else {
          // Multiple symbols response
          // TwelveData returns data keyed by the API symbols (e.g., 'BTC/USD')
          Object.keys(data).forEach((apiSymbol) => {
            // Find the original symbol (e.g., 'BTC') from the API symbol
            const originalSymbol = symbols.find(sym => getAPISymbol(sym) === apiSymbol);
            
            if (originalSymbol && data[apiSymbol]?.price && !isNaN(parseFloat(data[apiSymbol].price))) {
              const price = parseFloat(data[apiSymbol].price);
              
              // Validate price before broadcasting
              if (this.validatePrice(originalSymbol, price)) {
                this.broadcastPriceUpdate(originalSymbol, {
                  price: price,
                  change24h: 0
                });
              }
            }
          });
        }
      } catch (error) {
        // Silent fail - no logging
      }
    };

    // Initial fetch
    fetchPrices();

    // Set up polling
    this.pricePollingInterval = setInterval(fetchPrices, pollInterval);
    // Started TwelveData price polling (10s interval)
  }

  validatePrice(symbol, newPrice) {
    // Check against last known price
    const lastPrice = this.prices.get(symbol);
    if (lastPrice && lastPrice.value) {
      const priceChange = Math.abs((newPrice - lastPrice.value) / lastPrice.value);
      // Reject if price changed more than 20% in one update
      if (priceChange > 0.20) {
        return false;
      }
    }
    
    // Sanity limits
    const sanityLimits = {
      'BTC': { min: 10000, max: 500000 },
      'ETH': { min: 100, max: 50000 },
      'SOL': { min: 1, max: 5000 },
      'ADA': { min: 0.01, max: 100 },
      'LINK': { min: 0.1, max: 1000 },
      'AAPL': { min: 10, max: 10000 },
      'TSLA': { min: 10, max: 5000 },
      'NVDA': { min: 10, max: 5000 }
    };
    
    const limits = sanityLimits[symbol];
    if (limits && (newPrice < limits.min || newPrice > limits.max)) {
      return false;
    }
    
    return true;
  }

  usePriceSimulator() {
    // Fall back to price simulator
    const { getPriceSimulator } = require('./priceSimulation');
    const simulator = getPriceSimulator();
    
    const pollInterval = 5000; // Update every 5 seconds
    
    const updatePrices = () => {
      const symbols = [];
      if (SANDBOX_ASSETS) {
        SANDBOX_ASSETS.crypto.forEach(asset => symbols.push(asset.symbol));
        SANDBOX_ASSETS.stocks.forEach(asset => symbols.push(asset.symbol));
      }
      
      symbols.forEach(symbol => {
        const price = simulator.getPrice(symbol);
        if (price && this.validatePrice(symbol, price)) {
          this.broadcastPriceUpdate(symbol, {
            price: price,
            change24h: 0
          });
        }
      });
    };
    
    // Initial update
    updatePrices();
    
    // Set up polling
    this.pricePollingInterval = setInterval(updatePrices, pollInterval);
    // Using price simulator (5s interval)
  }

  // DEPRECATED: We now use TwelveData API for consistency
  // connectToBinanceWebSocket() {
  //   // Kept for reference - DO NOT USE
  // }

  connectToAlphaVantagePolling() {
    // For stocks, use periodic polling (30 seconds) since most free WebSockets don't cover stocks
    if (!SANDBOX_ASSETS) {
      return;
    }
    
    const stockSymbols = SANDBOX_ASSETS.stocks.map(asset => asset.symbol);
    
    const pollStockPrices = async () => {
      try {
        // Use your existing Twelvedata API but less frequently
        const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;
        
        for (const symbol of stockSymbols.slice(0, 3)) { // Limit to 3 stocks to save API calls
          try {
            const response = await fetch(`https://api.twelvedata.com/price?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`);
            const data = await response.json();
            
            if (data.price && !isNaN(parseFloat(data.price))) {
              this.broadcastPriceUpdate(symbol, {
                price: parseFloat(data.price),
                change24h: 0 // You'd need a separate call for 24h change
              });
            }
            
            // Small delay between calls
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
          }
        }
      } catch (error) {
      }
    };

    // Poll every 30 seconds for stocks
    setInterval(pollStockPrices, 30000);
    pollStockPrices(); // Initial call
  }

  initializeTestData() {
    // Initialize with test prices
    const testPrices = {
      'BTC': 95000,
      'ETH': 3500,
      'ADA': 0.85,
      'SOL': 180,
      'LINK': 18,
      'AAPL': 185,
      'GOOGL': 170,
      'TSLA': 350,
      'AMZN': 185,
      'MSFT': 430,
      'SPY': 600,
      'QQQ': 520
    };

    Object.entries(testPrices).forEach(([symbol, price]) => {
      this.prices.set(symbol, {
        value: price,
        change24h: (Math.random() - 0.5) * 10, // Random % change
        timestamp: Date.now()
      });
    });

  }

  getAllSymbols() {
    if (!SANDBOX_ASSETS) return ['BTC', 'ETH', 'ADA', 'SOL', 'LINK', 'AAPL', 'GOOGL', 'TSLA', 'AMZN', 'MSFT', 'SPY', 'QQQ'];
    return [...SANDBOX_ASSETS.crypto, ...SANDBOX_ASSETS.stocks].map(asset => asset.symbol);
  }

  getConnectedClientsCount() {
    return this.clients.size;
  }

  getCurrentPrices() {
    const prices = {};
    this.prices.forEach((data, symbol) => {
      prices[symbol] = data;
    });
    return prices;
  }
}

// Export singleton instance using CommonJS
const marketDataWS = new MarketDataWebSocketServer();
module.exports = { marketDataWS, default: marketDataWS };