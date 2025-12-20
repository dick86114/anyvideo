const mongoose = require('mongoose');
const softDeletePlugin = require('../plugins/softDeletePlugin');

// System settings schema
const systemSettingsSchema = new mongoose.Schema({
  storage_path: {
    type: String,
    default: '/data/media/',
    required: true
  },
  task_schedule_interval: {
    type: Number,
    default: 3600,
    required: true
  },
  hotsearch_fetch_interval: {
    type: Number,
    default: 3600,
    required: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Cookie schema for platform accounts
const cookieSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    trim: true
  },
  account_alias: {
    type: String,
    required: true,
    trim: true
  },
  cookies_encrypted: {
    type: String,
    required: true
  },
  is_valid: {
    type: Boolean,
    default: true
  },
  last_checked_at: {
    type: Date,
    default: Date.now
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Apply soft delete plugin to schemas
systemSettingsSchema.plugin(softDeletePlugin);
cookieSchema.plugin(softDeletePlugin);

// Create models
const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
const PlatformCookie = mongoose.model('PlatformCookie', cookieSchema);

module.exports = {
  SystemSettings,
  PlatformCookie
};
