const mongoose = require('mongoose');
const softDeletePlugin = require('../plugins/softDeletePlugin');

const taskLogSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CrawlTask'
  },
  task_name: {
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
  start_time: {
    type: Date,
    required: true,
    default: Date.now
  },
  end_time: {
    type: Date
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'failed', 'running'],
    default: 'running'
  },
  type: {
    type: String,
    enum: ['author', 'hotsearch', 'backup'],
    default: 'author'
  },
  result: {
    type: mongoose.Schema.Types.Mixed
  },
  error: {
    type: String,
    trim: true
  },
  crawled_count: {
    type: Number,
    default: 0
  },
  new_count: {
    type: Number,
    default: 0
  },
  updated_count: {
    type: Number,
    default: 0
  },
  execution_time: {
    type: Number, // in milliseconds
    default: 0
  }
});

// Index for faster querying by task_id and time
// taskLogSchema.index({ task_id: 1, start_time: -1 });
// taskLogSchema.index({ start_time: -1 });

// Apply soft delete plugin
taskLogSchema.plugin(softDeletePlugin);

const TaskLog = mongoose.model('TaskLog', taskLogSchema);

module.exports = TaskLog;
