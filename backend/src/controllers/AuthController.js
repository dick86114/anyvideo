const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

class AuthController {
  // Register new user (admin only)
  static async register(req, res) {
    try {
      const { username, password, role = 'operator' } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Create new user
      const user = new User({
        username,
        password_hash: password, // Will be hashed in pre-save hook
        role,
        is_active: true
      });
      
      await user.save();
      
      // Generate token
      const token = generateToken(user);
      
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          is_active: user.is_active
        },
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // Login user
  static async login(req, res) {
    try {
      const { username, password } = req.body;
      
      // Find user
      const user = await User.findOne({ username, is_active: true });
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Generate token
      const token = generateToken(user);
      
      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          is_active: user.is_active
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // Get current user info
  static async getCurrentUser(req, res) {
    try {
      res.status(200).json({
        user: req.user
      });
    } catch (error) {
      console.error('Get user info error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // Update user password
  static async updatePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Find user
      const user = await User.findById(req.user._id);
      
      // Check current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Update password
      user.password_hash = newPassword; // Will be hashed in pre-save hook
      await user.save();
      
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = AuthController;