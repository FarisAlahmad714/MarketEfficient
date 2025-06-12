import NodeCache from 'node-cache';

// Cache configurations for different data types
const cacheConfigs = {
  leaderboard: { stdTTL: 300, checkperiod: 60 }, // 5 minutes
  profileImages: { stdTTL: 1800, checkperiod: 300 }, // 30 minutes
  chartData: { stdTTL: 600, checkperiod: 120 }, // 10 minutes
  userMetrics: { stdTTL: 180, checkperiod: 60 }, // 3 minutes
  assetData: { stdTTL: 60, checkperiod: 30 }, // 1 minute
};

// Create separate cache instances for different data types
const caches = {};
Object.keys(cacheConfigs).forEach(key => {
  caches[key] = new NodeCache(cacheConfigs[key]);
});

// Cache wrapper functions
export const cache = {
  // Generic cache operations
  get: (type, key) => {
    if (!caches[type]) return null;
    return caches[type].get(key);
  },

  set: (type, key, value, ttl = null) => {
    if (!caches[type]) return false;
    return ttl ? caches[type].set(key, value, ttl) : caches[type].set(key, value);
  },

  del: (type, key) => {
    if (!caches[type]) return false;
    return caches[type].del(key);
  },

  flush: (type) => {
    if (!caches[type]) return false;
    return caches[type].flushAll();
  },

  // Specialized cache functions
  leaderboard: {
    get: (testType, period, limit) => {
      const key = `${testType}_${period}_${limit}`;
      return caches.leaderboard.get(key);
    },
    set: (testType, period, limit, data) => {
      const key = `${testType}_${period}_${limit}`;
      return caches.leaderboard.set(key, data);
    },
    invalidate: () => caches.leaderboard.flushAll(),
  },

  profileImages: {
    get: (userId) => caches.profileImages.get(`img_${userId}`),
    set: (userId, imageUrl, ttl = 1800) => caches.profileImages.set(`img_${userId}`, imageUrl, ttl),
    invalidate: (userId) => caches.profileImages.del(`img_${userId}`),
  },

  chartData: {
    get: (symbol, timeframe) => caches.chartData.get(`${symbol}_${timeframe}`),
    set: (symbol, timeframe, data) => caches.chartData.set(`${symbol}_${timeframe}`, data),
    invalidate: (symbol) => {
      const keys = caches.chartData.keys().filter(key => key.startsWith(`${symbol}_`));
      keys.forEach(key => caches.chartData.del(key));
    },
  },

  userMetrics: {
    get: (userId) => caches.userMetrics.get(`metrics_${userId}`),
    set: (userId, metrics) => caches.userMetrics.set(`metrics_${userId}`, metrics),
    invalidate: (userId) => caches.userMetrics.del(`metrics_${userId}`),
  },
};

// Cache statistics for monitoring
export const getCacheStats = () => {
  const stats = {};
  Object.keys(caches).forEach(type => {
    const cache = caches[type];
    stats[type] = {
      keys: cache.keys().length,
      hits: cache.getStats().hits,
      misses: cache.getStats().misses,
      hitRate: cache.getStats().hits / (cache.getStats().hits + cache.getStats().misses) || 0,
    };
  });
  return stats;
};

export default cache;