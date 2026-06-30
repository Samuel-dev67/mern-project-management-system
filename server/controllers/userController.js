const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const sendResponse = require('../utils/apiResponse');
const { ApiError } = require('../middleware/errorMiddleware');

// Same field set already used as the populate projection everywhere
// else a user is embedded in a response (projectController,
// taskController, dashboardController) — kept identical here so the
// shape of a "user" is consistent no matter which endpoint returns it.
const USER_PREVIEW_FIELDS = 'name email avatar role';

/**
 * @desc    List users in lightweight form. Powers member pickers on
 *          project creation/editing, assignee pickers on task
 *          creation/editing, and the admin "manage managers" screen
 *          (via ?role=manager). The password field is never at risk
 *          here since the User schema already marks it `select: false`
 *          by default — the explicit .select() below is an extra,
 *          intentional layer on top of that, not a substitute for it.
 * @route   GET /api/users?role=manager
 * @access  Private/Admin,Manager
 */
const getUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;

  const filter = {};
  if (role) {
    filter.role = role;
  }

  const users = await User.find(filter).select(USER_PREVIEW_FIELDS).sort('name');

  sendResponse(res, 200, 'Users retrieved successfully', { users });
});

/**
 * @desc    Change another user's role. Powers the admin "Manage
 *          Managers" screen (Sprint 6) — promote member -> manager,
 *          manager -> admin, or demote the other direction.
 *          Two safety rules, both enforced server-side so they can't
 *          be bypassed by calling the API directly:
 *            1. An admin cannot change their own role through this
 *               endpoint (prevents accidental self-lockout).
 *            2. The last remaining admin cannot be demoted (the
 *               system must always have at least one admin account).
 * @route   PUT /api/users/:id/role
 * @access  Private/Admin
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (req.user._id.toString() === id) {
    throw new ApiError('You cannot change your own role', 400);
  }

  const targetUser = await User.findById(id);

  if (!targetUser) {
    throw new ApiError('User not found', 404);
  }

  if (targetUser.role === 'admin' && role !== 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      throw new ApiError('Cannot change the role of the last remaining admin', 400);
    }
  }

  targetUser.role = role;
  await targetUser.save();

  sendResponse(res, 200, 'User role updated successfully', { user: targetUser });
});

module.exports = { getUsers, updateUserRole };
