const mongoose = require('mongoose');
const softDeletePlugin = require('../plugins/softDeletePlugin');

const contentSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  content_id: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  media_type: {
    type: String,
    required: true,
    enum: ['video', 'image']
  },
  file_path: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  cover_url: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  source_url: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  source_type: {
    type: Number,
    required: true,
    enum: [1, 2], // 1-单链接解析，2-监控任务
    default: 1
  },
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CrawlTask',
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Add unique index to prevent duplicate content
contentSchema.index({ platform: 1, content_id: 1 }, { unique: true });

// Apply soft delete plugin
contentSchema.plugin(softDeletePlugin);

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;