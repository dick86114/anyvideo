const UserService = require('../services/UserService');
const { generateToken } = require('../utils/jwt');

class UserController {
  // Get all users (admin only)
  static async getAllUsers(req, res) {
    try {
      const users = await UserService.getAllUsers();
      
      // Remove password_hash from response
      const safeUsers = users.map(user => {
        const { password_hash, ...safeUser } = user;
        return safeUser;
      });
      
      res.status(200).json({
        message: '获取用户列表成功',
        data: safeUsers
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: '获取用户列表失败' });
    }
  }

  // Get user by ID (admin only)
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      const user = await UserService.findUserById(id);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }
      
      // Remove password_hash from response
      const { password_hash, ...safeUser } = user;
      
      res.status(200).json({
        message: '获取用户信息成功',
        data: safeUser
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({ message: '获取用户信息失败' });
    }
  }

  // Create new user (admin only)
  static async createUser(req, res) {
    try {
      const { username, password, role = 'operator' } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: '用户名和密码不能为空' });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ message: '密码长度不能少于6位' });
      }
      
      // Check if username already exists
      const existingUser = await UserService.findUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: '用户名已存在' });
      }
      
      // Create new user
      const user = await UserService.createUser({
        username,
        password,
        role,
        is_active: true
      });
      
      // Return user without password
      const { password_hash, ...userResponse } = user;
      
      res.status(201).json({
        message: '用户创建成功',
        data: userResponse
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ message: '创建用户失败' });
    }
  }

  // Update user (admin only)
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, role, is_active } = req.body;
      
      // Find user
      const user = await UserService.findUserById(id);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }
      
      // Check if username is being changed and if it already exists
      if (username && username !== user.username) {
        const existingUser = await UserService.findUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ message: '用户名已存在' });
        }
      }
      
      // Prepare update data
      const updateData = {};
      if (username !== undefined) updateData.username = username;
      if (role !== undefined) updateData.role = role;
      if (is_active !== undefined) updateData.is_active = is_active;
      
      // Update user
      const updatedUser = await UserService.updateUser(id, updateData);
      
      // Return updated user without password
      const { password_hash, ...userResponse } = updatedUser;
      
      res.status(200).json({
        message: '用户更新成功',
        data: userResponse
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: '更新用户失败' });
    }
  }

  // Update user password (admin or self)
  static async updateUserPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword, currentPassword } = req.body;
      
      // Validate new password
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: '新密码长度不能少于6位' });
      }
      
      // Find user
      const user = await UserService.findUserById(id);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }
      
      // Check permissions: admin can change any password, user can only change their own
      if (req.user.role !== 'admin' && req.user.id.toString() !== id) {
        return res.status(403).json({ message: '权限不足' });
      }
      
      // If user is changing their own password, verify current password
      if (req.user.id.toString() === id && currentPassword) {
        const isMatch = await UserService.comparePassword(currentPassword, user.password_hash);
        if (!isMatch) {
          return res.status(400).json({ message: '当前密码错误' });
        }
      }
      
      // Update password
      await UserService.updateUserPassword(id, newPassword);
      
      res.status(200).json({ message: '密码更新成功' });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({ message: '更新密码失败' });
    }
  }

  // Delete user (admin only)
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      // Find user
      const user = await UserService.findUserById(id);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }
      
      // Check if this is the last admin user
      const adminCount = await UserService.countUsers({ role: 'admin', is_active: true });
      if (user.role === 'admin' && adminCount <= 1) {
        return res.status(400).json({ message: '不能删除最后一个管理员账户' });
      }
      
      // Check if there's only one user left
      const totalUsers = await UserService.countUsers();
      if (totalUsers <= 1) {
        return res.status(400).json({ message: '不能删除最后一个用户账户' });
      }
      
      // Prevent user from deleting themselves
      if (req.user.id.toString() === id) {
        return res.status(400).json({ message: '不能删除自己的账户' });
      }
      
      // Soft delete user
      await UserService.softDeleteUser(id);
      
      res.status(200).json({ message: '用户删除成功' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: '删除用户失败' });
    }
  }

  // Get current user profile
  static async getCurrentUser(req, res) {
    try {
      const user = await UserService.findUserById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }
      
      // Remove password_hash from response
      const { password_hash, ...safeUser } = user;
      
      res.status(200).json({
        message: '获取用户信息成功',
        data: safeUser
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ message: '获取用户信息失败' });
    }
  }

  // Update current user profile
  static async updateCurrentUser(req, res) {
    try {
      const { username } = req.body;
      
      const user = await UserService.findUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }
      
      // Check if username is being changed and if it already exists
      if (username && username !== user.username) {
        const existingUser = await UserService.findUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ message: '用户名已存在' });
        }
      }
      
      // Update user
      const updateData = {};
      if (username !== undefined) updateData.username = username;
      
      const updatedUser = await UserService.updateUser(req.user.id, updateData);
      
      // Return updated user without password
      const { password_hash, ...userResponse } = updatedUser;
      
      res.status(200).json({
        message: '个人信息更新成功',
        data: userResponse
      });
    } catch (error) {
      console.error('Update current user error:', error);
      res.status(500).json({ message: '更新个人信息失败' });
    }
  }

  // Change current user password
  static async changeCurrentUserPassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: '当前密码和新密码不能为空' });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: '新密码长度不能少于6位' });
      }
      
      // Find user
      const user = await UserService.findUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }
      
      // Check current password
      const isMatch = await UserService.comparePassword(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ message: '当前密码错误' });
      }
      
      // Update password
      await UserService.updateUserPassword(req.user.id, newPassword);
      
      res.status(200).json({ message: '密码修改成功' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: '修改密码失败' });
    }
  }
}

module.exports = UserController;