const ApiError = require("../utils/ApiError");

/**
 * Converts known Mongoose / JWT errors into ApiError instances so
 * the response shape stays consistent across the whole API.
 */
const normalizeError = (err) => {
  if (err instanceof ApiError) return err;

  if (err.name === "CastError") {
    return new ApiError(400, `Invalid value for field '${err.path}': ${err.value}`);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return new ApiError(409, `Duplicate value for field '${field}'. Please use another value.`);
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return new ApiError(400, messages.join(". "), messages);
  }

  if (err.name === "JsonWebTokenError") {
    return new ApiError(401, "Invalid token. Please log in again.");
  }

  if (err.name === "TokenExpiredError") {
    return new ApiError(401, "Your session has expired. Please log in again.");
  }

  if (err.name === "MulterError") {
    return new ApiError(400, `File upload error: ${err.message}`);
  }

  return new ApiError(err.statusCode || 500, err.message || "Internal server error");
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const normalized = normalizeError(err);

  if (normalized.statusCode >= 500) {
    console.error("UNEXPECTED ERROR:", err);
  }

  res.status(normalized.statusCode).json({
    success: false,
    message: normalized.message,
    errors: normalized.errors || [],
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
};

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

module.exports = { errorHandler, notFound };
