const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendResponse = require('../utils/apiResponse');

/**
 * @desc    Register a new user (always created as 'member' — admins
 *          and managers are provisioned separately, see createManager)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError('An account with this email already exists', 400);
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'member',
  });

  const token = generateToken(user._id);

  sendResponse(res, 201, 'Account created successfully', {
    user,
    token,
  });
});

/**
 * @desc    Authenticate a user and return a token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // password has select:false on the schema, so it must be explicitly requested
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ApiError('Invalid email or password', 401);
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    throw new ApiError('Invalid email or password', 401);
  }

  const token = generateToken(user._id);

  sendResponse(res, 200, 'Login successful', {
    user,
    token,
  });
});

/**
 * @desc    Get the currently authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user was attached by the `protect` middleware
  sendResponse(res, 200, 'User retrieved successfully', { user: req.user });
});

/**
 * @desc    Update name/avatar for the logged-in user
 * @route   PUT /api/auth/update-profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (avatar !== undefined) updates.avatar = avatar;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  sendResponse(res, 200, 'Profile updated successfully', { user });
});

/**
 * @desc    Change the logged-in user's password
 * @route   PUT /api/auth/update-password
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    throw new ApiError('Current password is incorrect', 401);
  }

  user.password = newPassword;
  await user.save(); // pre-save hook re-hashes the password

  const token = generateToken(user._id);

  sendResponse(res, 200, 'Password updated successfully', { token });
});

/**
 * @desc    Create a project manager account (admin only — this is how
 *          managers are provisioned, since public registration only
 *          ever creates 'member' accounts)
 * @route   POST /api/auth/create-manager
 * @access  Private/Admin
 */
const createManager = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError('An account with this email already exists', 400);
  }

  const manager = await User.create({
    name,
    email,
    password,
    role: 'manager',
  });

  sendResponse(res, 201, 'Manager account created successfully', {
    user: manager,
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  createManager,
};
