# MarketEfficient Position Monitoring Guide

## Overview

The MarketEfficient platform has a robust position monitoring system that ensures Stop Loss (SL), Take Profit (TP), and Liquidation orders are executed in real-time, even when users are not logged in.

## Architecture

The monitoring system consists of three main components:

1. **WebSocket Server** (`lib/websocket-server.js`)
   - Fetches real-time price data every 10 seconds from TwelveData API
   - Checks positions when new prices arrive
   - Broadcasts price updates to connected clients

2. **Stop Loss Monitor** (`lib/sandbox-stop-loss-monitor.js`)
   - Independent monitoring loop that runs every 5 seconds
   - Checks all open positions with SL/TP or leverage > 1
   - Executes automatic closes when conditions are met

3. **Monitoring Worker** (`lib/monitoring-worker.js`)
   - Dedicated process that ensures monitoring continues
   - Health checks every 30 seconds
   - Automatically restarts failed services

## Setup Instructions

### Development Mode

1. Start the main application:
   ```bash
   npm run dev
   ```

2. In a separate terminal, start the monitoring worker:
   ```bash
   node scripts/start-monitoring.js
   ```

### Production Mode with PM2

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Start all services:
   ```bash
   pm2 start ecosystem.config.js
   ```

3. Save PM2 configuration:
   ```bash
   pm2 save
   pm2 startup
   ```

## Monitoring Endpoints

### Check Monitor Status
```bash
GET /api/sandbox/monitor-status
Authorization: Bearer <token>
```

Returns:
- Stop loss monitor status (running, last check time)
- WebSocket server status (connected clients, initialized)
- Open trades being monitored
- Current prices

### Force Position Check
```bash
POST /api/sandbox/force-check-positions
Authorization: Bearer <token>
```

Triggers an immediate check of all positions.

## Troubleshooting

### Issue: Positions only close when logging in

**Symptoms:**
- SL/TP orders not executing in real-time
- Positions closing immediately upon login
- Liquidations happening at wrong prices

**Solutions:**

1. **Verify monitoring services are running:**
   ```bash
   # Check PM2 status
   pm2 status
   
   # Check monitor logs
   pm2 logs monitoring-worker
   ```

2. **Check monitor status via API:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3000/api/sandbox/monitor-status
   ```

3. **Force immediate check:**
   ```bash
   curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3000/api/sandbox/force-check-positions
   ```

4. **Restart monitoring services:**
   ```bash
   pm2 restart monitoring-worker
   ```

### Issue: WebSocket not receiving price updates

**Check TwelveData API key:**
```bash
# Verify in .env file
TWELVE_DATA_API_KEY=your_api_key
```

**Monitor WebSocket logs:**
```bash
pm2 logs marketefficient | grep WebSocket
```

## Best Practices

1. **Always run monitoring worker in production**
   - Use PM2 or similar process manager
   - Enable auto-restart on crashes
   - Set up log rotation

2. **Monitor system health**
   - Check `/api/sandbox/monitor-status` regularly
   - Set up alerts for monitoring failures
   - Review logs for errors

3. **Test SL/TP execution**
   - Create test positions with tight SL/TP
   - Verify execution happens within 5-10 seconds
   - Check notification delivery

## Configuration

### Environment Variables
```env
# Required for real-time prices
TWELVE_DATA_API_KEY=your_api_key

# MongoDB connection
MONGODB_URI=your_mongodb_uri

# JWT for authentication
JWT_SECRET=your_jwt_secret
```

### Timing Configuration
- WebSocket price polling: 10 seconds
- Stop loss monitor check: 5 seconds
- Health check interval: 30 seconds

## Logs

Monitor logs are stored in:
- `logs/monitor-out.log` - Standard output
- `logs/monitor-error.log` - Error output
- `logs/monitor-combined.log` - Combined logs

To view real-time logs:
```bash
# All logs
pm2 logs

# Monitor logs only
pm2 logs monitoring-worker

# Follow logs
pm2 logs --lines 100 -f
```

## Testing

To test the monitoring system:

1. Create a position with stop loss:
   ```javascript
   // Example: Long position with tight SL
   {
     symbol: 'SOL',
     side: 'long',
     leverage: 50,
     stopLoss: { price: currentPrice - 1 }
   }
   ```

2. Monitor the logs:
   ```bash
   pm2 logs monitoring-worker -f
   ```

3. Wait for price to hit SL (or manually adjust price in test mode)

4. Verify:
   - Position closes automatically
   - Notification is created
   - Email is sent (if enabled)

## Emergency Procedures

If monitoring fails completely:

1. **Immediate action:**
   ```bash
   # Restart all services
   pm2 restart all
   
   # Force check all positions
   curl -X POST -H "Authorization: Bearer ADMIN_TOKEN" \
        http://localhost:3000/api/sandbox/force-check-positions
   ```

2. **Check database connection:**
   ```bash
   # Test MongoDB connection
   node -e "require('./lib/database')().then(() => console.log('DB OK'))"
   ```

3. **Verify API keys:**
   - Check TWELVE_DATA_API_KEY is valid
   - Verify rate limits not exceeded

4. **Manual position review:**
   - Check all open leveraged positions
   - Manually close any at-risk positions
   - Review trade history for missed executions