const mongoose = require('mongoose');
const softDeletePlugin = require('../plugins/softDeletePlugin');

const hotsearchSnapshotSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  capture_date: {
    type: Date,
    required: true
  },
  capture_time: {
    type: Date,
    required: true,
    default: Date.now
  },
  snapshot_data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Create unique index
hotsearchSnapshotSchema.index({ platform: 1, capture_date: 1 }, { unique: true });

// Apply soft delete plugin
hotsearchSnapshotSchema.plugin(softDeletePlugin);

const HotsearchSnapshot = mongoose.model('HotsearchSnapshot', hotsearchSnapshotSchema);

module.exports = HotsearchSnapshot;