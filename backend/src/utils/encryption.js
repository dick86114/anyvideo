const crypto = require('crypto');

// Use environment variable for encryption key, or generate a default one
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16; // For AES, this is always 16 bytes

class EncryptionService {
  /**
   * Encrypts a string using AES-256-CBC encryption
   * @param {string} text - Text to encrypt
   * @returns {string} - Encrypted text in format "iv:encryptedData"
   */
  static encrypt(text) {
    if (typeof text !== 'string') {
      throw new Error('Encryption input must be a string');
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Decrypts a string using AES-256-CBC decryption
   * @param {string} encryptedText - Encrypted text in format "iv:encryptedData"
   * @returns {string} - Decrypted text
   */
  static decrypt(encryptedText) {
    if (typeof encryptedText !== 'string') {
      throw new Error('Decryption input must be a string');
    }

    const textParts = encryptedText.split(':');
    if (textParts.length !== 2) {
      throw new Error('Invalid encrypted format');
    }

    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedData = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  /**
   * Generates a secure random key for encryption
   * @returns {string} - 64-character hex string (32 bytes)
   */
  static generateKey() {
    return crypto.randomBytes(32).toString('hex');
  }
}

module.exports = EncryptionService;
