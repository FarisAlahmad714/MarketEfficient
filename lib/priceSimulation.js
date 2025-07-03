// lib/priceSimulation.js - Realistic price simulation for sandbox trading

class PriceSimulator {
  constructor() {
    this.prices = {};
    this.lastUpdate = {};
    this.trends = {};
    
    // Initialize base prices
    this.basePrices = {
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
    
    // Initialize prices and trends
    Object.keys(this.basePrices).forEach(symbol => {
      this.prices[symbol] = this.basePrices[symbol];
      this.trends[symbol] = 0; // Neutral trend
      this.lastUpdate[symbol] = Date.now();
    });
  }
  
  // Fetch real price directly from external API (avoiding internal recursion)
  async fetchRealPrice(symbol) {
    try {
      // Import here to avoid circular dependency
      const { getAPISymbol } = await import('./sandbox-constants');
      
      // Get the external API symbol (e.g., BTC -> BTCUSD)
      const apiSymbol = getAPISymbol(symbol);
      
      // Call Twelvedata API directly instead of our own API to avoid recursion
      const response = await fetch(
        `https://api.twelvedata.com/price?symbol=${apiSymbol}&apikey=${process.env.TWELVE_DATA_API_KEY}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(5000)
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.price && !isNaN(parseFloat(data.price))) {
          // Convert to SENSES (1:1 with USD for now)
          return parseFloat(data.price);
        }
      }
    } catch (error) {
      // Silently fail and use simulated price - this is expected behavior
      console.log(`Using simulated price for ${symbol}: ${error.message}`);
    }
    return null;
  }

  // Get current price for a symbol (synchronous for compatibility)
  getPrice(symbol) {
    // For now, keep synchronous behavior but add async option
    this.updatePrice(symbol);
    return this.prices[symbol];
  }
  
  // Async version that tries real API first
  async getPriceAsync(symbol) {
    try {
      const realPrice = await this.fetchRealPrice(symbol);
      if (realPrice) {
        this.prices[symbol] = realPrice;
        return realPrice;
      }
    } catch (error) {
      console.log(`Using simulated price for ${symbol}`);
    }
    
    this.updatePrice(symbol);
    return this.prices[symbol];
  }
  
  // Get all prices
  getAllPrices() {
    const symbols = Object.keys(this.basePrices);
    const result = {};
    
    symbols.forEach(symbol => {
      result[symbol] = this.getPrice(symbol);
    });
    
    return result;
  }
  
  // Update price with realistic movement
  updatePrice(symbol) {
    const now = Date.now();
    const timeDelta = (now - this.lastUpdate[symbol]) / 1000; // seconds
    
    if (timeDelta < 1) return; // Don't update more than once per second
    
    const currentPrice = this.prices[symbol];
    const basePrice = this.basePrices[symbol];
    
    // Volatility based on asset type
    const volatility = this.getVolatility(symbol);
    
    // Trend persistence (markets trend)
    const trendStrength = 0.7; // 70% chance to continue current trend
    const trendDecay = 0.95; // Trends gradually decay
    
    // Random walk with trend
    let priceChange = 0;
    
    if (Math.random() < trendStrength) {
      // Continue current trend
      priceChange = this.trends[symbol] * volatility * timeDelta;
    } else {
      // Random movement
      priceChange = (Math.random() - 0.5) * volatility * timeDelta;
    }
    
    // Add some random noise
    const noise = (Math.random() - 0.5) * volatility * 0.3 * timeDelta;
    priceChange += noise;
    
    // Calculate new price
    let newPrice = currentPrice * (1 + priceChange);
    
    // Mean reversion - prevent prices from drifting too far from base
    const deviation = (newPrice - basePrice) / basePrice;
    if (Math.abs(deviation) > 0.15) { // If more than 15% from base
      const reversionForce = -deviation * 0.1; // Pull back toward base
      newPrice = newPrice * (1 + reversionForce);
    }
    
    // Update trend (with some randomness)
    if (Math.random() < 0.1) { // 10% chance to change trend
      this.trends[symbol] = (Math.random() - 0.5) * 2; // New random trend
    } else {
      this.trends[symbol] *= trendDecay; // Decay current trend
    }
    
    // Ensure price doesn't go negative or too extreme
    newPrice = Math.max(newPrice, basePrice * 0.5);
    newPrice = Math.min(newPrice, basePrice * 1.5);
    
    this.prices[symbol] = parseFloat(newPrice.toFixed(2));
    this.lastUpdate[symbol] = now;
  }
  
  // Get volatility based on asset type
  getVolatility(symbol) {
    const cryptoSymbols = ['BTC', 'ETH', 'ADA', 'SOL', 'LINK'];
    const techStocks = ['TSLA', 'GOOGL'];
    
    if (cryptoSymbols.includes(symbol)) {
      return 0.003; // 0.3% per second max (crypto is volatile)
    } else if (techStocks.includes(symbol)) {
      return 0.002; // 0.2% per second max (tech stocks)
    } else {
      return 0.001; // 0.1% per second max (stable stocks/ETFs)
    }
  }
  
  // Generate realistic 24h change data
  get24hChange(symbol) {
    const currentPrice = this.getPrice(symbol);
    const basePrice = this.basePrices[symbol];
    
    // Simulate what the price was 24h ago (with some randomness)
    const yesterday = basePrice * (1 + (Math.random() - 0.5) * 0.05);
    const change = currentPrice - yesterday;
    const changePercent = (change / yesterday) * 100;
    
    return {
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2))
    };
  }
}

// Global singleton instance
let priceSimulator = null;

export function getPriceSimulator() {
  if (!priceSimulator) {
    priceSimulator = new PriceSimulator();
  }
  return priceSimulator;
}

export default getPriceSimulator;