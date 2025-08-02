#!/usr/bin/env node
// scripts/start-monitoring.js
// Script to ensure monitoring services are running

require('dotenv').config();
const MonitoringWorker = require('../lib/monitoring-worker');

console.log('===========================================');
console.log('MarketEfficient Monitoring Service');
console.log('===========================================');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Time: ${new Date().toISOString()}`);
console.log('===========================================');

const worker = new MonitoringWorker();

worker.start().then(() => {
  console.log('[Start Script] Monitoring service is running');
  console.log('[Start Script] Press Ctrl+C to stop');
}).catch(error => {
  console.error('[Start Script] Failed to start monitoring:', error);
  process.exit(1);
});