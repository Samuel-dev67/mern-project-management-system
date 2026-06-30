const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  createManager,
} = require('../controllers/authController');

const { protect, authorize } = require('../middleware/authMiddleware');

const {
  registerValidator,
  loginValidator,
  updatePasswordValidator,
  updateProfileValidator,
  createManagerValidator,
} = require('../validators/authValidators');

// Public routes
router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);

// Protected routes (any authenticated user)
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfileValidator, updateProfile);
router.put(
  '/update-password',
  protect,
  updatePasswordValidator,
  updatePassword
);

// Admin-only route
router.post(
  '/create-manager',
  protect,
  authorize('admin'),
  createManagerValidator,
  createManager
);

module.exports = router;
