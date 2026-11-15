const { Redis } = require('@upstash/redis');
require('dotenv').config();

const isCacheConfigured = Boolean(
  process.env.CACHE_ENABLED === 'true' &&
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

let redisClient = null;
const MAX_MEMORY_ENTRIES = 500;
const memoryFallback = new Map(); // Local in-memory cache for dev/fallback

if (isCacheConfigured) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('Upstash Redis caching client initialized');
  } catch (err) {
    console.warn('Failed to initialize Upstash Redis, falling back to in-memory cache:', err.message);
  }
} else {
  console.log('ℹRemote Upstash Redis not configured or disabled; using resilient in-memory cache fallback');
}

/**
 * Retrieve cached data by key
 */
const cacheGet = async (key) => {
  try {
    if (redisClient) {
      const data = await redisClient.get(key);
      return data;
    }
    
    // In-memory fallback
    const item = memoryFallback.get(key);
    if (item) {
      if (Date.now() < item.expiresAt) {
        return item.value;
      }
      memoryFallback.delete(key);
    }
    return null;
  } catch (err) {
    console.warn(`[Cache Warning] Failed to get key "${key}":`, err.message);
    return null;
  }
};

/**
 * Set cached data with TTL (in seconds)
 */
const cacheSet = async (key, value, ttlSeconds = 300) => {
  try {
    if (redisClient) {
      await redisClient.set(key, value, { ex: ttlSeconds });
      return true;
    }

    // Reclaim expired entries even when their keys are never requested again.
    const now = Date.now();
    for (const [existingKey, item] of memoryFallback) {
      if (item.expiresAt <= now) memoryFallback.delete(existingKey);
    }
    memoryFallback.delete(key);
    if (memoryFallback.size >= MAX_MEMORY_ENTRIES) {
      memoryFallback.delete(memoryFallback.keys().next().value);
    }
    memoryFallback.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
    return true;
  } catch (err) {
    console.warn(`[Cache Warning] Failed to set key "${key}":`, err.message);
    return false;
  }
};

/**
 * Delete a specific key from cache
 */
const cacheDelete = async (key) => {
  try {
    if (redisClient) {
      await redisClient.del(key);
    }
    memoryFallback.delete(key);
    return true;
  } catch (err) {
    console.warn(`[Cache Warning] Failed to delete key "${key}":`, err.message);
    return false;
  }
};

/**
 * Delete keys matching a prefix or wildcard pattern
 */
const cacheDeletePattern = async (pattern) => {
  try {
    // Delete in memory map
    const prefix = pattern.replace('*', '');
    for (const key of memoryFallback.keys()) {
      if (key.startsWith(prefix)) {
        memoryFallback.delete(key);
      }
    }

    if (redisClient) {
      // Find matching keys in Redis
      const keys = await redisClient.keys(pattern);
      if (Array.isArray(keys) && keys.length > 0) {
        await redisClient.del(...keys);
      }
    }
    return true;
  } catch (err) {
    console.warn(`[Cache Warning] Failed to delete pattern "${pattern}":`, err.message);
    return false;
  }
};

module.exports = {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  isCacheConfigured
};
