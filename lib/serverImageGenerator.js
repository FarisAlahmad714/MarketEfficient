// lib/serverImageGenerator.js
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

class ServerSocialImageGenerator {
  constructor() {
    this.logoPath = path.join(process.cwd(), 'public', 'images', 'logo.webp');
    this.platformSpecs = {
      twitter: {
        width: 1200,
        height: 675,
        titleFontSize: 48,
        subtitleFontSize: 28,
        bodyFontSize: 24
      },
      linkedin: {
        width: 1200,
        height: 627,
        titleFontSize: 46,
        subtitleFontSize: 26,
        bodyFontSize: 22
      },
      instagram: {
        width: 1080,
        height: 1080,
        titleFontSize: 42,
        subtitleFontSize: 24,
        bodyFontSize: 20
      }
    };
  }

  async generateTestResultCard(platform, data, darkMode = false) {
    const specs = this.platformSpecs[platform];
    if (!specs) throw new Error(`Unsupported platform: ${platform}`);

    // Create canvas
    const canvas = createCanvas(specs.width, specs.height);
    const ctx = canvas.getContext('2d');

    // Load logo
    let logo;
    try {
      logo = await loadImage(this.logoPath);
    } catch (error) {
      console.warn('Could not load logo, continuing without it:', error.message);
    }

    // Colors matching your profile cards
    const colors = this.getColorScheme(darkMode);
    
    // Background (matching your TestResultsCards component)
    const gradient = ctx.createLinearGradient(0, 0, specs.width, specs.height);
    if (darkMode) {
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
    } else {
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, specs.width, specs.height);

    if (platform === 'instagram') {
      await this.renderSquareTestResult(ctx, data, logo, colors, specs);
    } else {
      await this.renderWideTestResult(ctx, data, logo, colors, specs);
    }

    return canvas.toBuffer('image/jpeg', { quality: 0.9 });
  }

  renderWideTestResult(ctx, data, logo, colors, specs) {
    const { width, height } = specs;
    
    // Main card container (replicating your card design)
    const cardPadding = 40;
    const cardX = cardPadding;
    const cardY = cardPadding;
    const cardWidth = width - (cardPadding * 2);
    const cardHeight = height - (cardPadding * 2);
    
    // Card background
    ctx.fillStyle = colors.background;
    this.roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 12);
    ctx.fill();
    
