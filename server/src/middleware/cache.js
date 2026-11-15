const { cacheGet, cacheSet } = require('../config/cache');

/**
 * Express middleware for caching JSON responses
 * @param {string|Function} keyGenerator - Cache key or function returning cache key
 * @param {number} ttlSeconds - Time-to-live in seconds (default 300)
 */
const cacheMiddleware = (keyGenerator, ttlSeconds = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = typeof keyGenerator === 'function' ? keyGenerator(req) : keyGenerator;

    try {
      const cached = await cacheGet(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }
    } catch (err) {
      console.warn(`[Cache Middleware] Error retrieving key ${key}:`, err.message);
    }

    // Cache MISS: intercept res.json
    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Only cache successful 200 responses
      if (res.statusCode === 200 && body && body.success !== false) {
        cacheSet(key, body, ttlSeconds).catch((err) => {
          console.warn(`[Cache Middleware] Failed to cache key ${key}:`, err.message);
        });
      }
      return originalJson(body);
    };

    next();
  };
};

module.exports = { cacheMiddleware };
