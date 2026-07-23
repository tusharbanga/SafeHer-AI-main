/**
 * Wraps an async controller/middleware function so any rejected promise
 * is forwarded to Express's error-handling middleware instead of crashing the process.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
