const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT for a given user id. Centralized here so
 * token expiry and payload shape are defined in exactly one place.
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

module.exports = generateToken;
