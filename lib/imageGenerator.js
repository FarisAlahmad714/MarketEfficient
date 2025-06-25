// lib/imageGenerator.js
export class SocialImageGenerator {
  constructor() {
    this.logoUrl = '/images/logo.webp';
    this.canvas = null;
    this.ctx = null;
    this.platformSpecs = {
      twitter: {
        width: 1200,
        height: 675,
        maxSize: 5 * 1024 * 1024, // 5MB
        ratio: '16:9',
        titleFontSize: 48,
        subtitleFontSize: 28,
        bodyFontSize: 24
      },
      linkedin: {
        width: 1200,
        height: 627,
        maxSize: 5 * 1024 * 1024, // 5MB
        ratio: '1.91:1',
        titleFontSize: 46,
        subtitleFontSize: 26,
        bodyFontSize: 22
      },
      instagram: {
        width: 1080,
        height: 1080,
        maxSize: 8 * 1024 * 1024, // 8MB
        ratio: '1:1',
        titleFontSize: 42,
        subtitleFontSize: 24,
        bodyFontSize: 20
      }
    };
  }

  async generateImage(platform, shareData, darkMode = false) {
    const specs = this.platformSpecs[platform];
    if (!specs) throw new Error(`Unsupported platform: ${platform}`);

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = specs.width;
    this.canvas.height = specs.height;
    this.ctx = this.canvas.getContext('2d');

    // Enable high-quality rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    try {
      // Load logo
      const logo = await this.loadImage(this.logoUrl);
      
      // Generate based on share data type
      switch (shareData.type) {
        case 'test_result':
          await this.generateTestResultCard(platform, shareData, logo, darkMode);
          break;
        case 'achievement':
          await this.generateAchievementCard(platform, shareData, logo, darkMode);
          break;
        case 'trading_highlight':
          await this.generateTradingCard(platform, shareData, logo, darkMode);
          break;
        case 'profile':
          await this.generateProfileCard(platform, shareData, logo, darkMode);
          break;
        default:
          throw new Error(`Unsupported share type: ${shareData.type}`);
      }

      // Convert to blob with platform-specific quality
      const quality = this.getOptimalQuality(platform);
      return new Promise((resolve) => {
        this.canvas.toBlob(resolve, 'image/jpeg', quality);
      });

    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }

  async generateTestResultCard(platform, data, logo, darkMode) {
    const specs = this.platformSpecs[platform];
    const colors = this.getColorScheme(darkMode);
    
    // Background gradient
    const gradient = this.ctx.createLinearGradient(0, 0, specs.width, specs.height);
    if (darkMode) {
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
    } else {
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
    }
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, specs.width, specs.height);

