const express = require('express');
const router = express.Router();

const { getUsers, updateUserRole } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getUsersQueryValidator, updateUserRoleValidator } = require('../validators/userValidators');

// All user routes require authentication
router.use(protect);

// Listing users is only needed by the roles that actually pick from
// it — admins/managers assembling project members or task assignees,
// and admins managing the manager roster. Regular members never need
// to enumerate the full user directory.
router.get('/', authorize('admin', 'manager'), getUsersQueryValidator, getUsers);

// Role changes are admin-only — this is what powers the "Manage
// Managers" screen's promote/demote controls (Sprint 6).
router.put('/:id/role', authorize('admin'), updateUserRoleValidator, updateUserRole);

module.exports = router;
