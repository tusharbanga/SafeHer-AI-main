const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

/**
 * Runs after express-validator check chains and converts any
 * validation failures into a single ApiError(400).
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  throw new ApiError(400, "Validation failed", formatted);
};

module.exports = validate;
