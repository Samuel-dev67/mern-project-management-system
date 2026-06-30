import api from './api';

// Maps 1:1 to server/routes/projectRoutes.js

const getAll = async (params = {}) => {
  const { data } = await api.get('/projects', { params });
  return data.data.projects;
};

const getById = async (id) => {
  const { data } = await api.get(`/projects/${id}`);
  return data.data.project;
};

const create = async ({ title, description, members }) => {
  const { data } = await api.post('/projects', { title, description, members });
  return data.data.project;
};

const update = async (id, updates) => {
  const { data } = await api.put(`/projects/${id}`, updates);
  return data.data.project;
};

const remove = async (id) => {
  const { data } = await api.delete(`/projects/${id}`);
  return data;
};

const archive = async (id) => {
  const { data } = await api.put(`/projects/${id}/archive`);
  return data.data.project;
};

const updateMembers = async (id, { action, memberId }) => {
  const { data } = await api.put(`/projects/${id}/members`, { action, memberId });
  return data.data.members;
};

const projectService = {
  getAll,
  getById,
  create,
  update,
  remove,
  archive,
  updateMembers,
};

export default projectService;
