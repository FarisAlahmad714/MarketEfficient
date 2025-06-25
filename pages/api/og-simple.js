// pages/api/og-simple.js
export default function handler(req, res) {
  const {
    title = 'Test Result',
    percentage = '80',
    testType = 'Bias Test'
  } = req.query;

  // Create a simple SVG image
  const svg = `
<svg width="1200" height="675" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="675" fill="#2196F3"/>
  <text x="600" y="280" text-anchor="middle" fill="white" font-size="48" font-family="Arial, sans-serif" font-weight="bold">
    ${percentage}% on ${testType}
  </text>
  <text x="600" y="360" text-anchor="middle" fill="white" font-size="32" font-family="Arial, sans-serif">
    MarketEfficient
  </text>
  <text x="600" y="420" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="24" font-family="Arial, sans-serif">
    Trading Skills & Market Analysis
  </text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
}