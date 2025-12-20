const mongoose = require('mongoose');
const softDeletePlugin = require('../plugins/softDeletePlugin');

const platformAccountSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  account_alias: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  cookies_encrypted: {
    type: String,
    required: true,
    trim: true
  },
  is_valid: {
    type: Boolean,
    required: true,
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

// Apply soft delete plugin
platformAccountSchema.plugin(softDeletePlugin);

const PlatformAccount = mongoose.model('PlatformAccount', platformAccountSchema);

module.exports = PlatformAccount;