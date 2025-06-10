// lib/chartAnalytics.js
// Client-side analytics tracking for chart exams

class ChartAnalyticsTracker {
  constructor() {
    this.sessionData = {
      sessionId: null,
      startTime: null,
      focusEvents: [],
      interactions: [],
      deviceInfo: this.getDeviceInfo()
    };
    this.focusLostTime = null;
  }

  // Initialize session
  startSession(examType, chartCount, part = 1) {
    this.sessionData.sessionId = `${examType}_${chartCount}_${part}_${Date.now()}`;
    this.sessionData.startTime = new Date();
    this.sessionData.examType = examType;
    this.sessionData.chartCount = chartCount;
    this.sessionData.part = part;
    
    console.log('Analytics session started:', this.sessionData.sessionId);
  }

  // Record focus events
  recordFocusLoss() {
    this.focusLostTime = Date.now();
    this.sessionData.focusEvents.push({
      type: 'lost_focus',
      timestamp: new Date(),
      duration: null // Will be calculated when focus returns
    });
    
    // Send to backend API
    this.sendFocusEvent('lost_focus');
  }

  recordFocusGain() {
    if (this.focusLostTime) {
      const duration = Date.now() - this.focusLostTime;
      // Update the last focus event with duration
      const lastEvent = this.sessionData.focusEvents[this.sessionData.focusEvents.length - 1];
      if (lastEvent && lastEvent.type === 'lost_focus') {
        lastEvent.duration = duration;
      }
      
      this.sessionData.focusEvents.push({
        type: 'gained_focus',
        timestamp: new Date(),
        duration: duration
      });
      
      this.focusLostTime = null;
      
      // Send to backend API
      this.sendFocusEvent('gained_focus', duration);
    }
  }

  recordWarningShown() {
    this.sessionData.focusEvents.push({
      type: 'warning_shown',
      timestamp: new Date()
    });
    
    this.sendFocusEvent('warning_shown');
  }

  recordTimeoutReset() {
    this.sessionData.focusEvents.push({
      type: 'timeout_reset',
      timestamp: new Date()
    });
    
    this.sendFocusEvent('timeout_reset');
  }

  // Record user interactions
  recordDrawing(drawingType, coordinates, timestamp = new Date()) {
    this.sessionData.interactions.push({
      type: 'drawing',
      drawingType,
      coordinates,
      timestamp
    });
  }

  recordSubmission(score, totalPoints, drawingsCount) {
    this.sessionData.interactions.push({
      type: 'submission',
      score,
      totalPoints,
      accuracy: totalPoints > 0 ? score / totalPoints : 0,
      drawingsCount,
      timestamp: new Date()
    });
  }

  // Set chart metadata
  setChartMetadata(symbol, timeframe, chartData) {
    if (!chartData || chartData.length === 0) return;
    
    const prices = chartData.flatMap(c => [c.open, c.high, c.low, c.close]).filter(p => p != null);
    const priceRange = Math.max(...prices) - Math.min(...prices);
    
    // Calculate simple volatility (average of high-low ranges)
    const volatility = chartData.reduce((sum, candle) => {
      return sum + (candle.high - candle.low);
    }, 0) / chartData.length / priceRange;
    
    // Determine trend direction (simple: compare first and last close)
    const firstClose = chartData[0].close;
    const lastClose = chartData[chartData.length - 1].close;
    const trendDirection = lastClose > firstClose ? 'uptrend' : 
                          lastClose < firstClose ? 'downtrend' : 'sideways';
    
    this.sessionData.chartMetadata = {
      symbol,
      timeframe,
      priceRange,
      volatility,
      trendDirection
    };
    
    // Send to backend
    this.sendChartMetadata();
  }

  // Get device information
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  // Send analytics to backend APIs
  async sendFocusEvent(eventType, duration = null) {
    try {
      const token = await this.getAuthToken();
      await fetch('/api/charting-exam/analytics/focus-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: this.sessionData.sessionId,
          eventType,
          duration,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.warn('Failed to send focus event:', error);
    }
  }

  async sendChartMetadata() {
    try {
      const token = await this.getAuthToken();
      await fetch('/api/charting-exam/analytics/chart-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: this.sessionData.sessionId,
          metadata: this.sessionData.chartMetadata,
          deviceInfo: this.sessionData.deviceInfo
        })
      });
    } catch (error) {
      console.warn('Failed to send chart metadata:', error);
    }
  }

  async sendInteractionData() {
    try {
      const token = await this.getAuthToken();
      await fetch('/api/charting-exam/analytics/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: this.sessionData.sessionId,
          interactions: this.sessionData.interactions
        })
      });
    } catch (error) {
      console.warn('Failed to send interaction data:', error);
    }
  }

  async getAuthToken() {
    // Dynamically import storage to avoid SSR issues
    const { default: storage } = await import('./storage');
    return await storage.getItem('auth_token');
  }

  // Get session summary
  getSessionSummary() {
    const now = new Date();
    const totalTime = this.sessionData.startTime ? 
      Math.floor((now - this.sessionData.startTime) / 1000) : 0;
    
    const focusLossCount = this.sessionData.focusEvents.filter(e => e.type === 'lost_focus').length;
    const totalFocusLostTime = this.sessionData.focusEvents
      .filter(e => e.type === 'lost_focus' && e.duration)
      .reduce((sum, e) => sum + e.duration, 0);
    
    const submissions = this.sessionData.interactions.filter(i => i.type === 'submission');
    const drawings = this.sessionData.interactions.filter(i => i.type === 'drawing');
    
    return {
      sessionId: this.sessionData.sessionId,
      totalTime,
      focusLossCount,
      totalFocusLostTime: Math.floor(totalFocusLostTime / 1000), // Convert to seconds
      submissionCount: submissions.length,
      drawingCount: drawings.length,
      lastAccuracy: submissions.length > 0 ? submissions[submissions.length - 1].accuracy : 0
    };
  }

  // Clean up session
  endSession() {
    // Send final interaction data
    this.sendInteractionData();
    
    const summary = this.getSessionSummary();
    console.log('Analytics session ended:', summary);
    
    // Reset session data
    this.sessionData = {
      sessionId: null,
      startTime: null,
      focusEvents: [],
      interactions: [],
      deviceInfo: this.getDeviceInfo()
    };
    
    return summary;
  }
}

// Export singleton instance
export default new ChartAnalyticsTracker();