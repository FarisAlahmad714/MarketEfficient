// lib/monitoring-worker.js
// Dedicated worker process for continuous position monitoring
// This ensures SL/TP/Liquidations are checked even when no users are connected

const connectDB = require('./database');
const stopLossMonitor = require('./sandbox-stop-loss-monitor');
const { marketDataWS } = require('./websocket-server');

class MonitoringWorker {
  constructor() {
    this.isRunning = false;
    this.healthCheckInterval = null;
  }

  async start() {
    console.log('[Monitoring Worker] Starting monitoring worker process...');
    
    try {
      // Connect to database
      await connectDB();
      console.log('[Monitoring Worker] Database connected');

      // Start the stop loss monitor
      console.log('[Monitoring Worker] Starting stop loss monitor...');
      await stopLossMonitor.start();
      
      // Set up health check
      this.setupHealthCheck();
      
      this.isRunning = true;
      console.log('[Monitoring Worker] Monitoring worker started successfully');
      
      // Log initial status
      const status = stopLossMonitor.getStatus();
      console.log('[Monitoring Worker] Initial status:', status);
      
    } catch (error) {
      console.error('[Monitoring Worker] Failed to start:', error);
      process.exit(1);
    }
  }

  setupHealthCheck() {
    // Check every 30 seconds that the monitor is still running
    this.healthCheckInterval = setInterval(() => {
      const status = stopLossMonitor.getStatus();
      
      if (!status.isRunning) {
        console.warn('[Monitoring Worker] Stop loss monitor not running! Restarting...');
        stopLossMonitor.start().catch(error => {
          console.error('[Monitoring Worker] Failed to restart monitor:', error);
        });
      } else {
        const lastCheckAge = status.lastCheckTime ? 
          (Date.now() - new Date(status.lastCheckTime).getTime()) / 1000 : 
          null;
        
        // If last check was more than 30 seconds ago, something might be wrong
        if (lastCheckAge && lastCheckAge > 30) {
          console.warn(`[Monitoring Worker] Last check was ${lastCheckAge}s ago - might be stuck`);
        }
      }
    }, 30000);
  }

  async stop() {
    console.log('[Monitoring Worker] Stopping monitoring worker...');
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    await stopLossMonitor.stop();
    this.isRunning = false;
    
    console.log('[Monitoring Worker] Monitoring worker stopped');
  }
}

// Handle process termination gracefully
const worker = new MonitoringWorker();

process.on('SIGINT', async () => {
  console.log('[Monitoring Worker] Received SIGINT, shutting down gracefully...');
  await worker.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Monitoring Worker] Received SIGTERM, shutting down gracefully...');
  await worker.stop();
  process.exit(0);
});

// Start the worker if this file is run directly
if (require.main === module) {
  worker.start().catch(error => {
    console.error('[Monitoring Worker] Fatal error:', error);
    process.exit(1);
  });
}

module.exports = MonitoringWorker;