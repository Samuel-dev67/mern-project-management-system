import api from './api';

// Each function maps 1:1 to a route defined in server/routes/authRoutes.js.
// Components and context never call axios directly — only these functions.

const register = async ({ name, email, password }) => {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data.data; // { user, token }
};

const login = async ({ email, password }) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data.data; // { user, token }
};

const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data.data.user;
};

const updateProfile = async ({ name, avatar }) => {
  const { data } = await api.put('/auth/update-profile', { name, avatar });
  return data.data.user;
};

const updatePassword = async ({ currentPassword, newPassword }) => {
  const { data } = await api.put('/auth/update-password', {
    currentPassword,
    newPassword,
  });
  return data.data; // { token }
};

const createManager = async ({ name, email, password }) => {
  const { data } = await api.post('/auth/create-manager', {
    name,
    email,
    password,
  });
  return data.data.user;
};

const authService = {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  createManager,
};

export default authService;
