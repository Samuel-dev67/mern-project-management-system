/**
 * Custom error class that lets controllers throw errors with a
 * specific HTTP status code attached, instead of always defaulting to 500.
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handles requests to routes that don't exist. Placed after all
 * defined routes, before the error handler.
 */
const notFound = (req, res, next) => {
  const error = new ApiError(`Route not found - ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Centralized error handler. Every error in the app — thrown manually,
 * from Mongoose, from JWT verification, or from asyncHandler-wrapped
 * controllers — ends up here, and the response shape is always consistent.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors;

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with id of ${err.value}`;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for ${field}. Please use another value.`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors).map((val) => val.message);
    message = 'Validation failed';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { ApiError, notFound, errorHandler };
