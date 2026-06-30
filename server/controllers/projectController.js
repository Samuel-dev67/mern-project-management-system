const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const sendResponse = require('../utils/apiResponse');
const { hasProjectAccess, isProjectOwnerOrAdmin } = require('../utils/accessControl');

const USER_PREVIEW_FIELDS = 'name email avatar role';

/**
 * Builds the Mongo filter that scopes which projects a user is
 * allowed to see. Admins see everything; everyone else sees only
 * projects they created or were added to as a member.
 */
const buildProjectScopeFilter = (user) => {
  if (user.role === 'admin') return {};
  return {
    $or: [{ createdBy: user._id }, { members: user._id }],
  };
};

/**
 * @desc    List projects visible to the logged-in user, optionally
 *          filtered by status
 * @route   GET /api/projects?status=active
 * @access  Private
 */
const getProjects = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = buildProjectScopeFilter(req.user);

  if (status) {
    if (!['active', 'completed', 'archived'].includes(status)) {
      throw new ApiError('Invalid status filter', 400);
    }
    filter.status = status;
  }

  const projects = await Project.find(filter)
    .populate('createdBy', USER_PREVIEW_FIELDS)
    .populate('members', USER_PREVIEW_FIELDS)
    .sort('-createdAt');

  sendResponse(res, 200, 'Projects retrieved successfully', { projects });
});

/**
 * @desc    Get a single project by id
 * @route   GET /api/projects/:id
 * @access  Private (must have access to the project)
 */
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('createdBy', USER_PREVIEW_FIELDS)
    .populate('members', USER_PREVIEW_FIELDS);

  if (!project) {
    throw new ApiError('Project not found', 404);
  }

  if (!hasProjectAccess(project, req.user)) {
    throw new ApiError('You do not have access to this project', 403);
  }

  sendResponse(res, 200, 'Project retrieved successfully', { project });
});

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private/Manager,Admin
 */
const createProject = asyncHandler(async (req, res) => {
  const { title, description, members = [] } = req.body;

  // Validate that every proposed member id actually corresponds to
  // an existing user, rather than silently storing dangling references.
  if (members.length > 0) {
    const foundUsers = await User.find({ _id: { $in: members } }).select('_id');
    if (foundUsers.length !== new Set(members).size) {
      throw new ApiError('One or more member ids do not correspond to a real user', 400);
    }
  }

  const project = await Project.create({
    title,
    description,
    createdBy: req.user._id,
    members,
  });

  const populated = await project.populate([
    { path: 'createdBy', select: USER_PREVIEW_FIELDS },
    { path: 'members', select: USER_PREVIEW_FIELDS },
  ]);

  sendResponse(res, 201, 'Project created successfully', { project: populated });
});

/**
 * @desc    Update a project's title, description, or status
 * @route   PUT /api/projects/:id
 * @access  Private (owner or admin only)
 */
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError('Project not found', 404);
  }

  if (!isProjectOwnerOrAdmin(project, req.user)) {
    throw new ApiError('Only the project owner or an admin can update this project', 403);
  }

  const { title, description, status } = req.body;

  if (title !== undefined) project.title = title;
  if (description !== undefined) project.description = description;
  if (status !== undefined) project.status = status;

  await project.save();

  const populated = await project.populate([
    { path: 'createdBy', select: USER_PREVIEW_FIELDS },
    { path: 'members', select: USER_PREVIEW_FIELDS },
  ]);

  sendResponse(res, 200, 'Project updated successfully', { project: populated });
});

/**
 * @desc    Delete a project and cascade-delete its tasks
 * @route   DELETE /api/projects/:id
 * @access  Private (owner or admin only)
 */
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError('Project not found', 404);
  }

  if (!isProjectOwnerOrAdmin(project, req.user)) {
    throw new ApiError('Only the project owner or an admin can delete this project', 403);
  }

  // Cascade delete: a task pointing at a deleted project is a dangling
  // reference that will surface as confusing bugs later (e.g. a task
  // board endpoint that 404s on its own "valid" task). Clean it up now.
  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  sendResponse(res, 200, 'Project and all associated tasks deleted successfully');
});

/**
 * @desc    Archive (or unarchive) a project — convenience endpoint
 *          on top of the generic update, since archiving is a
 *          frequent single-purpose action from the UI
 * @route   PUT /api/projects/:id/archive
 * @access  Private (owner or admin only)
 */
const archiveProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError('Project not found', 404);
  }

  if (!isProjectOwnerOrAdmin(project, req.user)) {
    throw new ApiError('Only the project owner or an admin can archive this project', 403);
  }

  project.status = project.status === 'archived' ? 'active' : 'archived';
  await project.save();

  sendResponse(res, 200, `Project ${project.status === 'archived' ? 'archived' : 'unarchived'} successfully`, {
    project,
  });
});

/**
 * @desc    Add or remove a member from a project
 * @route   PUT /api/projects/:id/members
 * @access  Private (owner or admin only)
 */
const updateMembers = asyncHandler(async (req, res) => {
  const { action, memberId } = req.body;

  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError('Project not found', 404);
  }

  if (!isProjectOwnerOrAdmin(project, req.user)) {
    throw new ApiError('Only the project owner or an admin can manage members', 403);
  }

  const userExists = await User.exists({ _id: memberId });
  if (!userExists) {
    throw new ApiError('No user found with that id', 404);
  }

  const alreadyMember = project.members.some((id) => id.toString() === memberId);

  if (action === 'add') {
    if (alreadyMember) {
      throw new ApiError('User is already a member of this project', 400);
    }
    project.members.push(memberId);
  } else {
    if (!alreadyMember) {
      throw new ApiError('User is not a member of this project', 400);
    }
    project.members = project.members.filter((id) => id.toString() !== memberId);
  }

  await project.save();

  const populated = await project.populate('members', USER_PREVIEW_FIELDS);

  sendResponse(res, 200, `Member ${action === 'add' ? 'added' : 'removed'} successfully`, {
    members: populated.members,
  });
});

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  archiveProject,
  updateMembers,
  buildProjectScopeFilter,
};
