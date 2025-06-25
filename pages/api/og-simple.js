// pages/api/og-simple.js
export default function handler(req, res) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Just return your existing logo for now - at least this will work
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.webp');
    const logoBuffer = fs.readFileSync(logoPath);
    
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(logoBuffer);
  } catch (error) {
    return res.status(404).json({ error: 'Image not found' });
  }
}