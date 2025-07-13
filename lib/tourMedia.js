// Tour media management and placeholder system

export const createMediaPlaceholder = (type, title, description) => {
  const placeholderData = {
    video: {
      icon: '🎬',
      bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      title: `${title} Video Demo`,
      description: description || 'Interactive video demonstration'
    },
    gif: {
      icon: '🎞️',
      bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      title: `${title} Animation`,
      description: description || 'Step-by-step animated guide'
    },
    image: {
      icon: '🖼️',
      bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      title: `${title} Screenshot`,
      description: description || 'Visual example'
    }
  };

  return placeholderData[type] || placeholderData.video;
};

export const mediaConfig = {
  // Base paths for different media types
  basePaths: {
    videos: '/videos/tours/',
    gifs: '/gifs/tours/',
    images: '/images/tours/'
  },
  
  // Supported formats
  formats: {
    video: ['mp4', 'webm'],
    gif: ['gif'],
    image: ['jpg', 'jpeg', 'png', 'webp']
  },
  
  // Quality settings
  quality: {
    video: {
      width: 400,
      height: 200,
      bitrate: '1M'
    },
    gif: {
      width: 400,
      height: 200,
      fps: 15
    }
  }
};

export const generateMediaPath = (category, filename, type = 'video') => {
  const basePath = mediaConfig.basePaths[`${type}s`] || mediaConfig.basePaths.videos;
  return `${basePath}${category}/${filename}`;
};

// Preloaded media URLs (for when actual media files are ready)
export const mediaUrls = {
  'bias-test': {
    'intro': {
      video: '/videos/tours/bias-test/intro.mp4',
      poster: '/images/tours/bias-test/intro-poster.jpg'
    },
    'asset-selection': {
      gif: '/gifs/tours/bias-test/asset-selection.gif'
    },
    'timeframe-selection': {
      gif: '/gifs/tours/bias-test/timeframe-selection.gif'
    },
    'chart-analysis': {
      video: '/videos/tours/bias-test/chart-analysis.mp4',
      poster: '/images/tours/bias-test/chart-analysis-poster.jpg'
    },
    'news-markers': {
      gif: '/gifs/tours/bias-test/news-markers.gif'
    },
    'prediction': {
      gif: '/gifs/tours/bias-test/make-prediction.gif'
    },
    'reasoning': {
      gif: '/gifs/tours/bias-test/reasoning-input.gif'
    },
    'confidence': {
      gif: '/gifs/tours/bias-test/confidence-level.gif'
    },
    'submit': {
      gif: '/gifs/tours/bias-test/submit-analysis.gif'
    },
    'results': {
      video: '/videos/tours/bias-test/ai-feedback.mp4',
      poster: '/images/tours/bias-test/ai-feedback-poster.jpg'
    }
  },
  
  'chart-exam': {
    'swing-analysis': {
      'intro': {
        video: '/videos/tours/chart-exam/swing-analysis-intro.mp4',
        poster: '/images/tours/chart-exam/swing-analysis-intro-poster.jpg'
      },
      'swing-highs': {
        gif: '/gifs/tours/chart-exam/swing-highs-demo.gif'
      },
      'swing-lows': {
        gif: '/gifs/tours/chart-exam/swing-lows-demo.gif'
      },
      'selection': {
        gif: '/gifs/tours/chart-exam/swing-selection.gif'
      },
      'timer': {
        gif: '/gifs/tours/chart-exam/timer-focus.gif'
      },
      'submit': {
        gif: '/gifs/tours/chart-exam/submit-swing-analysis.gif'
      }
    },
    
    'fibonacci-retracement': {
      'intro': {
        video: '/videos/tours/chart-exam/fibonacci-intro.mp4',
        poster: '/images/tours/chart-exam/fibonacci-intro-poster.jpg'
      },
      'trend': {
        gif: '/gifs/tours/chart-exam/fibonacci-trend.gif'
      },
      'start': {
        gif: '/gifs/tours/chart-exam/fibonacci-start.gif'
      },
      'end': {
        gif: '/gifs/tours/chart-exam/fibonacci-end.gif'
      },
      'levels': {
        video: '/videos/tours/chart-exam/fibonacci-levels.mp4',
        poster: '/images/tours/chart-exam/fibonacci-levels-poster.jpg'
      },
      'submit': {
        gif: '/gifs/tours/chart-exam/submit-fibonacci.gif'
      }
    },
    
    'fair-value-gaps': {
      'intro': {
        video: '/videos/tours/chart-exam/fvg-intro.mp4',
        poster: '/images/tours/chart-exam/fvg-intro-poster.jpg'
      },
      'definition': {
        gif: '/gifs/tours/chart-exam/fvg-definition.gif'
      },
      'bullish': {
        gif: '/gifs/tours/chart-exam/bullish-fvg.gif'
      },
      'bearish': {
        gif: '/gifs/tours/chart-exam/bearish-fvg.gif'
      },
      'drawing': {
        video: '/videos/tours/chart-exam/draw-fvg-boxes.mp4',
        poster: '/images/tours/chart-exam/draw-fvg-boxes-poster.jpg'
      },
      'timeframes': {
        gif: '/gifs/tours/chart-exam/fvg-timeframes.gif'
      },
      'submit': {
        gif: '/gifs/tours/chart-exam/submit-fvg.gif'
      }
    }
  }
};

// Utility to check if media file exists
export const checkMediaExists = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

// Generate fallback media object for tour steps
export const generateFallbackMedia = (category, step, mediaType = 'video') => {
  const stepKey = step.toLowerCase().replace(/\s+/g, '-');
  const urls = mediaUrls[category]?.[stepKey];
  
  if (urls) {
    return {
      type: mediaType,
      src: urls[mediaType] || urls.gif || urls.video,
      poster: urls.poster
    };
  }
  
  // Return placeholder if no URL found
  return null;
};

// Analytics for media engagement
export const trackMediaInteraction = (tourId, stepId, mediaType, action) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'tour_media_interaction', {
      tour_id: tourId,
      step_id: stepId,
      media_type: mediaType,
      action: action // 'play', 'pause', 'complete', 'skip'
    });
  }
};

// Preload critical tour media
export const preloadTourMedia = (tourId) => {
  const criticalMedia = [];
  
  if (tourId === 'bias-test') {
    criticalMedia.push(
      mediaUrls['bias-test']['intro']?.video,
      mediaUrls['bias-test']['chart-analysis']?.video
    );
  } else if (tourId.startsWith('chart-exam-')) {
    const examType = tourId.replace('chart-exam-', '');
    const examMedia = mediaUrls['chart-exam']?.[examType];
    if (examMedia?.intro?.video) {
      criticalMedia.push(examMedia.intro.video);
    }
  }
  
  // Preload critical media files
  criticalMedia.filter(Boolean).forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
};