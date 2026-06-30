const { body, param, validationResult } = require('express-validator');
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

const projectIdParamValidator = [
  param('id').isMongoId().withMessage('Invalid project id'),
  handleValidationErrors,
];

const createProjectValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('members')
    .optional()
    .isArray()
    .withMessage('Members must be an array of user ids'),
  body('members.*').optional().isMongoId().withMessage('Invalid member id'),
  handleValidationErrors,
];

const updateProjectValidator = [
  param('id').isMongoId().withMessage('Invalid project id'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'archived'])
    .withMessage('Status must be active, completed, or archived'),
  handleValidationErrors,
];

const updateMembersValidator = [
  param('id').isMongoId().withMessage('Invalid project id'),
  body('action')
    .notEmpty()
    .withMessage('Action is required')
    .isIn(['add', 'remove'])
    .withMessage("Action must be 'add' or 'remove'"),
  body('memberId')
    .notEmpty()
    .withMessage('memberId is required')
    .isMongoId()
    .withMessage('Invalid member id'),
  handleValidationErrors,
];

module.exports = {
  projectIdParamValidator,
  createProjectValidator,
  updateProjectValidator,
  updateMembersValidator,
};
