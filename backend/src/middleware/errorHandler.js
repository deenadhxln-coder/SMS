const errorHandler = (err, req, res, next) => {
  console.error('API Error:', {
    message: err.message,
    stack: ['development', 'test'].includes(process.env.NODE_ENV) ? err.stack : undefined,
  });

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || null,
  });
};

module.exports = errorHandler;
