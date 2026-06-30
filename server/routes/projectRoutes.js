const express = require('express');
const router = express.Router();

const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  archiveProject,
  updateMembers,
} = require('../controllers/projectController');

const { protect, authorize } = require('../middleware/authMiddleware');

const {
  projectIdParamValidator,
  createProjectValidator,
  updateProjectValidator,
  updateMembersValidator,
} = require('../validators/projectValidators');

// Task routes that hang off /api/projects/:projectId/tasks
const taskRouter = require('./taskRoutes');

// All project routes require authentication
router.use(protect);

router.get('/', getProjects);
router.post('/', authorize('admin', 'manager'), createProjectValidator, createProject);

router.get('/:id', projectIdParamValidator, getProjectById);
router.put('/:id', authorize('admin', 'manager'), updateProjectValidator, updateProject);
router.delete('/:id', authorize('admin', 'manager'), projectIdParamValidator, deleteProject);

router.put('/:id/archive', authorize('admin', 'manager'), projectIdParamValidator, archiveProject);
router.put('/:id/members', authorize('admin', 'manager'), updateMembersValidator, updateMembers);

// Nested: GET/POST /api/projects/:projectId/tasks
router.use('/:projectId/tasks', taskRouter.nested);

module.exports = router;
