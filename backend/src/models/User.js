const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const softDeletePlugin = require('../plugins/softDeletePlugin');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  password_hash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'operator'],
    default: 'operator'
  },
  is_active: {
    type: Boolean,
    required: true,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.PASSWORD_SALT_ROUNDS));
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// Apply soft delete plugin
userSchema.plugin(softDeletePlugin);

const User = mongoose.model('User', userSchema);

module.exports = User;