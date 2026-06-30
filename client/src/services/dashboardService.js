import api from './api';

// Maps 1:1 to server/routes/dashboardRoutes.js

const getStats = async () => {
  const { data } = await api.get('/dashboard/stats');
  return data.data; // { stats, recentActivity, upcomingDeadlines, assignedTasks }
};

const dashboardService = { getStats };

export default dashboardService;
