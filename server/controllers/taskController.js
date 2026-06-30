const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const Project = require('../models/Project');
const Task = require('../models/Task');
const sendResponse = require('../utils/apiResponse');
const {
  hasProjectAccess,
  isProjectOwnerOrAdmin,
  canUpdateTaskStatus,
} = require('../utils/accessControl');

const USER_PREVIEW_FIELDS = 'name email avatar role';

/**
 * Loads a project and throws consistent errors if it doesn't exist
 * or the requesting user has no access to it. Used at the top of
 * nearly every task controller since every task action is gated
 * through project membership.
 */
const loadProjectOrFail = async (projectId, user, { requireOwner = false } = {}) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError('Project not found', 404);
  }

  if (!hasProjectAccess(project, user)) {
    throw new ApiError('You do not have access to this project', 403);
  }

  if (requireOwner && !isProjectOwnerOrAdmin(project, user)) {
    throw new ApiError('Only the project owner or an admin can perform this action', 403);
  }

  return project;
};

/**
 * @desc    List tasks for a project, with optional filtering/sorting
 * @route   GET /api/projects/:projectId/tasks?status=&priority=&search=&sort=
 * @access  Private (must have access to the project)
 */
const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { status, priority, search, sort } = req.query;

  await loadProjectOrFail(projectId, req.user);

  const filter = { project: projectId };

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) {
    // Case-insensitive partial match on title — fine at this scale;
    // a text index would be the next step if search volume grew.
    filter.title = { $regex: search, $options: 'i' };
  }

  let sortField = '-createdAt';
  if (sort === 'priority') {
    // Mongo sorts strings alphabetically, which doesn't match the
    // logical low < medium < high ordering, so priority sorting is
    // done in application code after fetching.
    sortField = null;
  } else if (sort === 'dueDate' || sort === '-dueDate') {
    sortField = sort;
  }

  let query = Task.find(filter)
    .populate('assignedTo', USER_PREVIEW_FIELDS)
    .populate('createdBy', USER_PREVIEW_FIELDS);

  if (sortField) {
    query = query.sort(sortField);
  }

  let tasks = await query;

  if (sort === 'priority' || sort === '-priority') {
    const order = { low: 0, medium: 1, high: 2 };
    tasks = tasks.sort((a, b) => {
      const diff = order[a.priority] - order[b.priority];
      return sort === '-priority' ? -diff : diff;
    });
  }

  sendResponse(res, 200, 'Tasks retrieved successfully', { tasks });
});

/**
 * @desc    Get a single task by id
 * @route   GET /api/tasks/:id
 * @access  Private (must have access to the task's project)
 */
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('project', 'title status')
    .populate('assignedTo', USER_PREVIEW_FIELDS)
    .populate('createdBy', USER_PREVIEW_FIELDS)
    .populate('comments.user', USER_PREVIEW_FIELDS);

  if (!task) {
    throw new ApiError('Task not found', 404);
  }

  const project = await Project.findById(task.project._id);

  if (!hasProjectAccess(project, req.user)) {
    throw new ApiError('You do not have access to this task', 403);
  }

  sendResponse(res, 200, 'Task retrieved successfully', { task });
});

/**
 * @desc    Create a new task within a project
 * @route   POST /api/projects/:projectId/tasks
 * @access  Private (project owner or admin only)
 */
const createTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { title, description, priority, assignedTo, dueDate } = req.body;

  const project = await loadProjectOrFail(projectId, req.user, { requireOwner: true });

  // If an assignee is provided, they must actually be on the project —
  // assigning work to someone outside the project is a data integrity bug.
  if (assignedTo) {
    const isMember =
      project.createdBy.toString() === assignedTo ||
      project.members.some((id) => id.toString() === assignedTo);

    if (!isMember) {
      throw new ApiError('Cannot assign a task to a user who is not a member of this project', 400);
    }
  }

  const task = await Task.create({
    title,
    description,
    priority,
    assignedTo: assignedTo || null,
    dueDate: dueDate || null,
    project: projectId,
    createdBy: req.user._id,
  });

  const populated = await task.populate([
    { path: 'assignedTo', select: USER_PREVIEW_FIELDS },
    { path: 'createdBy', select: USER_PREVIEW_FIELDS },
  ]);

  sendResponse(res, 201, 'Task created successfully', { task: populated });
});

/**
 * @desc    Update a task's editable fields
 * @route   PUT /api/tasks/:id
 * @access  Private (project owner or admin only)
 */
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    throw new ApiError('Task not found', 404);
  }

  const project = await loadProjectOrFail(task.project, req.user, { requireOwner: true });

  const { title, description, priority, assignedTo, dueDate, status } = req.body;

  if (assignedTo !== undefined && assignedTo !== null) {
    const isMember =
      project.createdBy.toString() === assignedTo ||
      project.members.some((id) => id.toString() === assignedTo);

    if (!isMember) {
      throw new ApiError('Cannot assign a task to a user who is not a member of this project', 400);
    }
  }

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority !== undefined) task.priority = priority;
  if (assignedTo !== undefined) task.assignedTo = assignedTo;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (status !== undefined) task.status = status;

  await task.save();

  const populated = await task.populate([
    { path: 'assignedTo', select: USER_PREVIEW_FIELDS },
    { path: 'createdBy', select: USER_PREVIEW_FIELDS },
  ]);

  sendResponse(res, 200, 'Task updated successfully', { task: populated });
});

/**
 * @desc    Lightweight status-only update, used by the drag-and-drop
 *          board. Allowed for the project owner, an admin, OR the
 *          user the task is assigned to — team members need to be
 *          able to move their own cards without full edit rights.
 * @route   PUT /api/tasks/:id/status
 * @access  Private
 */
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const task = await Task.findById(req.params.id);

  if (!task) {
    throw new ApiError('Task not found', 404);
  }

  const project = await Project.findById(task.project);

  if (!project) {
    throw new ApiError('Associated project not found', 404);
  }

  if (!canUpdateTaskStatus(project, task, req.user)) {
    throw new ApiError('You are not permitted to move this task', 403);
  }

  task.status = status;
  await task.save();

  sendResponse(res, 200, 'Task status updated successfully', { task });
});

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private (project owner or admin only)
 */
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    throw new ApiError('Task not found', 404);
  }

  await loadProjectOrFail(task.project, req.user, { requireOwner: true });

  await task.deleteOne();

  sendResponse(res, 200, 'Task deleted successfully');
});

/**
 * @desc    Add a comment to a task
 * @route   POST /api/tasks/:id/comments
 * @access  Private (anyone with access to the task's project)
 */
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;

  const task = await Task.findById(req.params.id);

  if (!task) {
    throw new ApiError('Task not found', 404);
  }

  await loadProjectOrFail(task.project, req.user);

  task.comments.push({ user: req.user._id, text });
  await task.save();

  const populated = await task.populate('comments.user', USER_PREVIEW_FIELDS);

  sendResponse(res, 201, 'Comment added successfully', {
    comments: populated.comments,
  });
});

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
};
