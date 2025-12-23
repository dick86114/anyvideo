const UserService = require('../services/UserService');
const { generateToken } = require('../utils/jwt');

class AuthController {
  // Login user
  static async login(req, res) {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: '用户名和密码不能为空' });
      }
      
      // Find user
      const user = await UserService.findUserByUsername(username);
      
      if (!user || !user.is_active) {
        return res.status(401).json({ message: '用户名或密码错误' });
      }
      
      // Check password
      const isMatch = await UserService.comparePassword(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: '用户名或密码错误' });
      }
      
      // Generate token
      const token = generateToken(user);
      
      // Remove password_hash from response
      const { password_hash, ...safeUser } = user;
      
      res.status(200).json({
        message: '登录成功',
        data: {
          user: safeUser,
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: '登录失败，请稍后重试' });
    }
  }
  
  // Logout user (optional - mainly for token blacklisting if implemented)
  static async logout(req, res) {
    try {
      // In a real implementation, you might want to blacklist the token
      // For now, we'll just return a success message
      res.status(200).json({ message: '退出登录成功' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: '退出登录失败' });
    }
  }

  // Check if system has any users (for initial setup)
  static async checkSystemStatus(req, res) {
    try {
      const userCount = await UserService.countUsers();
      
      res.status(200).json({
        message: '系统状态检查成功',
        data: {
          hasUsers: userCount > 0,
          userCount,
          needsInitialSetup: userCount === 0
        }
      });
    } catch (error) {
      console.error('Check system status error:', error);
      res.status(500).json({ message: '系统状态检查失败' });
    }
  }

  // Initial system setup (create first admin user)
  static async initialSetup(req, res) {
    try {
      const { username, password } = req.body;
      
      // Check if system already has users
      const userCount = await UserService.countUsers();
      if (userCount > 0) {
        return res.status(400).json({ message: '系统已初始化，无法重复设置' });
      }
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: '用户名和密码不能为空' });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ message: '密码长度不能少于6位' });
      }
      
      // Create first admin user
      const user = await UserService.createUser({
        username,
        password,
        role: 'admin',
        is_active: true
      });
      
      // Generate token
      const token = generateToken(user);
      
      // Remove password_hash from response
      const { password_hash, ...safeUser } = user;
      
      res.status(201).json({
        message: '系统初始化成功',
        data: {
          user: safeUser,
          token
        }
      });
    } catch (error) {
      console.error('Initial setup error:', error);
      res.status(500).json({ message: '系统初始化失败' });
    }
  }
}

module.exports = AuthController;