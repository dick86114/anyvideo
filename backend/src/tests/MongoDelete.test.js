const mongoose = require('mongoose');
const DeleteService = require('../services/DeleteService');
const { connectMongoDB } = require('../utils/mongoDB');

// Import Mongoose models
const Content = require('../models/Content');
const CrawlTask = require('../models/CrawlTask');

// Test data
const testContent = {
  platform: 'test-platform',
  content_id: 'test-content-id',
  title: 'Test Content',
  author: 'Test Author',
  description: 'Test Description',
  media_type: 'video',
  file_path: 'test/path/video.mp4',
  cover_url: 'https://example.com/cover.jpg',
  source_url: 'https://example.com/source',
  source_type: 1
};

const testCrawlTask = {
  name: 'Test Crawl Task',
  platform: 'test-platform',
  target_identifier: 'test-target',
  frequency: 'daily',
  status: 1,
  config: { test: 'config' }
};

describe('MongoDB Delete Functionality', () => {
  // Connect to MongoDB before all tests
  beforeAll(async () => {
    await connectMongoDB();
    // Ensure collections are empty before tests
    await Content.deleteMany({});
    await CrawlTask.deleteMany({});
  });

  // Clean up after all tests
  afterAll(async () => {
    await Content.deleteMany({});
    await CrawlTask.deleteMany({});
    await mongoose.connection.close();
  });

  describe('DeleteService', () => {
    let contentId;
    let crawlTaskId;

    // Create test documents before each test
    beforeEach(async () => {
      // Clean up before each test
      await Content.deleteMany({});
      await CrawlTask.deleteMany({});

      // Create test content
      const content = new Content(testContent);
      const savedContent = await content.save();
      contentId = savedContent._id.toString();

      // Create test crawl task
      const crawlTask = new CrawlTask(testCrawlTask);
      const savedCrawlTask = await crawlTask.save();
      crawlTaskId = savedCrawlTask._id.toString();
    });

    describe('softDeleteById', () => {
      it('should soft delete a document by ID', async () => {
        // Soft delete the content
        const deletedContent = await DeleteService.softDeleteById(Content, contentId);

        // Verify document was soft deleted
        expect(deletedContent).not.toBeNull();
        expect(deletedContent.deletedAt).not.toBeNull();

        // Verify document is not returned by default find
        const foundContent = await Content.findById(contentId);
        expect(foundContent).toBeNull();

        // Verify document is returned by findWithDeleted
        const foundWithDeleted = await Content.findByIdWithDeleted(contentId);
        expect(foundWithDeleted).not.toBeNull();
        expect(foundWithDeleted.deletedAt).not.toBeNull();
      });

      it('should return the same document if already soft deleted', async () => {
        // First soft delete
        await DeleteService.softDeleteById(Content, contentId);

        // Second soft delete should return the same document
        const deletedContent = await DeleteService.softDeleteById(Content, contentId);
        expect(deletedContent).not.toBeNull();
        expect(deletedContent.deletedAt).not.toBeNull();
      });

      it('should throw error for invalid ID', async () => {
        const invalidId = 'invalid-id';
        await expect(DeleteService.softDeleteById(Content, invalidId)).rejects.toThrow('Invalid document ID');
      });

      it('should throw error for non-existent ID', async () => {
        const nonExistentId = '60f0f0f0f0f0f0f0f0f0f0f0';
        await expect(DeleteService.softDeleteById(Content, nonExistentId)).rejects.toThrow('Document not found');
      });
    });

    describe('restoreById', () => {
      it('should restore a soft deleted document', async () => {
        // First soft delete
        await DeleteService.softDeleteById(Content, contentId);

        // Restore the document
        const restoredContent = await DeleteService.restoreById(Content, contentId);

        // Verify document was restored
        expect(restoredContent).not.toBeNull();
        expect(restoredContent.deletedAt).toBeNull();

        // Verify document is returned by default find
        const foundContent = await Content.findById(contentId);
        expect(foundContent).not.toBeNull();
        expect(foundContent.deletedAt).toBeNull();
      });

      it('should return the same document if not deleted', async () => {
        // Restore a non-deleted document
        const restoredContent = await DeleteService.restoreById(Content, contentId);
        expect(restoredContent).not.toBeNull();
        expect(restoredContent.deletedAt).toBeNull();
      });

      it('should throw error for invalid ID', async () => {
        const invalidId = 'invalid-id';
        await expect(DeleteService.restoreById(Content, invalidId)).rejects.toThrow('Invalid document ID');
      });
    });

    describe('deleteById', () => {
      it('should hard delete a document by ID', async () => {
        // Hard delete the content
        const deletedContent = await DeleteService.deleteById(Content, contentId);

        // Verify document was deleted
        expect(deletedContent).not.toBeNull();

        // Verify document is not returned by findWithDeleted
        const foundWithDeleted = await Content.findByIdWithDeleted(contentId);
        expect(foundWithDeleted).toBeNull();
      });

      it('should throw error for invalid ID', async () => {
        const invalidId = 'invalid-id';
        await expect(DeleteService.deleteById(Content, invalidId)).rejects.toThrow('Invalid document ID');
      });
    });

    describe('softDeleteByCriteria', () => {
      it('should soft delete multiple documents by criteria', async () => {
        // Create multiple test contents
        await Content.create([
          { ...testContent, content_id: 'test-id-2' },
          { ...testContent, content_id: 'test-id-3' }
        ]);

        // Soft delete all test contents
        const result = await DeleteService.softDeleteByCriteria(Content, { platform: 'test-platform' });

        // Verify documents were soft deleted
        expect(result).not.toBeNull();
        expect(result.modifiedCount).toBeGreaterThanOrEqual(3);

        // Verify no documents are returned by default find
        const foundContents = await Content.find({ platform: 'test-platform' });
        expect(foundContents).toHaveLength(0);
      });

      it('should return 0 modified count if no documents match criteria', async () => {
        // Soft delete with non-matching criteria
        const result = await DeleteService.softDeleteByCriteria(Content, { platform: 'non-existent-platform' });

        // Verify no documents were deleted
        expect(result).not.toBeNull();
        expect(result.modifiedCount).toBe(0);
      });

      it('should throw error for empty criteria', async () => {
        await expect(DeleteService.softDeleteByCriteria(Content, {})).rejects.toThrow('Deletion criteria must be provided');
      });
    });

    describe('deleteByCriteria', () => {
      it('should hard delete multiple documents by criteria', async () => {
        // Create multiple test contents
        await Content.create([
          { ...testContent, content_id: 'test-id-2' },
          { ...testContent, content_id: 'test-id-3' }
        ]);

        // Hard delete all test contents
        const result = await DeleteService.deleteByCriteria(Content, { platform: 'test-platform' });

        // Verify documents were hard deleted
        expect(result).not.toBeNull();
        expect(result.deletedCount).toBeGreaterThanOrEqual(3);

        // Verify no documents are returned by findWithDeleted
        const foundContents = await Content.findWithDeleted({ platform: 'test-platform' });
        expect(foundContents).toHaveLength(0);
      });
    });

    describe('executeInTransaction', () => {
      it('should execute multiple delete operations in transaction', async () => {
        // Create a transaction with multiple delete operations
        const operations = [
          async (session) => {
            return await DeleteService.softDeleteById(Content, contentId, { session });
          },
          async (session) => {
            return await DeleteService.softDeleteById(CrawlTask, crawlTaskId, { session });
          }
        ];

        // Execute transaction
        const results = await DeleteService.executeInTransaction(operations);

        // Verify both operations were successful
        expect(results).toHaveLength(2);
        expect(results[0]).not.toBeNull();
        expect(results[1]).not.toBeNull();

        // Verify both documents were soft deleted
        const content = await Content.findByIdWithDeleted(contentId);
        const crawlTask = await CrawlTask.findByIdWithDeleted(crawlTaskId);
        expect(content.deletedAt).not.toBeNull();
        expect(crawlTask.deletedAt).not.toBeNull();
      });
    });
  });
});