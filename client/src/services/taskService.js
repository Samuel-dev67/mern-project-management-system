import api from './api';

// Maps 1:1 to server/routes/taskRoutes.js (both the nested
// /api/projects/:projectId/tasks routes and the flat /api/tasks/:id routes)

const getByProject = async (projectId, params = {}) => {
  const { data } = await api.get(`/projects/${projectId}/tasks`, { params });
  return data.data.tasks;
};

const create = async (projectId, { title, description, priority, assignedTo, dueDate }) => {
  const { data } = await api.post(`/projects/${projectId}/tasks`, {
    title,
    description,
    priority,
    assignedTo,
    dueDate,
  });
  return data.data.task;
};

const getById = async (id) => {
  const { data } = await api.get(`/tasks/${id}`);
  return data.data.task;
};

const update = async (id, updates) => {
  const { data } = await api.put(`/tasks/${id}`, updates);
  return data.data.task;
};

const updateStatus = async (id, status) => {
  const { data } = await api.put(`/tasks/${id}/status`, { status });
  return data.data.task;
};

const remove = async (id) => {
  const { data } = await api.delete(`/tasks/${id}`);
  return data;
};

const addComment = async (id, text) => {
  const { data } = await api.post(`/tasks/${id}/comments`, { text });
  return data.data.comments;
};

const taskService = {
  getByProject,
  create,
  getById,
  update,
  updateStatus,
  remove,
  addComment,
};

export default taskService;
