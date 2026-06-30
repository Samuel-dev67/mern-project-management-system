const express = require('express');

const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
} = require('../controllers/taskController');

const { protect } = require('../middleware/authMiddleware');

const {
  getTasksQueryValidator,
  createTaskValidator,
  taskIdParamValidator,
  updateTaskValidator,
  updateTaskStatusValidator,
  addCommentValidator,
} = require('../validators/taskValidators');

/**
 * Nested router: mounted by projectRoutes.js at
 * /api/projects/:projectId/tasks. mergeParams is required so that
 * :projectId (captured by the parent router) is visible to this
 * router's handlers via req.params.projectId.
 */
const nested = express.Router({ mergeParams: true });
nested.use(protect);
nested.get('/', getTasksQueryValidator, getTasks);
nested.post('/', createTaskValidator, createTask);

/**
 * Flat router: mounted at /api/tasks for operations on a single
 * task by id, which don't need the project id in the URL since
 * the task document already references its project.
 */
const flat = express.Router();
flat.use(protect);
flat.get('/:id', taskIdParamValidator, getTaskById);
flat.put('/:id', updateTaskValidator, updateTask);
flat.delete('/:id', taskIdParamValidator, deleteTask);
flat.put('/:id/status', updateTaskStatusValidator, updateTaskStatus);
flat.post('/:id/comments', addCommentValidator, addComment);

module.exports = flat;
module.exports.nested = nested;
