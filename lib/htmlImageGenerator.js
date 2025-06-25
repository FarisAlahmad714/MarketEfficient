// lib/htmlImageGenerator.js
const puppeteer = require('puppeteer');

class HTMLImageGenerator {
  constructor() {
    this.browser = null;
  }

  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  async generateTestResultCard(platform, data, darkMode = false) {
    await this.init();
    
    const specs = this.getPlatformSpecs(platform);
    const html = this.generateHTML(data, specs, darkMode);
    
    const page = await this.browser.newPage();
    await page.setContent(html);
    await page.setViewport({
      width: specs.width,
      height: specs.height,
      deviceScaleFactor: 1
    });

    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 90,
      fullPage: false
    });

    await page.close();
    return screenshot;
  }

  generateHTML(data, specs, darkMode) {
    const colors = darkMode ? {
      background: '#1a1a2e',
      cardBg: '#262626',
      text: '#ffffff',
      textSecondary: '#a0aec0',
      primary: '#2196F3'
    } : {
      background: '#f8fafc',
      cardBg: '#ffffff',
      text: '#1a202c',
      textSecondary: '#4a5568',
      primary: '#2196F3'
    };

    const scoreColor = this.getScoreColor(data.percentage);
    const testIcon = this.getTestTypeIcon(data.testType);
    const performanceBadge = this.getPerformanceBadge(data.percentage);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: ${specs.width}px;
      height: ${specs.height}px;
      background: linear-gradient(135deg, ${colors.background} 0%, ${darkMode ? '#16213e' : '#e2e8f0'} 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }
    
    .card {
      width: 100%;
      height: 100%;
      background: ${colors.cardBg};
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      border: 1px solid ${this.getTestTypeColor(data.testType)}33;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    
    .header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .logo {
      width: 60px;
      height: 60px;
      background: url('/images/logo.webp') center/contain no-repeat;
      border-radius: 8px;
    }
    
    .brand {
      color: ${colors.primary};
      font-size: 20px;
      font-weight: bold;
    }
    
    .content {
      display: flex;
      flex: 1;
      ${specs.width > specs.height ? 'flex-direction: row;' : 'flex-direction: column;'}
      gap: 30px;
      align-items: center;
    }
    
    .info {
      flex: 1;
      ${specs.width > specs.height ? 'text-align: left;' : 'text-align: center;'}
    }
    
    .test-type {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      ${specs.width <= specs.height ? 'justify-content: center;' : ''}
    }
    
    .test-icon {
      font-size: 32px;
    }
    
    .test-title {
      color: ${colors.text};
      font-size: ${specs.width > specs.height ? '36px' : '28px'};
      font-weight: bold;
    }
    
    .score-circle {
      width: ${specs.width > specs.height ? '200px' : '160px'};
      height: ${specs.width > specs.height ? '200px' : '160px'};
      border-radius: 50%;
      background: ${scoreColor}20;
      border: 8px solid ${scoreColor};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .score-percentage {
      color: ${scoreColor};
      font-size: ${specs.width > specs.height ? '48px' : '36px'};
      font-weight: bold;
      line-height: 1;
    }
    
    .score-details {
      color: ${colors.textSecondary};
      font-size: 16px;
      margin-top: 8px;
    }
    
    .performance-badge {
      display: inline-block;
      background: ${performanceBadge.color};
      color: #000;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: bold;
      margin-top: 20px;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 20px;
    }
    
    .date {
      color: ${colors.textSecondary};
      font-size: 14px;
    }
    
    .asset-tag {
      background: ${this.getTestTypeColor(data.testType)}20;
      color: ${this.getTestTypeColor(data.testType)};
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo"></div>
      <div class="brand">MarketEfficient</div>
    </div>
    
    <div class="content">
      <div class="info">
        <div class="test-type">
          <span class="test-icon">${testIcon}</span>
          <span class="test-title">${data.testType}</span>
        </div>
        
        ${performanceBadge.text ? `<div class="performance-badge">${performanceBadge.text}</div>` : ''}
      </div>
      
      <div class="score-circle">
        <div class="score-percentage">${data.percentage}%</div>
        <div class="score-details">${data.score}/${data.totalPoints}</div>
      </div>
    </div>
    
    <div class="footer">
      <div class="date">📅 ${new Date(data.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
      ${data.asset ? `<div class="asset-tag">${data.asset.toUpperCase()}</div>` : ''}
    </div>
  </div>
</body>
</html>`;
  }

  getPlatformSpecs(platform) {
    const specs = {
      twitter: { width: 1200, height: 675 },
      linkedin: { width: 1200, height: 627 },
      instagram: { width: 1080, height: 1080 }
    };
    return specs[platform] || specs.twitter;
  }

  getScoreColor(score) {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FFC107';
    if (score >= 20) return '#FF9800';
    return '#F44336';
  }

  getTestTypeIcon(type) {
    const icons = {
      'Bias Test': '🧠',
      'Chart Exam': '📈',
      'Swing Analysis': '📊',
      'Fibonacci Retracement': '🌀',
      'Fair Value Gaps': '📉'
    };
    return icons[type] || '📋';
  }

  getTestTypeColor(type) {
    const colors = {
      'Bias Test': '#9C27B0',
      'Chart Exam': '#2196F3',
      'Swing Analysis': '#FF9800',
      'Fibonacci Retracement': '#4CAF50',
      'Fair Value Gaps': '#F44336'
    };
    return colors[type] || '#666';
  }

  getPerformanceBadge(percentage) {
    if (percentage >= 90) return { text: '🏆 PERFECT', color: '#FFD700' };
    if (percentage >= 80) return { text: '⭐ EXCELLENT', color: '#4CAF50' };
    if (percentage >= 70) return { text: '👍 GOOD', color: '#2196F3' };
    return { text: '', color: '' };
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = { HTMLImageGenerator };