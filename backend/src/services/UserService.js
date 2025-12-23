const bcrypt = require('bcryptjs');
const { AppDataSource } = require('../utils/db');
const { IsNull } = require('typeorm');

class UserService {
  static async hashPassword(password) {
    const saltRounds = parseInt(process.env.PASSWORD_SALT_ROUNDS) || 10;
    return await bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async createUser(userData) {
    const userRepository = AppDataSource.getRepository('User');
    
    // Hash password before saving
    if (userData.password) {
      userData.password_hash = await this.hashPassword(userData.password);
      delete userData.password; // Remove plain password
    }

    const user = userRepository.create(userData);
    return await userRepository.save(user);
  }

  static async updateUserPassword(userId, newPassword) {
    const userRepository = AppDataSource.getRepository('User');
    
    const hashedPassword = await this.hashPassword(newPassword);
    
    await userRepository.update(userId, {
      password_hash: hashedPassword,
      updated_at: new Date()
    });
  }

  static async findUserByUsername(username) {
    const userRepository = AppDataSource.getRepository('User');
    return await userRepository.findOne({
      where: { 
        username, 
        deleted_at: IsNull() 
      }
    });
  }

  static async findUserById(id) {
    const userRepository = AppDataSource.getRepository('User');
    return await userRepository.findOne({
      where: { 
        id, 
        deleted_at: IsNull() 
      }
    });
  }

  static async getAllUsers() {
    const userRepository = AppDataSource.getRepository('User');
    return await userRepository.find({
      where: { deleted_at: IsNull() },
      order: { created_at: 'DESC' }
    });
  }

  static async countUsers(conditions = {}) {
    const userRepository = AppDataSource.getRepository('User');
    return await userRepository.count({
      where: { 
        deleted_at: IsNull(),
        ...conditions 
      }
    });
  }

  static async softDeleteUser(userId) {
    const userRepository = AppDataSource.getRepository('User');
    await userRepository.update(userId, {
      deleted_at: new Date(),
      is_active: false,
      updated_at: new Date()
    });
  }

  static async updateUser(userId, updateData) {
    const userRepository = AppDataSource.getRepository('User');
    
    // Add updated_at timestamp
    updateData.updated_at = new Date();
    
    await userRepository.update(userId, updateData);
    return await this.findUserById(userId);
  }
}

module.exports = UserService;