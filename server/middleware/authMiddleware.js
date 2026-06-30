const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const { ApiError } = require('./errorMiddleware');
const User = require('../models/User');

/**
 * Verifies the JWT sent in the Authorization header (Bearer scheme),
 * loads the corresponding user, and attaches it to req.user so
 * downstream controllers/middleware can use it. This is the single
 * gatekeeper for every protected route in the app.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError('Not authorized, no token provided', 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError('Not authorized, user no longer exists', 401);
  }

  req.user = user;
  next();
});

/**
 * Role gate. Usage: authorize('admin', 'manager') — must be used
 * AFTER protect, since it relies on req.user being populated.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError('Not authorized, no user on request', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        `Role '${req.user.role}' is not permitted to perform this action`,
        403
      );
    }

    next();
  };
};

module.exports = { protect, authorize };
