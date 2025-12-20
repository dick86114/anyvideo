const mongoose = require('mongoose');
const softDeletePlugin = require('../plugins/softDeletePlugin');

const crawlTaskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  platform: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  target_identifier: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  frequency: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20,
    enum: ['hourly', 'daily', 'weekly']
  },
  status: {
    type: Number,
    required: true,
    enum: [0, 1], // 0-禁用，1-启用
    default: 1
  },
  last_run_at: {
    type: Date,
    default: null
  },
  next_run_at: {
    type: Date,
    default: null
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Apply soft delete plugin
crawlTaskSchema.plugin(softDeletePlugin);

const CrawlTask = mongoose.model('CrawlTask', crawlTaskSchema);

module.exports = CrawlTask;