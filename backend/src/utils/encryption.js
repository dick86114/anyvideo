const crypto = require('crypto');

class EncryptionService {
  constructor() {
    // Use environment variable or default key
    this.secretKey = process.env.ENCRYPTION_KEY || 'default-secret-key-change-in-production';
    this.algorithm = 'aes-256-cbc';
  }

  /**
   * Encrypt text
   * @param {string} text - Text to encrypt
   * @returns {string} Encrypted text with IV prepended
   */
  encrypt(text) {
    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);
      
      // Create a key from the secret key
      const key = crypto.scryptSync(this.secretKey, 'salt', 32);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      // Encrypt the text
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Prepend IV to encrypted text
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('加密失败');
    }
  }

  /**
   * Decrypt text
   * @param {string} encryptedText - Encrypted text with IV prepended
   * @returns {string} Decrypted text
   */
  decrypt(encryptedText) {
    try {
      // Split IV and encrypted text
      const parts = encryptedText.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted text format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      // Create a key from the secret key
      const key = crypto.scryptSync(this.secretKey, 'salt', 32);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      
      // Decrypt the text
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('解密失败');
    }
  }

  /**
   * Generate a secure random key
   * @param {number} length - Key length in bytes
   * @returns {string} Random key in hex format
   */
  static generateKey(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash password using bcrypt-like approach with crypto
   * @param {string} password - Password to hash
   * @param {number} rounds - Number of rounds (default: 10)
   * @returns {string} Hashed password
   */
  static hashPassword(password, rounds = 10) {
    const salt = crypto.randomBytes(16).toString('hex');
    let hash = password + salt;
    
    for (let i = 0; i < rounds; i++) {
      hash = crypto.createHash('sha256').update(hash).digest('hex');
    }
    
    return `${rounds}:${salt}:${hash}`;
  }

  /**
   * Verify password against hash
   * @param {string} password - Password to verify
   * @param {string} hash - Hash to verify against
   * @returns {boolean} True if password matches
   */
  static verifyPassword(password, hash) {
    try {
      const parts = hash.split(':');
      if (parts.length !== 3) {
        return false;
      }
      
      const rounds = parseInt(parts[0]);
      const salt = parts[1];
      const originalHash = parts[2];
      
      let testHash = password + salt;
      for (let i = 0; i < rounds; i++) {
        testHash = crypto.createHash('sha256').update(testHash).digest('hex');
      }
      
      return testHash === originalHash;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new EncryptionService();