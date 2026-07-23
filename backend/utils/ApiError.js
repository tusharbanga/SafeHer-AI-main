/**
 * Standardized application error used across controllers.
 * Any error thrown with this class is treated as an "operational" error
 * by the global error handler and returned to the client with the given status code.
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
