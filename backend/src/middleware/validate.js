const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Reusable zero-dependency parameter validator for route UUIDs.
 * Validates request route parameters before invoking controller logic.
 */
const validateParamsUUID = (...paramNames) => {
  return (req, res, next) => {
    for (const param of paramNames) {
      const val = req.params[param];
      if (val && !UUID_REGEX.test(val)) {
        return res.status(400).json({
          success: false,
          message: `Invalid identifier format for parameter '${param}'. Expected UUID.`
        });
      }
    }
    next();
  };
};

module.exports = {
  validateParamsUUID,
  UUID_REGEX,
};
