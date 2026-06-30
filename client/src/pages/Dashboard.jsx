import { useState, useEffect, useCallback } from 'react';
import {
  FiFolder,
  FiCheckSquare,
  FiClock,
  FiAlertCircle,
  FiActivity,
  FiCalendar,
  FiUser,
  FiRefreshCw,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import dashboardService from '../services/dashboardService';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatRelativeTime = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatDueDate = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date - now) / 86400000);

  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays}d`;
};

const getDueDateColor = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date - now) / 86400000);

  if (diffDays <= 1) return 'text-red-600 dark:text-red-400';
  if (diffDays <= 3) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
          {value ?? '—'}
        </p>
        {sub != null && (
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{sub}</p>
        )}
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon size={18} />
      </div>
    </div>
  </div>
);

const ActivityItem = ({ item }) => (
  <li className="flex items-start gap-3 py-3">
    <div
      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold ${
        item.type === 'project'
          ? 'bg-primary-600'
          : 'bg-amber-500'
      }`}
    >
      {item.type === 'project' ? <FiFolder size={14} /> : <FiCheckSquare size={14} />}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
        {item.title}
      </p>
      <div className="mt-0.5 flex flex-wrap items-center gap-2">
        {item.type === 'task' && item.project && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {item.project.title}
          </span>
        )}
        <Badge value={item.status} />
        {item.priority && <Badge value={item.priority} />}
      </div>
    </div>
    <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
      {formatRelativeTime(item.updatedAt)}
    </span>
  </li>
);

const DeadlineItem = ({ task }) => (
  <li className="flex items-center gap-3 py-3">
    <FiCalendar
      size={16}
      className="shrink-0 text-gray-400 dark:text-gray-500"
    />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
        {task.title}
      </p>
      {task.project && (
        <p className="text-xs text-gray-400 dark:text-gray-500">{task.project.title}</p>
      )}
    </div>
    <div className="flex shrink-0 flex-col items-end gap-1">
      <span className={`text-xs font-medium ${getDueDateColor(task.dueDate)}`}>
        {formatDueDate(task.dueDate)}
      </span>
      {task.assignedTo && (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {task.assignedTo.name?.split(' ')[0]}
        </span>
      )}
    </div>
  </li>
);

const AssignedItem = ({ task }) => (
  <li className="flex items-center gap-3 py-3">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40">
      <FiUser size={14} className="text-primary-600 dark:text-primary-400" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
        {task.title}
      </p>
      {task.project && (
        <p className="text-xs text-gray-400 dark:text-gray-500">{task.project.title}</p>
      )}
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <Badge value={task.status} />
      {task.dueDate && (
        <span className={`text-xs ${getDueDateColor(task.dueDate)}`}>
          {formatDueDate(task.dueDate)}
        </span>
      )}
    </div>
  </li>
);

const SectionCard = ({ title, icon: Icon, children, isEmpty, emptyMessage }) => (
  <div className="rounded-2xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-900">
    <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
      <Icon size={16} className="text-primary-600 dark:text-primary-400" />
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
    </div>
    <div className="px-5">
      {isEmpty ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          {emptyMessage}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">{children}</ul>
      )}
    </div>
  </div>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const SkeletonBlock = ({ className }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800 ${className}`} />
);

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div>
      <SkeletonBlock className="h-7 w-56" />
      <SkeletonBlock className="mt-2 h-4 w-72" />
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-8 w-16" />
              <SkeletonBlock className="h-3 w-32" />
            </div>
            <SkeletonBlock className="h-10 w-10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
        >
          <SkeletonBlock className="mb-4 h-5 w-32" />
          {[...Array(3)].map((_, j) => (
            <SkeletonBlock key={j} className="mb-3 h-10 w-full" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const result = await dashboardService.getStats();
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) return <DashboardSkeleton />;

  const { stats, recentActivity, upcomingDeadlines, assignedTasks } = data || {};

  const completionRate =
    stats?.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  const projectCompletionRate =
    stats?.totalProjects > 0
      ? Math.round((stats.completedProjects / stats.totalProjects) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Here's what's happening with your projects today.
          </p>
        </div>
        <button
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-card transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <FiRefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="error" message={error} />
      )}

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            icon={FiFolder}
            label="Total Projects"
            value={stats.totalProjects}
            sub={`${stats.completedProjects} completed · ${projectCompletionRate}% done`}
            color="bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400"
          />
          <StatCard
            icon={FiCheckSquare}
            label="Total Tasks"
            value={stats.totalTasks}
            sub={`${stats.completedTasks} completed · ${completionRate}% done`}
            color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
          />
          <StatCard
            icon={FiClock}
            label="Tasks Due Today"
            value={stats.tasksDueToday}
            sub={stats.tasksDueToday === 0 ? 'All caught up!' : 'Needs attention'}
            color={
              stats.tasksDueToday > 0
                ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }
          />
          <StatCard
            icon={FiActivity}
            label="Active Projects"
            value={stats.pendingProjects}
            sub="Currently in progress"
            color="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
          />
          <StatCard
            icon={FiAlertCircle}
            label="Incomplete Tasks"
            value={stats.totalTasks - stats.completedTasks}
            sub="Across all projects"
            color="bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
          />
          <StatCard
            icon={FiCalendar}
            label="Upcoming Deadlines"
            value={upcomingDeadlines?.length ?? 0}
            sub="Due in next 7 days"
            color="bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400"
          />
        </div>
      )}

      {/* Progress bar row */}
      {stats && stats.totalTasks > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall task completion
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {completionRate}%
            </span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-2 rounded-full bg-primary-600 transition-all duration-700 dark:bg-primary-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
            <span>{stats.completedTasks} completed</span>
            <span>·</span>
            <span>{stats.totalTasks - stats.completedTasks} remaining</span>
          </div>
        </div>
      )}

      {/* Three-column section grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <SectionCard
          title="Recent Activity"
          icon={FiActivity}
          isEmpty={!recentActivity || recentActivity.length === 0}
          emptyMessage="No recent activity yet."
        >
          {recentActivity?.map((item) => (
            <ActivityItem key={`${item.type}-${item.id}`} item={item} />
          ))}
        </SectionCard>

        {/* Upcoming Deadlines */}
        <SectionCard
          title="Upcoming Deadlines"
          icon={FiCalendar}
          isEmpty={!upcomingDeadlines || upcomingDeadlines.length === 0}
          emptyMessage="No deadlines in the next 7 days."
        >
          {upcomingDeadlines?.map((task) => (
            <DeadlineItem key={task._id} task={task} />
          ))}
        </SectionCard>

        {/* My Tasks */}
        <SectionCard
          title="Assigned to Me"
          icon={FiUser}
          isEmpty={!assignedTasks || assignedTasks.length === 0}
          emptyMessage="No tasks assigned to you."
        >
          {assignedTasks?.map((task) => (
            <AssignedItem key={task._id} task={task} />
          ))}
        </SectionCard>
      </div>
    </div>
  );
};

export default Dashboard;