    // Card border (matching your TestResultsCards border)
    ctx.strokeStyle = this.getTestTypeColor(data.type) + '33';
    ctx.lineWidth = 1;
    this.roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 12);
    ctx.stroke();

    // Logo (top left)
    if (logo) {
      const logoSize = 60;
      ctx.drawImage(logo, cardX + 20, cardY + 20, logoSize, logoSize);
      
      // MarketEfficient text next to logo
      ctx.fillStyle = colors.primary;
      ctx.font = `bold 20px sans-serif`;
      ctx.fillText('MarketEfficient', cardX + logoSize + 30, cardY + 45);
    }

    // Test type header (matching your component)
    const headerY = cardY + 120;
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${specs.titleFontSize}px sans-serif`;
    ctx.fillText(data.testType, cardX + 30, headerY);

    // Test type icon (matching getTestTypeIcon)
    const testIcon = this.getTestTypeIcon(data.type);
    ctx.font = `32px sans-serif`;
    ctx.fillText(testIcon, cardX + 30, headerY + 50);

    // Score circle (large, prominent - matching your design)
    const scoreRadius = 100;
    const scoreX = width - scoreRadius - 100;
    const scoreY = height / 2;
    
    // Score background circle
    ctx.beginPath();
    ctx.arc(scoreX, scoreY, scoreRadius, 0, 2 * Math.PI);
    ctx.fillStyle = this.getScoreColor(data.percentage, 0.1);
    ctx.fill();
    
    // Score border
    ctx.beginPath();
    ctx.arc(scoreX, scoreY, scoreRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = this.getScoreColor(data.percentage);
    ctx.lineWidth = 8;
    ctx.stroke();
    
    // Score percentage text
    ctx.fillStyle = this.getScoreColor(data.percentage);
    ctx.font = `bold 60px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`${data.percentage}%`, scoreX, scoreY + 15);
    
    // Score details below circle
    ctx.fillStyle = colors.textSecondary;
    ctx.font = `${specs.subtitleFontSize}px sans-serif`;
    ctx.fillText(`${data.score}/${data.totalPoints} Points`, scoreX, scoreY + scoreRadius + 40);

    // Performance badge (matching your component logic)
    if (data.percentage >= 90) {
      this.renderPerformanceBadge(ctx, cardX + 30, headerY + 100, '🏆 PERFECT', '#FFD700', colors);
    } else if (data.percentage >= 80) {
      this.renderPerformanceBadge(ctx, cardX + 30, headerY + 100, '⭐ EXCELLENT', '#4CAF50', colors);
    } else if (data.percentage >= 70) {
      this.renderPerformanceBadge(ctx, cardX + 30, headerY + 100, '👍 GOOD', '#2196F3', colors);
    }

    // Asset tag (if available)
    if (data.asset) {
      const tagY = height - 80;
      ctx.fillStyle = this.getTestTypeColor(data.type) + '20';
      this.roundRect(ctx, cardX + 30, tagY, 120, 30, 10);
      ctx.fill();
      
      ctx.fillStyle = this.getTestTypeColor(data.type);
      ctx.font = `bold 14px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(data.asset.toUpperCase(), cardX + 90, tagY + 20);
    }

    // Date (matching your component)
    ctx.fillStyle = colors.textSecondary;
    ctx.font = `14px sans-serif`;
    ctx.textAlign = 'left';
    const dateText = new Date(data.completedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    ctx.fillText(`📅 ${dateText}`, cardX + 30, height - 40);
  }

  renderSquareTestResult(ctx, data, logo, colors, specs) {
    const { width, height } = specs;
    
    // Card background
    ctx.fillStyle = colors.background;
    this.roundRect(ctx, 20, 20, width - 40, height - 40, 16);
    ctx.fill();
    
    // Logo at top center
    if (logo) {
      const logoSize = 80;
      ctx.drawImage(logo, (width - logoSize) / 2, 60, logoSize, logoSize);
      
      ctx.fillStyle = colors.primary;
      ctx.font = `bold 24px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('MarketEfficient', width / 2, 180);
    }

    // Test type
    ctx.fillStyle = colors.text;
    ctx.font = `bold 32px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(data.testType, width / 2, 250);

    // Large score circle in center
    const scoreRadius = 140;
    const centerY = height / 2 + 50;
    
    // Score background
    ctx.beginPath();
    ctx.arc(width / 2, centerY, scoreRadius, 0, 2 * Math.PI);
    ctx.fillStyle = this.getScoreColor(data.percentage, 0.1);
    ctx.fill();
    
    // Score border
    ctx.beginPath();
    ctx.arc(width / 2, centerY, scoreRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = this.getScoreColor(data.percentage);
    ctx.lineWidth = 12;
    ctx.stroke();
    
    // Score text
    ctx.fillStyle = this.getScoreColor(data.percentage);
    ctx.font = `bold 80px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`${data.percentage}%`, width / 2, centerY + 20);
    
    // Score details
    ctx.fillStyle = colors.textSecondary;
    ctx.font = `24px sans-serif`;
    ctx.fillText(`${data.score}/${data.totalPoints} Points`, width / 2, centerY + scoreRadius + 60);
    
    // Asset if available
    if (data.asset) {
      ctx.fillText(data.asset.toUpperCase(), width / 2, centerY + scoreRadius + 100);
    }
  }

  renderPerformanceBadge(ctx, x, y, text, bgColor, colors) {
    const padding = 16;
    const badgeWidth = 200;
    const badgeHeight = 40;
    
    // Badge background
    ctx.fillStyle = bgColor;
    this.roundRect(ctx, x, y, badgeWidth, badgeHeight, 20);
    ctx.fill();
    
    // Badge text
    ctx.fillStyle = '#000000';
    ctx.font = `bold 16px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(text, x + badgeWidth / 2, y + 26);
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  getColorScheme(darkMode) {
    return {
      primary: '#2196F3',
      text: darkMode ? '#ffffff' : '#1a202c',
      textSecondary: darkMode ? '#a0aec0' : '#4a5568',
      background: darkMode ? '#1e1e1e' : '#ffffff',
      border: darkMode ? '#2d3748' : '#e2e8f0'
    };
  }

  getScoreColor(score, alpha = 1) {
    let color;
    if (score >= 80) color = '76, 175, 80'; // Green
    else if (score >= 60) color = '139, 195, 74'; // Light Green  
    else if (score >= 40) color = '255, 193, 7'; // Amber
    else if (score >= 20) color = '255, 152, 0'; // Orange
    else color = '244, 67, 54'; // Red
    
    return `rgba(${color}, ${alpha})`;
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
}

module.exports = { ServerSocialImageGenerator };