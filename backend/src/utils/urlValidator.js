/**
 * URL Validator Utility
 * Provides functions to validate URLs, especially image URLs
 */

/**
 * Validate if a string is a valid URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if the URL is valid, false otherwise
 */
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate if a URL is an image URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if the URL is an image URL, false otherwise
 */
const isValidImageUrl = (url) => {
  if (!isValidUrl(url)) {
    return false;
  }

  // Check if URL ends with common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff)$/i;
  if (imageExtensions.test(url)) {
    return true;
  }

  // Check if URL contains image-related keywords
  const imageKeywords = /(image|img|photo|picture|pic|thumbnail)/i;
  if (imageKeywords.test(url)) {
    return true;
  }

  return false;
};

/**
 * Normalize URL - ensure it has a protocol and is properly formatted
 * @param {string} url - The URL to normalize
 * @param {string} defaultProtocol - Default protocol to use (default: https)
 * @returns {string|null} - Normalized URL or null if invalid
 */
const normalizeUrl = (url, defaultProtocol = 'https') => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Remove whitespace
  url = url.trim();

  try {
    // If URL already has a protocol, return it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // If URL starts with //, add protocol
    if (url.startsWith('//')) {
      return `${defaultProtocol}:${url}`;
    }

    // If URL is an absolute path, add domain
    if (url.startsWith('/')) {
      return `${defaultProtocol}://www.xiaohongshu.com${url}`;
    }

    // Otherwise, assume it's a relative path or invalid
    return null;
  } catch (error) {
    console.error('Error normalizing URL:', error);
    return null;
  }
};

/**
 * Filter and normalize image URLs from an array
 * @param {Array<string>} urls - Array of URLs to filter and normalize
 * @returns {Array<string>} - Array of valid, normalized image URLs
 */
const filterAndNormalizeImageUrls = (urls) => {
  if (!Array.isArray(urls)) {
    return [];
  }

  return urls
    .map(url => normalizeUrl(url))
    .filter(url => url && isValidImageUrl(url));
};

// Export functions using CommonJS syntax
module.exports = {
  isValidUrl,
  isValidImageUrl,
  normalizeUrl,
  filterAndNormalizeImageUrls
};



