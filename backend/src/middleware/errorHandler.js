const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Log error with safe contextual diagnostics
  if (!isProduction || (err.statusCode && err.statusCode >= 500) || !err.statusCode) {
    console.error('API Error:', {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode,
      stack: !isProduction ? err.stack : undefined,
    });
  }

  // 2. Body-Parser / Express Malformed JSON SyntaxError (HTTP 400)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload format in request body.',
      errors: null,
    });
  }

  // 3. Sequelize Validation Error (HTTP 400)
  if (err.name === 'SequelizeValidationError') {
    const formattedErrors = err.errors ? err.errors.map(e => ({
      field: e.path,
      message: e.message,
    })) : null;

    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: formattedErrors,
    });
  }

  // 4. Sequelize Unique Constraint Error (HTTP 409)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const formattedErrors = err.errors ? err.errors.map(e => ({
      field: e.path,
      message: e.message,
    })) : null;

    return res.status(409).json({
      success: false,
      message: 'A record with this unique identifier or field already exists.',
      errors: formattedErrors,
    });
  }

  // 5. Sequelize Foreign Key Constraint Error (HTTP 400)
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Referenced foreign key entity does not exist or violates relationship constraints.',
      errors: null,
    });
  }

  // 6. JWT Authentication Errors (HTTP 401)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
      errors: null,
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication token has expired.',
      errors: null,
    });
  }

  // 7. General / Unhandled Errors
  const statusCode = err.statusCode && Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : 500;

  // In production, sanitize 500 internal server error messages to prevent leakage of SQL/internal details
  const responseMessage = (statusCode === 500 && isProduction)
    ? 'Internal Server Error'
    : (err.message || 'Internal Server Error');

  return res.status(statusCode).json({
    success: false,
    message: responseMessage,
    errors: err.errors || null,
  });
};

module.exports = errorHandler;

