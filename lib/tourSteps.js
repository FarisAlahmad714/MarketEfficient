// Guided tour step definitions for bias test and charting exams

export const biasTestTourSteps = [
  {
    title: "Welcome to the Live Bias Test",
    description: "You're now in the actual bias test! This interactive exam helps identify cognitive biases in your trading decisions. Let's walk through each step.",
    targetSelector: null, // No highlight for intro
    media: {
      type: "video",
      src: "/videos/tours/bias-test-intro.mp4",
      poster: "/images/tours/bias-test-intro-poster.jpg"
    }
  },
  {
    title: "Help Button",
    description: "Click this help button anytime to restart this guided tour if you need assistance during the test.",
    targetSelector: ".help-button",
    media: {
      type: "gif",
      src: "/videos/tours/help-button-demo.gif"
    }
  },
  {
    title: "Analyze the Chart",
    description: "Each question shows a real price chart with historical data. Study the candlestick patterns, volume, and overall trend carefully.",
    targetSelector: ".chart-container",
    media: {
      type: "video",
      src: "/videos/tours/chart-analysis.mp4",
      poster: "/images/tours/chart-analysis-poster.jpg"
    }
  },
  {
    title: "News Integration",
    description: "Blue dots (📰) on the chart represent news events. Hover over them to see how real-world events affected price movements.",
    targetSelector: ".chart-container",
    media: {
      type: "gif",
      src: "/videos/tours/news-markers.gif"
    }
  },
  {
    title: "Make Your Predictions",
    description: "For each chart, you'll choose either 'Bullish' (price goes up) or 'Bearish' (price goes down), then explain your reasoning and set a confidence level.",
    targetSelector: null,
    media: {
      type: "gif",
      src: "/videos/tours/prediction-process.gif"
    }
  },
  {
    title: "Complete the Analysis",
    description: "After making predictions for all charts, submit your answers to receive AI feedback on your trading decisions and cognitive biases.",
    targetSelector: null,
    media: {
      type: "gif",
      src: "/videos/tours/complete-analysis.gif"
    }
  },
  {
    title: "Ready to Begin!",
    description: "You're all set! Take your time analyzing each chart. Focus on patterns, not emotions. The test helps you become a better trader by identifying cognitive biases. Good luck!",
    targetSelector: null,
    media: {
      type: "video",
      src: "/videos/tours/ready-to-begin.mp4",
      poster: "/images/tours/ready-to-begin-poster.jpg"
    }
  }
];

