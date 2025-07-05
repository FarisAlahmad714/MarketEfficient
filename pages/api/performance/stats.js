// pages/api/performance/stats.js
import { getCacheStats } from '../../../lib/cache';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Get cache statistics
    const cacheStats = getCacheStats();
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    // Format memory usage in MB
    const formatMemory = (bytes) => Math.round(bytes / 1024 / 1024 * 100) / 100;
    
    const stats = {
      timestamp: new Date().toISOString(),
      cache: cacheStats,
      memory: {
        rss: formatMemory(memoryUsage.rss),
        heapUsed: formatMemory(memoryUsage.heapUsed),
        heapTotal: formatMemory(memoryUsage.heapTotal),
        external: formatMemory(memoryUsage.external),
        arrayBuffers: formatMemory(memoryUsage.arrayBuffers)
      },
      uptime: Math.round(process.uptime()),
      environment: process.env.NODE_ENV
    };

    // Set cache headers for monitoring tools
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return res.status(200).json(stats);
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to fetch performance statistics',
      details: error.message 
    });
  }
}