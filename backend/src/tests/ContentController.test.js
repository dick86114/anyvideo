const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Content = require('../models/Content');
const ParseService = require('../services/ParseService');

// Mock the ParseService
jest.mock('../services/ParseService');

// Connect to MongoDB before all tests
beforeAll(async () => {
  // Use a test database for testing
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/video-all-test');
});

// Clear all test data after each test
afterEach(async () => {
  await Content.deleteMany({});
});

// Disconnect from MongoDB after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

// Test suite for ContentController
describe('ContentController', () => {
  // Test case: Parse content from link
  describe('POST /api/v1/content/parse', () => {
    it('should parse content from a valid link', async () => {
      // Mock parseLink method
      ParseService.parseLink.mockResolvedValue({
        title: 'Test Video',
        author: 'Test Author',
        platform: 'douyin',
        media_type: 'video',
        source_type: 1,
        source_url: 'https://example.com/test',
        file_path: 'test/video.mp4',
        cover_url: 'test/cover.jpg'
      });

      const response = await request(app)
        .post('/api/v1/content/parse')
        .send({ link: 'https://example.com/test' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('解析成功');
      expect(response.body.data.title).toBe('Test Video');
    });

    it('should return 400 if no link is provided', async () => {
      const response = await request(app)
        .post('/api/v1/content/parse')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('请提供作品链接');
    });
  });

  // Test case: Get content list with pagination and filters
  describe('GET /api/v1/content', () => {
    it('should return a list of content', async () => {
      // Create test content
      await Content.create([
        {
          title: 'Test Video 1',
          author: 'Test Author',
          platform: 'douyin',
          media_type: 'video',
          source_type: 1,
          source_url: 'https://example.com/test1',
          file_path: 'test/video1.mp4',
          cover_url: 'test/cover1.jpg'
        },
        {
          title: 'Test Video 2',
          author: 'Test Author',
          platform: 'xiaohongshu',
          media_type: 'video',
          source_type: 1,
          source_url: 'https://example.com/test2',
          file_path: 'test/video2.mp4',
          cover_url: 'test/cover2.jpg'
        }
      ]);

      const response = await request(app)
        .get('/api/v1/content')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('获取成功');
      expect(response.body.data.list).toHaveLength(2);
    });
  });
});
