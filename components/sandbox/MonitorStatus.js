import React, { useState, useEffect } from 'react';
import { FiActivity, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi';

export default function MonitorStatus({ token }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/sandbox/monitor-status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to check monitor status:', error);
    } finally {
      setLoading(false);
    }
  };

  const startMonitor = async () => {
    try {
      const response = await fetch('/api/sandbox/start-monitor', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
        alert('Monitor started successfully');
      } else {
        alert('Failed to start monitor');
      }
    } catch (error) {
      console.error('Failed to start monitor:', error);
      alert('Error starting monitor');
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-48"></div>
      </div>
    );
  }

  const isRunning = status?.isRunning;
  const statusColor = isRunning ? 'text-green-400' : 'text-red-400';
  const statusIcon = isRunning ? <FiCheckCircle /> : <FiAlertCircle />;

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FiActivity className="text-blue-400" />
          <h3 className="text-white font-semibold">Stop Loss Monitor</h3>
        </div>
        {!isRunning && (
          <button
            onClick={startMonitor}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
          >
            Start Monitor
          </button>
        )}
      </div>
      
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <span className={statusColor}>{statusIcon}</span>
          <span className="text-gray-300">
            Status: <span className={statusColor}>{isRunning ? 'Running' : 'Stopped'}</span>
          </span>
        </div>
        
        {status?.lastCheckTime && (
          <div className="flex items-center gap-2">
            <FiClock className="text-gray-400" />
            <span className="text-gray-300">
              Last check: {status.timeSinceLastCheck}
            </span>
          </div>
        )}
        
        <div className="text-gray-400 text-xs mt-2">
          Check interval: {status?.checkInterval ? `${status.checkInterval / 1000}s` : 'Unknown'}
        </div>
      </div>
    </div>
  );
}