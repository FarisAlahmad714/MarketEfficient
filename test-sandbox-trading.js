// Test script for sandbox trading functionality
const fetch = require('node-fetch');

async function testSandboxTrading() {
  const API_BASE = 'http://localhost:3000/api';
  
  // Replace with your auth token
  const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE';
  
  
  try {
    // 1. Test portfolio endpoint
    const portfolioResponse = await fetch(`${API_BASE}/sandbox/portfolio`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    if (!portfolioResponse.ok) {
      throw new Error(`Portfolio fetch failed: ${portfolioResponse.status}`);
    }
    
    const portfolio = await portfolioResponse.json();
    
    // 2. Test place trade endpoint
    
    // Get CSRF token first
    const csrfResponse = await fetch(`${API_BASE}/auth/csrf-token`, {
      credentials: 'include'
    });
    const { csrfToken } = await csrfResponse.json();
    
    const tradeData = {
      symbol: 'BTC',
      side: 'long',
      type: 'market',
      quantity: 0.001,
      leverage: 1,
      preTradeAnalysis: {
        entryReason: 'Testing sandbox trading functionality with small position'
      }
    };
    
    const tradeResponse = await fetch(`${API_BASE}/sandbox/place-trade`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify(tradeData),
      credentials: 'include'
    });
    
    if (!tradeResponse.ok) {
      const error = await tradeResponse.json();
      throw new Error(`Trade placement failed: ${JSON.stringify(error)}`);
    }
    
    const trade = await tradeResponse.json();
    
    // 3. Verify portfolio metrics after trade
    const updatedPortfolioResponse = await fetch(`${API_BASE}/sandbox/portfolio`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    const updatedPortfolio = await updatedPortfolioResponse.json();
    
    
  } catch (error) {
    process.exit(1);
  }
}

// Run the test

// Uncomment to run automatically if token is set
// testSandboxTrading();