const { query, param, body, validationResult } = require('express-validator');
const { ApiError } = require('../middleware/errorMiddleware');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => err.msg);
    const error = new ApiError('Validation failed', 400);
    error.errors = messages;
    return next(error);
  }

  next();
};

const getUsersQueryValidator = [
  query('role')
    .optional()
    .isIn(['admin', 'manager', 'member'])
    .withMessage('Invalid role filter'),
  handleValidationErrors,
];

const updateUserRoleValidator = [
  param('id').isMongoId().withMessage('Invalid user id'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['admin', 'manager', 'member'])
    .withMessage('Role must be one of: admin, manager, member'),
  handleValidationErrors,
];

module.exports = { getUsersQueryValidator, updateUserRoleValidator };
