const asyncHandler = require('../middleware/asyncHandler');
const Project = require('../models/Project');
const Task = require('../models/Task');
const sendResponse = require('../utils/apiResponse');
const { buildProjectScopeFilter } = require('./projectController');

const USER_PREVIEW_FIELDS = 'name email avatar role';

/**
 * @desc    Aggregated dashboard statistics, scoped to what the
 *          logged-in user is allowed to see (same scoping rule as
 *          the project list endpoint: admins see everything,
 *          everyone else sees only projects they own or belong to).
 *          All counts are computed in the database, not by pulling
 *          full collections into memory and counting in JS.
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getStats = asyncHandler(async (req, res) => {
  const projectFilter = buildProjectScopeFilter(req.user);

  const projectIds = await Project.find(projectFilter).distinct('_id');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const taskScopeFilter = { project: { $in: projectIds } };

  const [
    totalProjects,
    completedProjects,
    pendingProjects,
    totalTasks,
    completedTasks,
    tasksDueToday,
    upcomingDeadlines,
    assignedTasks,
    recentProjects,
    recentTasks,
  ] = await Promise.all([
    Project.countDocuments(projectFilter),
    Project.countDocuments({ ...projectFilter, status: 'completed' }),
    Project.countDocuments({ ...projectFilter, status: 'active' }),
    Task.countDocuments(taskScopeFilter),
    Task.countDocuments({ ...taskScopeFilter, status: 'completed' }),
    Task.countDocuments({
      ...taskScopeFilter,
      status: { $ne: 'completed' },
      dueDate: { $gte: startOfToday, $lt: endOfToday },
    }),
    Task.find({
      ...taskScopeFilter,
      status: { $ne: 'completed' },
      dueDate: { $gte: now, $lte: sevenDaysFromNow },
    })
      .populate('project', 'title')
      .populate('assignedTo', USER_PREVIEW_FIELDS)
      .sort('dueDate')
      .limit(5),
    Task.find({
      assignedTo: req.user._id,
      status: { $ne: 'completed' },
    })
      .populate('project', 'title')
      .sort('dueDate')
      .limit(5),
    Project.find(projectFilter)
      .populate('createdBy', USER_PREVIEW_FIELDS)
      .sort('-updatedAt')
      .limit(5)
      .select('title status updatedAt createdBy'),
    Task.find(taskScopeFilter)
      .populate('project', 'title')
      .populate('assignedTo', USER_PREVIEW_FIELDS)
      .sort('-updatedAt')
      .limit(5)
      .select('title status priority updatedAt project assignedTo'),
  ]);

  // Merge recently-touched projects and tasks into a single
  // chronological activity feed, since the dashboard wants one
  // unified "recent activity" list rather than two separate ones.
  const recentActivity = [
    ...recentProjects.map((p) => ({
      type: 'project',
      id: p._id,
      title: p.title,
      status: p.status,
      updatedAt: p.updatedAt,
      actor: p.createdBy,
    })),
    ...recentTasks.map((t) => ({
      type: 'task',
      id: t._id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      updatedAt: t.updatedAt,
      project: t.project,
      assignedTo: t.assignedTo,
    })),
  ]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  sendResponse(res, 200, 'Dashboard statistics retrieved successfully', {
    stats: {
      totalProjects,
      completedProjects,
      pendingProjects,
      totalTasks,
      completedTasks,
      tasksDueToday,
    },
    recentActivity,
    upcomingDeadlines,
    assignedTasks,
  });
});

module.exports = { getStats };
