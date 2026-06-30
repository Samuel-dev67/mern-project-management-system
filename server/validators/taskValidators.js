const { body, param, query, validationResult } = require('express-validator');
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
  param('projectId').isMongoId().withMessage('Invalid project id'),
  handleValidationErrors,
];

const taskIdParamValidator = [
  param('id').isMongoId().withMessage('Invalid task id'),
  handleValidationErrors,
];

const getTasksQueryValidator = [
  param('projectId').isMongoId().withMessage('Invalid project id'),
  query('status')
    .optional()
    .isIn(['todo', 'in-progress', 'completed'])
    .withMessage('Invalid status filter'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority filter'),
  query('sort')
    .optional()
    .isIn(['priority', '-priority', 'dueDate', '-dueDate'])
    .withMessage('Invalid sort field'),
  handleValidationErrors,
];

const createTaskValidator = [
  param('projectId').isMongoId().withMessage('Invalid project id'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('assignedTo')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Invalid assignedTo id'),
  body('dueDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('dueDate must be a valid date'),
  handleValidationErrors,
];

const updateTaskValidator = [
  param('id').isMongoId().withMessage('Invalid task id'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('assignedTo')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Invalid assignedTo id'),
  body('dueDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('dueDate must be a valid date'),
  handleValidationErrors,
];

const updateTaskStatusValidator = [
  param('id').isMongoId().withMessage('Invalid task id'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['todo', 'in-progress', 'completed'])
    .withMessage('Status must be todo, in-progress, or completed'),
  handleValidationErrors,
];

const addCommentValidator = [
  param('id').isMongoId().withMessage('Invalid task id'),
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters'),
  handleValidationErrors,
];

module.exports = {
  projectIdParamValidator,
  taskIdParamValidator,
  getTasksQueryValidator,
  createTaskValidator,
  updateTaskValidator,
  updateTaskStatusValidator,
  addCommentValidator,
};
