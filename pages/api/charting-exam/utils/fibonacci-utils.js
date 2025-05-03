import { detectSwingPoints } from './swing-detection';

// Calculate optimal Fibonacci retracement points
export function getFibonacciRetracement(chartData, direction = 'uptrend') {
  // First detect swing points
  const swingPoints = detectSwingPoints(chartData);
  
  if (direction === 'uptrend') {
    // For uptrend, find a significant low followed by a high
    const sortedLows = [...swingPoints.lows].sort((a, b) => a.time - b.time);
    const sortedHighs = [...swingPoints.highs].sort((a, b) => a.time - b.time);
    
    // Find most recent low with a subsequent high
    for (let i = sortedLows.length - 1; i >= 0; i--) {
      const low = sortedLows[i];
      const subsequentHighs = sortedHighs.filter(h => h.time > low.time);
      
      if (subsequentHighs.length > 0) {
        // Find the highest subsequent high
        const high = subsequentHighs.reduce((highest, current) => 
          current.price > highest.price ? current : highest, subsequentHighs[0]);
          
        return {
          start: low,
          end: high,
          direction: 'uptrend'
        };
      }
    }
  } else {
    // For downtrend, find a significant high followed by a low
    const sortedHighs = [...swingPoints.highs].sort((a, b) => a.time - b.time);
    const sortedLows = [...swingPoints.lows].sort((a, b) => a.time - b.time);
    
    // Find most recent high with a subsequent low
    for (let i = sortedHighs.length - 1; i >= 0; i--) {
      const high = sortedHighs[i];
      const subsequentLows = sortedLows.filter(l => l.time > high.time);
      
      if (subsequentLows.length > 0) {
        // Find the lowest subsequent low
        const low = subsequentLows.reduce((lowest, current) => 
          current.price < lowest.price ? current : lowest, subsequentLows[0]);
          
        return {
          start: high,
          end: low,
          direction: 'downtrend'
        };
      }
    }
  }
  
  // If no suitable points found, return default
  return {
    start: { time: 0, price: 0 },
    end: { time: 0, price: 0 },
    direction: direction
  };
}

// Calculate all Fibonacci levels
export function calculateFibonacciLevels(start, end) {
  if (!start || !end) return [];
  
  const priceDiff = end.price - start.price;
  const direction = priceDiff > 0 ? 'uptrend' : 'downtrend';
  
  // Standard Fibonacci levels
  const fibLevels = [
    { level: 0, label: "0" },
    { level: 0.236, label: "0.236" },
    { level: 0.382, label: "0.382" },
    { level: 0.5, label: "0.5" },
    { level: 0.618, label: "0.618" },
    { level: 0.786, label: "0.786" },
    { level: 1, label: "1" },
    { level: 1.272, label: "1.272" },
    { level: 1.618, label: "1.618" }
  ];
  
  // Calculate price for each level
  const levels = fibLevels.map(fib => ({
    ...fib,
    price: start.price + (priceDiff * fib.level)
  }));
  
  return {
    direction,
    start,
    end,
    levels
  };
}