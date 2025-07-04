// Test script for sandbox trading functionality
const fetch = require('node-fetch');

async function testSandboxTrading() {
  const API_BASE = 'http://localhost:3000/api';
  
  // Replace with your auth token
  const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE';
  
  console.log('🧪 Testing Sandbox Trading System...\n');
  
  try {
    // 1. Test portfolio endpoint
    console.log('1️⃣ Testing portfolio fetch...');
    const portfolioResponse = await fetch(`${API_BASE}/sandbox/portfolio`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    if (!portfolioResponse.ok) {
      throw new Error(`Portfolio fetch failed: ${portfolioResponse.status}`);
    }
    
    const portfolio = await portfolioResponse.json();
    console.log('✅ Portfolio fetched successfully');
    console.log(`   Balance: ${portfolio.balance} SENSES`);
    console.log(`   Current Value: ${portfolio.currentValue} SENSES`);
    console.log(`   Total P&L: ${portfolio.totalPnL} SENSES (${portfolio.totalPnLPercentage}%)`);
    console.log(`   Total Deposits: ${portfolio.totalDeposits} SENSES`);
    console.log(`   Performance (excluding deposits): ${portfolio.performance.totalReturn}%\n`);
    
    // 2. Test place trade endpoint
    console.log('2️⃣ Testing trade placement...');
    
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
    console.log('✅ Trade placed successfully');
    console.log(`   Trade ID: ${trade.trade.id}`);
    console.log(`   Entry Price: ${trade.trade.entryPrice}`);
    console.log(`   Position Value: ${trade.trade.positionValue}`);
    console.log(`   Margin Used: ${trade.trade.marginUsed}`);
    console.log(`   New Balance: ${trade.portfolio.balance}\n`);
    
    // 3. Verify portfolio metrics after trade
    console.log('3️⃣ Verifying portfolio metrics after trade...');
    const updatedPortfolioResponse = await fetch(`${API_BASE}/sandbox/portfolio`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    const updatedPortfolio = await updatedPortfolioResponse.json();
    console.log('✅ Updated portfolio metrics:');
    console.log(`   Balance: ${updatedPortfolio.balance} SENSES`);
    console.log(`   Current Value: ${updatedPortfolio.currentValue} SENSES`);
    console.log(`   Open Positions: ${updatedPortfolio.openPositions.length}`);
    console.log(`   Total Trades: ${updatedPortfolio.trading.totalTrades}`);
    
    console.log('\n✨ All tests passed! Sandbox trading is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
console.log('To run this test:');
console.log('1. Start your development server: npm run dev');
console.log('2. Get your auth token from browser localStorage: localStorage.getItem("auth_token")');
console.log('3. Replace YOUR_AUTH_TOKEN_HERE with your actual token');
console.log('4. Run: node test-sandbox-trading.js\n');

// Uncomment to run automatically if token is set
// testSandboxTrading();