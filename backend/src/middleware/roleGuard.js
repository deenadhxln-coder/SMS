const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: User role not defined',
      });
    }

    const roleName = typeof req.user.role === 'object' && req.user.role ? req.user.role.name : req.user.role;

    if (!allowedRoles.includes(roleName)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your role is ${roleName}.`,
      });
    }

    next();
  };
};

module.exports = { authorize };
