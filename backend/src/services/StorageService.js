const fs = require('fs-extra');
const path = require('path');

class StorageService {
  constructor() {
    this.storageType = process.env.STORAGE_TYPE || 'local';
    this.rootPath = process.env.STORAGE_ROOT_PATH || './media';
  }

  // Save file to storage
  async saveFile(fileData, filePath) {
    try {
      switch (this.storageType) {
        case 'local':
          return await this.saveLocalFile(fileData, filePath);
        case 'oss':
          return await this.saveOssFile(fileData, filePath);
        case 's3':
          return await this.saveS3File(fileData, filePath);
        default:
          throw new Error(`不支持的存储类型: ${this.storageType}`);
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
    }
  }

  // Generate unique filename by adding counter suffix if file already exists
  async generateUniqueFilename(basePath, filename) {
    try {
      let counter = 0;
      let finalFilename = filename;
      let finalPath = path.join(basePath, finalFilename);

      // Check if file exists and create unique name if needed
      while (await fs.pathExists(finalPath)) {
        counter++;
        const ext = path.extname(filename);
        const nameWithoutExt = path.basename(filename, ext);
        finalFilename = `${nameWithoutExt}(${counter})${ext}`;
        finalPath = path.join(basePath, finalFilename);
      }

      return finalFilename;
    } catch (error) {
      console.error('Failed to generate unique filename:', error);
      throw error;
    }
  }

  // Save file to local storage with filename conflict handling
  async saveLocalFile(fileData, relativePath) {
    try {
      const fullPath = path.join(this.rootPath, relativePath);
      const dirPath = path.dirname(fullPath);
      const originalFilename = path.basename(fullPath);
      
      // Ensure directory exists
      await fs.ensureDir(dirPath);

      // Generate unique filename if conflict exists
      const uniqueFilename = await this.generateUniqueFilename(dirPath, originalFilename);
      const uniqueFullPath = path.join(dirPath, uniqueFilename);
      const uniqueRelativePath = path.join(path.dirname(relativePath), uniqueFilename);

      // Write file with unique name
      await fs.writeFile(uniqueFullPath, fileData);

      return {
        path: uniqueRelativePath,
        url: `/media/${uniqueRelativePath}`,
        type: 'local'
      };
    } catch (error) {
      console.error('Failed to save local file:', error);
      throw error;
    }
  }

  // Save file to OSS (mock implementation)
  async saveOssFile(fileData, relativePath) {
    try {
      // Mock OSS upload
      // In real implementation, this would use OSS SDK
      console.log(`Mock uploading file to OSS: ${relativePath}`);

      return {
        path: relativePath,
        url: `https://oss.example.com/${relativePath}`,
        type: 'oss'
      };
    } catch (error) {
      console.error('Failed to save OSS file:', error);
      throw error;
    }
  }

  // Save file to S3 (mock implementation)
  async saveS3File(fileData, relativePath) {
    try {
      // Mock S3 upload
      // In real implementation, this would use AWS SDK
      console.log(`Mock uploading file to S3: ${relativePath}`);

      return {
        path: relativePath,
        url: `https://s3.amazonaws.com/bucket/${relativePath}`,
        type: 's3'
      };
    } catch (error) {
      console.error('Failed to save S3 file:', error);
      throw error;
    }
  }

  // Get file from storage
  async getFile(filePath) {
    try {
      switch (this.storageType) {
        case 'local':
          return await this.getLocalFile(filePath);
        case 'oss':
          return await this.getOssFile(filePath);
        case 's3':
          return await this.getS3File(filePath);
        default:
          throw new Error(`不支持的存储类型: ${this.storageType}`);
      }
    } catch (error) {
      console.error('Failed to get file:', error);
      throw error;
    }
  }

  // Get file from local storage
  async getLocalFile(relativePath) {
    try {
      const fullPath = path.join(this.rootPath, relativePath);
      const fileData = await fs.readFile(fullPath);

      return {
        data: fileData,
        type: 'local'
      };
    } catch (error) {
      console.error('Failed to get local file:', error);
      throw error;
    }
  }

  // Get file from OSS (mock implementation)
  async getOssFile(relativePath) {
    try {
      // Mock OSS download
      console.log(`Mock downloading file from OSS: ${relativePath}`);
      return {
        data: Buffer.from('Mock OSS file content'),
        type: 'oss'
      };
    } catch (error) {
      console.error('Failed to get OSS file:', error);
      throw error;
    }
  }

  // Get file from S3 (mock implementation)
  async getS3File(relativePath) {
    try {
      // Mock S3 download
      console.log(`Mock downloading file from S3: ${relativePath}`);
      return {
        data: Buffer.from('Mock S3 file content'),
        type: 's3'
      };
    } catch (error) {
      console.error('Failed to get S3 file:', error);
      throw error;
    }
  }

  // Get file from local storage
  async getLocalFile(relativePath) {
    try {
      const fullPath = path.join(this.rootPath, relativePath);
      const data = await fs.readFile(fullPath);
      return {
        data,
        type: 'local'
      };
    } catch (error) {
      console.error('Failed to get local file:', error);
      throw error;
    }
  }

  // Delete file from storage
  async deleteFile(filePath) {
    try {
      switch (this.storageType) {
        case 'local':
          return await this.deleteLocalFile(filePath);
        case 'oss':
          return await this.deleteOssFile(filePath);
        case 's3':
          return await this.deleteS3File(filePath);
        default:
          throw new Error(`不支持的存储类型: ${this.storageType}`);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  // Delete file from local storage
  async deleteLocalFile(relativePath) {
    try {
      const fullPath = path.join(this.rootPath, relativePath);
      await fs.unlink(fullPath);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete local file:', error);
      throw error;
    }
  }

  // Delete file from OSS (mock implementation)
  async deleteOssFile(relativePath) {
    try {
      // Mock OSS delete
      console.log(`Mock deleting file from OSS: ${relativePath}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete OSS file:', error);
      throw error;
    }
  }

  // Delete file from S3 (mock implementation)
  async deleteS3File(relativePath) {
    try {
      // Mock S3 delete
      console.log(`Mock deleting file from S3: ${relativePath}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete S3 file:', error);
      throw error;
    }
  }

  // Get file URL
  getFileUrl(filePath) {
    switch (this.storageType) {
      case 'local':
        return `/media/${filePath}`;
      case 'oss':
        return `https://oss.example.com/${filePath}`;
      case 's3':
        return `https://s3.amazonaws.com/bucket/${filePath}`;
      default:
        return `/media/${filePath}`;
    }
  }

  // Ensure directory exists (for local storage)
  async ensureDir(dirPath) {
    try {
      if (this.storageType === 'local') {
        const fullPath = path.join(this.rootPath, dirPath);
        await fs.ensureDir(fullPath);
      }
    } catch (error) {
      console.error('Failed to ensure directory exists:', error);
      throw error;
    }
  }
}

module.exports = new StorageService();