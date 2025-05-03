// pages/api/charting-exam/fetch-chart.js

import { fetchChartData } from '../../../lib/data-service';

export default async function handler(req, res) {
  try {
    // Get chart count from session if available
    const chartCount = req.session?.chartCount || 1;
    
    // Fetch new randomized chart data
    const { chart_data, symbol, timeframe } = await fetchChartData();
    
    // Validate the data
    if (!chart_data || chart_data.length < 20) {
      throw new Error("Insufficient chart data");
    }
    
    // Return the chart data with metadata
    res.status(200).json({
      chart_data,
      symbol,
      timeframe,
      chart_count: chartCount
    });
  } catch (error) {
    console.error("Error in fetch-chart API:", error);
    res.status(500).json({
      error: "Failed to fetch chart data",
      message: error.message
    });
  }
}