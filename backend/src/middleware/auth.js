const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User, Role } = require('../models');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decode token
      const decoded = jwt.verify(token, config.jwtSecret);

      // Fetch user from DB and attach user details and role
      let user;
      if (decoded.role === 'Super Admin') {
        const { PlatformAdmin } = require('../models');
        user = await PlatformAdmin.findByPk(decoded.id);
        if (user) {
          // Set role compatibility object
          user.role = { name: 'Super Admin' };
        }
      }

      if (!user) {
        user = await User.findByPk(decoded.id, {
          include: [{ model: Role, as: 'role' }],
        });
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'User no longer exists' });
      }

      if (user.status === 'INACTIVE') {
        return res.status(401).json({ success: false, message: 'User account is deactivated' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('JWT authentication error:', error.stack || error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
