const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware to verify JWT token and attach user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Alternatively check for token in cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token found, return unauthorized error
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        errors: ['No authentication token found']
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID
    const user = await User.findById(decoded.id);

    // If user not found, return unauthorized error
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        errors: ['The user associated with this token no longer exists']
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      errors: [error.message]
    });
  }
};

module.exports = authMiddleware;