export const chartExamTourSteps = {
  'swing-analysis': [
    {
      title: "Swing Point Analysis - Beginner",
      description: "Learn to identify swing highs and lows on price charts. These are critical pivot points that define market structure.",
      targetSelector: null,
      media: {
        type: "video",
        src: "/videos/tours/swing-analysis-intro.mp4",
        poster: "/images/tours/swing-analysis-intro-poster.jpg"
      }
    },
    {
      title: "Understanding Swing Highs",
      description: "A swing high is formed when a candle's high is higher than the highs of the candles before and after it. Click on swing highs you identify.",
      targetSelector: ".chart-container",
      media: {
        type: "gif",
        src: "/videos/tours/swing-highs-demo.gif"
      }
    },
    {
      title: "Understanding Swing Lows",
      description: "A swing low is formed when a candle's low is lower than the lows of the adjacent candles. These often act as support levels.",
      targetSelector: ".chart-container",
      media: {
        type: "gif",
        src: "/videos/tours/swing-lows-demo.gif"
      }
    },
    {
      title: "Making Your Selections",
      description: "Click directly on the candles that represent swing points. You can remove selections by clicking them again.",
      targetSelector: ".interactive-chart",
      media: {
        type: "gif",
        src: "/videos/tours/swing-selection.gif"
      }
    },
    {
      title: "Timer and Focus",
      description: "You have a time limit for each chart. The timer pauses if you switch tabs, so stay focused on the analysis.",
      targetSelector: ".timer-display",
      media: {
        type: "gif",
        src: "/videos/tours/timer-focus.gif"
      }
    },
    {
      title: "Submit Your Analysis",
      description: "Once you've identified all swing points, submit your analysis. You'll receive immediate feedback on accuracy.",
      targetSelector: ".submit-exam-button",
      media: {
        type: "gif",
        src: "/videos/tours/submit-swing-analysis.gif"
      }
    }
  ],

  'fibonacci-retracement': [
    {
      title: "Fibonacci Retracements - Intermediate",
      description: "Master the art of drawing Fibonacci retracement levels to identify potential support and resistance zones.",
      targetSelector: null,
      media: {
        type: "video",
        src: "/videos/tours/fibonacci-intro.mp4",
        poster: "/images/tours/fibonacci-intro-poster.jpg"
      }
    },
    {
      title: "Identify the Trend",
      description: "First, identify the main trend direction. For uptrends, draw from swing low to swing high. For downtrends, reverse this.",
      targetSelector: ".chart-container",
      media: {
        type: "gif",
        src: "/videos/tours/fibonacci-trend.gif"
      }
    },
    {
      title: "Select Starting Point",
      description: "Click on the swing low (for uptrend) or swing high (for downtrend) to start your Fibonacci retracement line.",
      targetSelector: ".interactive-chart",
      media: {
        type: "gif",
        src: "/videos/tours/fibonacci-start.gif"
      }
    },
    {
      title: "Set Ending Point",
      description: "Click on the opposite swing point to complete your Fibonacci retracement. The levels will automatically appear.",
      targetSelector: ".interactive-chart",
      media: {
        type: "gif",
        src: "/videos/tours/fibonacci-end.gif"
      }
    },
    {
      title: "Fibonacci Levels",
      description: "The key levels (23.6%, 38.2%, 50%, 61.8%, 78.6%) will be drawn automatically. These often act as support/resistance.",
      targetSelector: ".fibonacci-levels",
      media: {
        type: "video",
        src: "/videos/tours/fibonacci-levels.mp4",
        poster: "/images/tours/fibonacci-levels-poster.jpg"
      }
    },
    {
      title: "Review and Submit",
      description: "Check your Fibonacci placement and submit when satisfied. Accuracy is measured by how well your levels align with price action.",
      targetSelector: ".submit-exam-button",
      media: {
        type: "gif",
        src: "/videos/tours/submit-fibonacci.gif"
      }
    }
  ],

  'fair-value-gaps': [
    {
      title: "Fair Value Gaps - Advanced",
      description: "Learn to identify Fair Value Gaps (FVGs) - areas where price moved so quickly that it left inefficiencies in the market.",
      targetSelector: null,
      media: {
        type: "video",
        src: "/videos/tours/fvg-intro.mp4",
        poster: "/images/tours/fvg-intro-poster.jpg"
      }
    },
    {
      title: "What is a Fair Value Gap?",
      description: "An FVG occurs when the high of candle 1 doesn't overlap with the low of candle 3, creating a 'gap' in price action.",
      targetSelector: ".chart-container",
      media: {
        type: "gif",
        src: "/videos/tours/fvg-definition.gif"
      }
    },
    {
      title: "Bullish Fair Value Gaps",
      description: "In upward moves, look for gaps where price 'jumped' higher, leaving unfilled areas that may act as support later.",
      targetSelector: ".interactive-chart",
      media: {
        type: "gif",
        src: "/videos/tours/bullish-fvg.gif"
      }
    },
    {
      title: "Bearish Fair Value Gaps",
      description: "In downward moves, identify gaps where price fell rapidly, creating overhead resistance zones.",
      targetSelector: ".interactive-chart",
      media: {
        type: "gif",
        src: "/videos/tours/bearish-fvg.gif"
      }
    },
    {
      title: "Drawing FVG Boxes",
      description: "Click on the starting high/low THEN the ending high/low to draw the FVG boxes around Fair Value Gaps. The top and bottom should align with the gap boundaries.",
      targetSelector: ".drawing-tools",
      media: {
        type: "video",
        src: "/videos/tours/draw-fvg-boxes.mp4",
        poster: "/images/tours/draw-fvg-boxes-poster.jpg"
      }
    },
    {
      title: "Multiple Timeframes",
      description: "FVGs can occur on any timeframe. Higher timeframe FVGs typically have more significance and stronger magnetic effects.",
      targetSelector: ".timeframe-selector",
      media: {
        type: "gif",
        src: "/videos/tours/fvg-timeframes.gif"
      }
    },
    {
      title: "Submit Your Analysis",
      description: "After identifying all significant FVGs, submit your analysis. Points are awarded for accuracy and completeness.",
      targetSelector: ".submit-exam-button",
      media: {
        type: "gif",
        src: "/videos/tours/submit-fvg.gif"
      }
    }
  ]
};

export const getTourSteps = (tourType, examType = null) => {
  switch (tourType) {
    case 'bias-test':
      return biasTestTourSteps;
    case 'chart-exam':
      return chartExamTourSteps[examType] || [];
    default:
      return [];
  }
};