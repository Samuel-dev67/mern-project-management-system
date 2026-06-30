import api from './api';

// Maps 1:1 to server/routes/userRoutes.js
// Backing endpoint is restricted to admin/manager on the server, which
// matches how this service is only ever consumed from project
// create/edit/member-management screens (also admin/manager-only),
// plus the admin-only Manage Managers screen (Sprint 6).

const getAll = async (params = {}) => {
  const { data } = await api.get('/users', { params });
  return data.data.users;
};

const updateRole = async (id, role) => {
  const { data } = await api.put(`/users/${id}/role`, { role });
  return data.data.user;
};

const userService = { getAll, updateRole };

export default userService;
