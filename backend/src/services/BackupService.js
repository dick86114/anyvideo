const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const logger = require('../utils/logger');

class BackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 7; // Default: 7 days
  }

  /**
   * Create backup directory if it doesn't exist
   */
  async ensureBackupDir() {
    await fs.ensureDir(this.backupDir);
  }

  /**
   * Generate backup filename based on current date and time
   * @returns {string} Backup filename
   */
  generateBackupFilename() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    return `postgresql_backup_${year}${month}${day}_${hour}${minute}${second}.sql`;
  }

  /**
   * Execute pg_dump command to backup PostgreSQL database
   * @returns {Promise<string>} Path to backup file
   */
  async backupDatabase() {
    try {
      await this.ensureBackupDir();
      const backupFilename = this.generateBackupFilename();
      const backupPath = path.join(this.backupDir, backupFilename);

      // Build PostgreSQL connection string
      const dbHost = process.env.POSTGRES_HOST || 'localhost';
      const dbPort = process.env.POSTGRES_PORT || '5432';
      const dbName = process.env.POSTGRES_DATABASE || 'video_all';
      const dbUser = process.env.POSTGRES_USER || 'postgres';
      const dbPassword = process.env.POSTGRES_PASSWORD || '';

      // Execute pg_dump command
      await new Promise((resolve, reject) => {
        const command = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} > "${backupPath}"`;
        logger.info(`Executing PostgreSQL backup command`);
        
        const child = exec(command, (error, stdout, stderr) => {
          if (error) {
            logger.error(`PostgreSQL backup command failed: ${error.message}`);
            return reject(error);
          }
          if (stderr) {
            logger.warn(`PostgreSQL backup command stderr: ${stderr}`);
          }
          logger.info(`PostgreSQL backup completed successfully: ${backupPath}`);
          resolve(backupPath);
        });
      });

      // Cleanup old backups
      await this.cleanupOldBackups();

      return backupPath;
    } catch (error) {
      logger.error('Failed to backup PostgreSQL database:', error);
      throw error;
    }
  }

  /**
   * Cleanup old backups based on retention days
   */
  async cleanupOldBackups() {
    try {
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - this.retentionDays * 24 * 60 * 60 * 1000);

      // Get all backup files
      const files = await fs.readdir(this.backupDir);
      
      for (const file of files) {
        if (file.endsWith('.sql')) {
          const filePath = path.join(this.backupDir, file);
          const fileStats = await fs.stat(filePath);
          
          // Delete file if it's older than cutoff date
          if (fileStats.birthtime < cutoffDate) {
            logger.info(`Deleting old backup: ${file}`);
            await fs.unlink(filePath);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old backups:', error);
      // Don't throw error, cleanup is not critical
    }
  }

  /**
   * Get list of backup files
   * @returns {Promise<Array<object>>} List of backup files with metadata
   */
  async getBackupList() {
    try {
      await this.ensureBackupDir();
      const files = await fs.readdir(this.backupDir);
      const backupList = [];

      for (const file of files) {
        if (file.endsWith('.sql')) {
          const filePath = path.join(this.backupDir, file);
          const fileStats = await fs.stat(filePath);
          
          backupList.push({
            filename: file,
            path: filePath,
            size: fileStats.size,
            created_at: fileStats.birthtime,
            modified_at: fileStats.mtime
          });
        }
      }

      // Sort by created_at in descending order
      return backupList.sort((a, b) => b.created_at - a.created_at);
    } catch (error) {
      logger.error('Failed to get backup list:', error);
      return [];
    }
  }

  /**
   * Delete a specific backup file
   * @param {string} filename Backup filename to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteBackup(filename) {
    try {
      const backupPath = path.join(this.backupDir, filename);
      await fs.unlink(backupPath);
      logger.info(`Deleted backup: ${filename}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete backup ${filename}:`, error);
      return false;
    }
  }
}

module.exports = new BackupService();
