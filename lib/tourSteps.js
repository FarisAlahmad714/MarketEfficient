// Guided tour step definitions for bias test and charting exams

export const biasTestTourSteps = [
  {
    title: "Complete Bias Test Tutorial",
    description: "Watch this comprehensive video to learn how to use all the tools and features in the bias test. The tour will continue after the video to highlight specific elements.",
    targetSelector: null, // No highlight for intro video
    media: {
      type: "video",
      src: "/videos/tours/bias-test-complete-tutorial.mp4",
      poster: "/images/tours/bias-test-tutorial-poster.jpg"
    },
    autoAdvance: true // Auto-advance when video ends
  },
  {
    title: "Help Button",
    description: "Click this help button anytime to restart this guided tour if you need assistance during the test.",
    targetSelector: ".help-button",
    media: null // No media, just highlight the tool
  },
  {
    title: "Chart Analysis Area",
    description: "This is where you'll analyze real price charts with historical data. Study the candlestick patterns, volume, and overall trend.",
    targetSelector: ".chart-container",
    media: null
  },
  {
    title: "News Events",
    description: "Blue dots (📰) on the chart represent news events. Hover over them to see how real-world events affected price movements.",
    targetSelector: ".chart-container",
    media: null
  },
  {
    title: "Prediction Controls",
    description: "Use these buttons to make your predictions - choose either 'Bullish' (price goes up) or 'Bearish' (price goes down).",
    targetSelector: ".prediction-buttons",
    media: null,
    forceCenter: true // Force modal to center due to bottom positioning
  },
  {
    title: "Submit Button",
    description: "After completing all predictions, click here to submit your analysis and receive AI feedback on your trading decisions.",
    targetSelector: ".submit-button",
    media: null,
    forceCenter: true // Force modal to center due to bottom positioning
  }
];

export const chartExamTourSteps = {
  'swing-analysis': [
    {
      title: "Swing Point Analysis Tutorial",
      description: "Watch this complete tutorial on identifying swing highs and lows. After the video, we'll highlight the specific tools you'll use.",
      targetSelector: null,
      media: {
        type: "video",
        src: "/videos/tours/swing-analysis-complete-tutorial.mp4",
        poster: "/images/tours/swing-analysis-tutorial-poster.jpg"
      },
      autoAdvance: true
    },
    {
      title: "Help Button",
      description: "Click here anytime to restart this tour if you need help during the exam.",
      targetSelector: ".help-button",
      media: null
    },
    {
      title: "Timer Area",
      description: "Monitor your remaining time here. The timer shows minutes and seconds left for this chart.",
      targetSelector: "[class*='TimerContainer'], [class*='timer']",
      media: null
    },
    {
      title: "Chart Canvas",
      description: "This is the main chart where you'll click on candles to mark swing highs and lows. Look for significant turning points.",
      targetSelector: "[class*='ChartContainer'], [class*='chart-container']",
      media: null
    },
    {
      title: "Tool Panel & Results",
      description: "Your swing point selections and scoring appear here. Green dots show correct picks, yellow shows missed opportunities.",
      targetSelector: ".panel-header, [class*='ToolPanel']",
      media: null
    },
    {
      title: "Submit Area",
      description: "Once you've identified all swing points, use the submit button at the bottom to complete this chart.",
      targetSelector: "[class*='Button'], [class*='submit']",
      media: null,
      forceCenter: true
    }
  ],

  'fibonacci-retracement': [
    {
      title: "Fibonacci Retracement Tutorial",
      description: "Watch this comprehensive tutorial on drawing Fibonacci retracement levels. After the video, we'll show you the specific tools.",
      targetSelector: null,
      media: {
        type: "video",
        src: "/videos/tours/fibonacci-complete-tutorial.mp4",
        poster: "/images/tours/fibonacci-tutorial-poster.jpg"
      },
      autoAdvance: true
    },
    {
      title: "Help Button",
      description: "Click here anytime to restart this tour if you need help during the exam.",
      targetSelector: ".help-button",
      media: null
    },
    {
      title: "Timer Area",
      description: "Monitor your remaining time for this Fibonacci drawing exercise.",
      targetSelector: "[class*='TimerContainer'], [class*='timer']",
      media: null
    },
    {
      title: "Chart Canvas",
      description: "Click on the swing low/high first, then click the opposite extreme to draw your Fibonacci retracement levels.",
      targetSelector: "[class*='ChartContainer'], [class*='chart-container']",
      media: null
    },
    {
      title: "Drawing Tools & Settings",
      description: "Your Fibonacci drawing tools and settings panel. You can adjust levels and see your drawing details here.",
      targetSelector: ".drawing-header, .drawing-details, [class*='Settings']",
      media: null
    },
    {
      title: "Fibonacci Levels Panel",
      description: "Once you draw, the key Fibonacci levels (23.6%, 38.2%, 50%, 61.8%, 78.6%) will display here with their price values.",
      targetSelector: ".panel-header, [class*='ToolPanel']",
      media: null
    },
    {
      title: "Submit Area",
      description: "When satisfied with your Fibonacci placement, click the submit button to get your accuracy score.",
      targetSelector: "[class*='Button'], [class*='submit']",
      media: null,
      forceCenter: true
    }
  ],

  'fair-value-gaps': [
    {
      title: "Fair Value Gaps Tutorial",
      description: "Watch this complete tutorial on identifying and drawing Fair Value Gaps. After the video, we'll highlight the tools you'll use.",
      targetSelector: null,
      media: {
        type: "video",
        src: "/videos/tours/fvg-complete-tutorial.mp4",
        poster: "/images/tours/fvg-tutorial-poster.jpg"
      },
      autoAdvance: true
    },
    {
      title: "Help Button",
      description: "Click here anytime to restart this tour if you need help during the exam.",
      targetSelector: ".help-button",
      media: null
    },
    {
      title: "Timer Area",
      description: "Monitor your remaining time for identifying Fair Value Gaps on this chart.",
      targetSelector: "[class*='TimerContainer'], [class*='timer']",
      media: null
    },
    {
      title: "Chart Canvas",
      description: "Look for gaps where price moved quickly - the high of one candle doesn't overlap with the low of a nearby candle.",
      targetSelector: "[class*='ChartContainer'], [class*='chart-container']",
      media: null
    },
    {
      title: "FVG Drawing Mode",
      description: "Use drawing mode to mark Fair Value Gaps by clicking on the gap boundaries. First click sets the top, second click sets the bottom.",
      targetSelector: ".fvg-header, [class*='drawing']",
      media: null
    },
    {
      title: "FVG Analysis Panel",
      description: "Your identified Fair Value Gaps appear here, showing bullish (green) and bearish (red) gaps with their price ranges.",
      targetSelector: ".panel-header, [class*='ToolPanel']",
      media: null
    },
    {
      title: "Submit Area",
      description: "Once you've identified all significant Fair Value Gaps, click submit to receive your accuracy score.",
      targetSelector: "[class*='Button'], [class*='submit']",
      media: null,
      forceCenter: true
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