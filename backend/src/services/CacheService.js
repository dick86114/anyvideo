const NodeCache = require('node-cache');

class CacheService {
  constructor() {
    // Create cache instance with default TTL of 15 minutes (900 seconds)
    this.cache = new NodeCache({
      stdTTL: 900, // Default TTL: 15 minutes
      checkperiod: 300, // Check every 5 minutes for expired items
      maxKeys: 1000, // Maximum 1000 keys in cache
      useClones: false // Disable cloning for better performance
    });
  }

  /**
   * Set a key-value pair in cache
   * @param {string} key - Cache key
   * @param {any} value - Cache value
   * @param {number} [ttl] - Time to live in seconds (optional, overrides default)
   * @returns {boolean} - Success status
   */
  set(key, value, ttl = null) {
    return this.cache.set(key, value, ttl);
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any} - Cached value or undefined if not found
   */
  get(key) {
    return this.cache.get(key);
  }

  /**
   * Delete a key from cache
   * @param {string} key - Cache key
   * @returns {number} - Number of deleted keys
   */
  del(key) {
    return this.cache.del(key);
  }

  /**
   * Delete multiple keys from cache
   * @param {string[]} keys - Array of cache keys
   * @returns {number} - Number of deleted keys
   */
  delMultiple(keys) {
    return this.cache.del(keys);
  }

  /**
   * Clear all cache
   * @returns {boolean} - Success status
   */
  flush() {
    return this.cache.flushAll();
  }

  /**
   * Get cache stats
   * @returns {object} - Cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Check if a key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean} - Existence status
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Cache middleware for Express routes
   * @param {string} prefix - Cache key prefix
   * @param {number} [ttl] - Time to live in seconds
   * @returns {function} - Express middleware function
   */
  cacheMiddleware(prefix, ttl = null) {
    return async (req, res, next) => {
      // Create cache key from prefix and request URL
      const cacheKey = `${prefix}:${req.originalUrl}`;
      
      // Try to get cached data
      const cachedData = this.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = (body) => {
        // Cache successful responses (status 200)
        if (res.statusCode === 200) {
          this.set(cacheKey, body, ttl);
        }
        return originalJson.call(res, body);
      };
      
      next();
    };
  }

  /**
   * Generate a cache key for dashboard data
   * @returns {string} - Cache key
   */
  getDashboardCacheKey() {
    return 'dashboard:all';
  }

  /**
   * Generate a cache key for content list
   * @param {object} query - Query parameters
   * @returns {string} - Cache key
   */
  getContentListCacheKey(query) {
    // Sort query keys to ensure consistent cache key generation
    const sortedQuery = Object.keys(query)
      .sort()
      .map(key => `${key}=${JSON.stringify(query[key])}`)
      .join('&');
    return `content:list:${sortedQuery}`;
  }

  /**
   * Generate a cache key for hotsearch data
   * @param {string} platform - Platform name
   * @param {string} [date] - Date string (optional)
   * @returns {string} - Cache key
   */
  getHotsearchCacheKey(platform, date = null) {
    if (date) {
      return `hotsearch:${platform}:${date}`;
    }
    return `hotsearch:${platform}`;
  }
}

// Export a singleton instance
module.exports = new CacheService();
