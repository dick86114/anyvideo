const { verifyToken } = require('../utils/jwt');
const UserService = require('../services/UserService');

// Authenticate user
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Support mock token for development
    if (token.startsWith('mock-token-')) {
      // Create mock user for development
      const mockUser = {
        id: 'mock-user-id',
        username: 'mock-admin',
        role: 'admin',
        is_active: true
      };
      
      // Attach mock user to request
      req.user = mockUser;
      return next();
    }
    
    // Verify real token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
    
    // Get user from database
    const user = await UserService.findUserById(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Unauthorized: User not found or inactive' });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Authorize user by role
const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};