    // Platform-specific layout
    if (platform === 'instagram') {
      await this.renderSquareTestResult(data, logo, colors, specs);
    } else {
      await this.renderWideTestResult(data, logo, colors, specs);
    }
  }

  async renderWideTestResult(data, logo, colors, specs) {
    const { width, height } = specs;
    
    // Logo
    const logoSize = Math.min(80, width * 0.08);
    this.ctx.drawImage(logo, 40, 40, logoSize, logoSize);
    
    // MarketEfficient branding
    this.ctx.fillStyle = colors.primary;
    this.ctx.font = `bold ${Math.floor(logoSize * 0.3)}px Inter, sans-serif`;
    this.ctx.fillText('MarketEfficient', logoSize + 60, 70);
    
    // Main content area
    const contentX = 60;
    const contentY = logoSize + 100;
    const contentWidth = width - 120;
    
    // Score circle (large, prominent)
    const scoreRadius = Math.min(120, width * 0.1);
    const scoreX = width - scoreRadius - 80;
    const scoreY = contentY + scoreRadius;
    
    // Score background circle
    this.ctx.beginPath();
    this.ctx.arc(scoreX, scoreY, scoreRadius, 0, 2 * Math.PI);
    this.ctx.fillStyle = this.getScoreColor(data.percentage, 0.1);
    this.ctx.fill();
    
    // Score border
    this.ctx.beginPath();
    this.ctx.arc(scoreX, scoreY, scoreRadius, 0, 2 * Math.PI);
    this.ctx.strokeStyle = this.getScoreColor(data.percentage);
    this.ctx.lineWidth = 8;
    this.ctx.stroke();
    
    // Score text
    this.ctx.fillStyle = this.getScoreColor(data.percentage);
    this.ctx.font = `bold ${scoreRadius * 0.5}px Inter, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${data.percentage}%`, scoreX, scoreY + scoreRadius * 0.15);
    
    // Test type and details
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = colors.text;
    this.ctx.font = `bold ${specs.titleFontSize}px Inter, sans-serif`;
    this.ctx.fillText(`${data.testType} Result`, contentX, contentY);
    
    this.ctx.fillStyle = colors.textSecondary;
    this.ctx.font = `${specs.subtitleFontSize}px Inter, sans-serif`;
    this.ctx.fillText(`Score: ${data.score}/${data.totalPoints}`, contentX, contentY + 60);
    
    if (data.asset) {
      this.ctx.fillText(`Asset: ${data.asset.toUpperCase()}`, contentX, contentY + 100);
    }
    
    // Achievement badge if high score
    if (data.percentage >= 90) {
      this.renderAchievementBadge(contentX, contentY + 150, '🏆 Perfect Score!', '#FFD700');
    } else if (data.percentage >= 80) {
      this.renderAchievementBadge(contentX, contentY + 150, '⭐ Excellent!', '#4CAF50');
    }
    
    // Footer
    this.renderFooter(colors, specs);
  }

  async renderSquareTestResult(data, logo, colors, specs) {
    const { width, height } = specs;
    
    // Top section with logo and branding
    const logoSize = 60;
    this.ctx.drawImage(logo, (width - logoSize) / 2, 40, logoSize, logoSize);
    
    this.ctx.fillStyle = colors.primary;
    this.ctx.font = `bold 24px Inter, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MarketEfficient', width / 2, logoSize + 80);
    
    // Large score display in center
    const centerY = height / 2;
    const scoreRadius = 140;
    
    // Score background
    this.ctx.beginPath();
    this.ctx.arc(width / 2, centerY, scoreRadius, 0, 2 * Math.PI);
    this.ctx.fillStyle = this.getScoreColor(data.percentage, 0.1);
    this.ctx.fill();
    
    // Score border
    this.ctx.beginPath();
    this.ctx.arc(width / 2, centerY, scoreRadius, 0, 2 * Math.PI);
    this.ctx.strokeStyle = this.getScoreColor(data.percentage);
    this.ctx.lineWidth = 12;
    this.ctx.stroke();
    
    // Score percentage
    this.ctx.fillStyle = this.getScoreColor(data.percentage);
    this.ctx.font = `bold 72px Inter, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${data.percentage}%`, width / 2, centerY + 10);
    
    // Test type below circle
    this.ctx.fillStyle = colors.text;
    this.ctx.font = `bold 32px Inter, sans-serif`;
    this.ctx.fillText(data.testType, width / 2, centerY + scoreRadius + 60);
    
    // Score details
    this.ctx.fillStyle = colors.textSecondary;
    this.ctx.font = `24px Inter, sans-serif`;
    this.ctx.fillText(`${data.score}/${data.totalPoints} Points`, width / 2, centerY + scoreRadius + 100);
    
    if (data.asset) {
      this.ctx.fillText(data.asset.toUpperCase(), width / 2, centerY + scoreRadius + 130);
    }
    
    // Footer hashtags
    this.ctx.fillStyle = colors.primary;
    this.ctx.font = `18px Inter, sans-serif`;
    this.ctx.fillText('#TradingSkills #MarketAnalysis', width / 2, height - 40);
  }

  async generateAchievementCard(platform, data, logo, darkMode) {
    const specs = this.platformSpecs[platform];
    const colors = this.getColorScheme(darkMode);
    
    // Background with achievement-themed gradient
    const gradient = this.ctx.createRadialGradient(
      specs.width / 2, specs.height / 2, 0,
      specs.width / 2, specs.height / 2, Math.max(specs.width, specs.height) / 2
    );
    
    if (darkMode) {
      gradient.addColorStop(0, '#2d1b69');
      gradient.addColorStop(1, '#1a1a2e');
    } else {
      gradient.addColorStop(0, '#ffd700');
      gradient.addColorStop(0.3, '#ffed4e');
      gradient.addColorStop(1, '#f59e0b');
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, specs.width, specs.height);
    
    // Platform-specific achievement layout
    if (platform === 'instagram') {
      await this.renderSquareAchievement(data, logo, colors, specs);
    } else {
      await this.renderWideAchievement(data, logo, colors, specs);
    }
  }

  async renderWideAchievement(data, logo, colors, specs) {
    const { width, height } = specs;
    
    // Achievement icon (large)
    const iconSize = Math.min(150, width * 0.12);
    const iconX = 80;
    const iconY = height / 2 - iconSize / 2;
    
    this.ctx.font = `${iconSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(data.icon || '🏆', iconX + iconSize / 2, iconY + iconSize * 0.7);
    
    // Achievement title and description
    const textX = iconX + iconSize + 60;
    const textWidth = width - textX - 200;
    
    this.ctx.fillStyle = darkMode ? '#ffffff' : '#1a1a2e';
    this.ctx.font = `bold ${specs.titleFontSize}px Inter, sans-serif`;
    this.ctx.textAlign = 'left';
    this.wrapText(data.title, textX, height / 2 - 40, textWidth, specs.titleFontSize * 1.2);
    
    this.ctx.fillStyle = darkMode ? '#e2e8f0' : '#4a5568';
    this.ctx.font = `${specs.subtitleFontSize}px Inter, sans-serif`;
    this.wrapText(data.description, textX, height / 2 + 20, textWidth, specs.subtitleFontSize * 1.3);
    
    // Logo and branding in top right
    const logoSize = 50;
    this.ctx.drawImage(logo, width - logoSize - 40, 30, logoSize, logoSize);
    
    this.ctx.fillStyle = darkMode ? '#ffffff' : '#1a1a2e';
    this.ctx.font = `bold 20px Inter, sans-serif`;
    this.ctx.textAlign = 'right';
    this.ctx.fillText('MarketEfficient', width - 50, logoSize + 60);
    
    this.renderFooter(colors, specs);
  }

  async renderSquareAchievement(data, logo, colors, specs) {
    const { width, height } = specs;
    
    // Large achievement icon at top
    const iconSize = 120;
    this.ctx.font = `${iconSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = darkMode ? '#ffffff' : '#1a1a2e';
    this.ctx.fillText(data.icon || '🏆', width / 2, 200);
    
    // Achievement unlocked text
    this.ctx.fillStyle = darkMode ? '#ffd700' : '#b45309';
    this.ctx.font = `bold 28px Inter, sans-serif`;
    this.ctx.fillText('ACHIEVEMENT UNLOCKED', width / 2, 280);
    
    // Title
    this.ctx.fillStyle = darkMode ? '#ffffff' : '#1a1a2e';
    this.ctx.font = `bold 36px Inter, sans-serif`;
    this.wrapText(data.title, width / 2, 340, width - 80, 45, 'center');
    
    // Description
    this.ctx.fillStyle = darkMode ? '#e2e8f0' : '#4a5568';
    this.ctx.font = `24px Inter, sans-serif`;
    this.wrapText(data.description, width / 2, 420, width - 80, 30, 'center');
    
    // Logo at bottom
    const logoSize = 40;
    this.ctx.drawImage(logo, (width - logoSize) / 2, height - 120, logoSize, logoSize);
    
    this.ctx.fillStyle = darkMode ? '#ffffff' : '#1a1a2e';
    this.ctx.font = `bold 18px Inter, sans-serif`;
    this.ctx.fillText('MarketEfficient', width / 2, height - 60);
  }

  async generateTradingCard(platform, data, logo, darkMode) {
    const specs = this.platformSpecs[platform];
    const colors = this.getColorScheme(darkMode);
    
    // Trading-themed background
    const gradient = this.ctx.createLinearGradient(0, 0, specs.width, specs.height);
    const isProfit = data.return > 0;
    
    if (darkMode) {
      gradient.addColorStop(0, isProfit ? '#064e3b' : '#7f1d1d');
      gradient.addColorStop(1, '#1a1a2e');
    } else {
      gradient.addColorStop(0, isProfit ? '#dcfce7' : '#fee2e2');
      gradient.addColorStop(1, '#f8fafc');
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, specs.width, specs.height);
    
    if (platform === 'instagram') {
      await this.renderSquareTrading(data, logo, colors, specs);
    } else {
      await this.renderWideTrading(data, logo, colors, specs);
    }
  }

  async renderWideTrading(data, logo, colors, specs) {
    const { width, height } = specs;
    const isProfit = data.return > 0;
    const returnColor = isProfit ? '#10b981' : '#ef4444';
    
    // Trade direction icon
    const iconSize = 100;
    const iconX = 80;
    const iconY = height / 2 - iconSize / 2;
    
    this.ctx.fillStyle = returnColor;
    this.ctx.font = `${iconSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(isProfit ? '📈' : '📉', iconX + iconSize / 2, iconY + iconSize * 0.7);
    
    // Trade details
    const textX = iconX + iconSize + 60;
    
    this.ctx.fillStyle = colors.text;
    this.ctx.font = `bold ${specs.titleFontSize}px Inter, sans-serif`;
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${data.side.toUpperCase()} ${data.symbol}`, textX, height / 2 - 40);
    
    // Return percentage (large and prominent)
    this.ctx.fillStyle = returnColor;
    this.ctx.font = `bold ${specs.titleFontSize + 20}px Inter, sans-serif`;
    const returnText = isProfit ? `+${data.return.toFixed(1)}%` : `${data.return.toFixed(1)}%`;
    this.ctx.fillText(returnText, textX, height / 2 + 20);
    
    this.ctx.fillStyle = colors.textSecondary;
    this.ctx.font = `${specs.subtitleFontSize}px Inter, sans-serif`;
    this.ctx.fillText('Return', textX, height / 2 + 60);
    
    // Logo and branding
    const logoSize = 50;
    this.ctx.drawImage(logo, width - logoSize - 40, 30, logoSize, logoSize);
    
    this.ctx.fillStyle = colors.primary;
    this.ctx.font = `bold 20px Inter, sans-serif`;
    this.ctx.textAlign = 'right';
    this.ctx.fillText('MarketEfficient', width - 50, logoSize + 60);
    
    this.renderFooter(colors, specs);
  }

  async renderSquareTrading(data, logo, colors, specs) {
    const { width, height } = specs;
    const isProfit = data.return > 0;
    const returnColor = isProfit ? '#10b981' : '#ef4444';
    
    // Trade symbol at top
    this.ctx.fillStyle = colors.text;
    this.ctx.font = `bold 48px Inter, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(data.symbol, width / 2, 150);
    
    // Trade direction
    this.ctx.fillStyle = colors.textSecondary;
    this.ctx.font = `28px Inter, sans-serif`;
    this.ctx.fillText(data.side.toUpperCase() + ' TRADE', width / 2, 190);
    
    // Large return in center
    const returnText = isProfit ? `+${data.return.toFixed(1)}%` : `${data.return.toFixed(1)}%`;
    this.ctx.fillStyle = returnColor;
    this.ctx.font = `bold 80px Inter, sans-serif`;
    this.ctx.fillText(returnText, width / 2, height / 2 + 20);
    
    // Return label
    this.ctx.fillStyle = colors.textSecondary;
    this.ctx.font = `24px Inter, sans-serif`;
    this.ctx.fillText('RETURN', width / 2, height / 2 + 60);
    
    // Trend icon
    const iconSize = 80;
    this.ctx.font = `${iconSize}px Arial`;
    this.ctx.fillText(isProfit ? '📈' : '📉', width / 2, height / 2 + 150);
    
    // Logo at bottom
    const logoSize = 40;
    this.ctx.drawImage(logo, (width - logoSize) / 2, height - 120, logoSize, logoSize);
    
    this.ctx.fillStyle = colors.primary;
    this.ctx.font = `bold 18px Inter, sans-serif`;
    this.ctx.fillText('MarketEfficient', width / 2, height - 60);
  }

  async generateProfileCard(platform, data, logo, darkMode) {
    const specs = this.platformSpecs[platform];
    const colors = this.getColorScheme(darkMode);
    
    // Professional gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, specs.width, specs.height);
    if (darkMode) {
      gradient.addColorStop(0, '#1e293b');
      gradient.addColorStop(1, '#0f172a');
    } else {
      gradient.addColorStop(0, '#f1f5f9');
      gradient.addColorStop(1, '#cbd5e1');
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, specs.width, specs.height);
    
    if (platform === 'instagram') {
      await this.renderSquareProfile(data, logo, colors, specs);
    } else {
      await this.renderWideProfile(data, logo, colors, specs);
    }
  }

  renderFooter(colors, specs) {
    const { width, height } = specs;
    
    // Footer with hashtags
    this.ctx.fillStyle = colors.textSecondary;
    this.ctx.font = `18px Inter, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('#TradingSkills #MarketAnalysis #TradingEducation', width / 2, height - 30);
  }

  renderAchievementBadge(x, y, text, color) {
    const padding = 20;
    const badgeHeight = 40;
    
    // Badge background
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, 200, badgeHeight, 20);
    this.ctx.fill();
    
    // Badge text
    this.ctx.fillStyle = '#000000';
    this.ctx.font = 'bold 16px Inter, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, x + 100, y + 26);
  }

  wrapText(text, x, y, maxWidth, lineHeight, align = 'left') {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = this.ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        this.ctx.textAlign = align;
        const finalX = align === 'center' ? x : x;
        this.ctx.fillText(line, finalX, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    
    this.ctx.textAlign = align;
    const finalX = align === 'center' ? x : x;
    this.ctx.fillText(line, finalX, currentY);
  }

  getColorScheme(darkMode) {
    return {
      primary: '#2196F3',
      text: darkMode ? '#ffffff' : '#1a202c',
      textSecondary: darkMode ? '#a0aec0' : '#4a5568',
      background: darkMode ? '#1a202c' : '#ffffff',
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

  getOptimalQuality(platform) {
    // Balance quality vs file size for each platform
    const qualityMap = {
      twitter: 0.85,
      linkedin: 0.9,
      instagram: 0.92
    };
    
    return qualityMap[platform] || 0.85;
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
}

export default SocialImageGenerator;