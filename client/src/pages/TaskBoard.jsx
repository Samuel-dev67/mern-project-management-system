import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import projectService from '../services/projectService';
import taskService from '../services/taskService';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import ConfirmDialog from '../components/projects/ConfirmDialog';
import TaskColumn from '../components/tasks/TaskColumn';
import TaskFilters from '../components/tasks/TaskFilters';
import TaskFormModal from '../components/tasks/TaskFormModal';
import TaskDetailsModal from '../components/tasks/TaskDetailsModal';

const COLUMNS = [
  { status: 'todo', label: 'To Do' },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'completed', label: 'Completed' },
];

const emptyFilters = { search: '', status: '', priority: '', assignee: '', dueBefore: '' };

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const BoardSkeleton = () => (
  <div className="flex animate-pulse gap-4 overflow-x-auto pb-2">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="min-w-[280px] flex-1 rounded-2xl border border-gray-200 bg-gray-50/60 p-3.5 dark:border-gray-800 dark:bg-gray-900/40"
      >
        <div className="mb-3 h-5 w-24 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="space-y-2.5">
          <div className="h-24 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="h-24 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    ))}
  </div>
);

const TaskBoard = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState(emptyFilters);

  const [formModal, setFormModal] = useState({ open: false, task: null, defaultStatus: 'todo' });
  const [detailsTask, setDetailsTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionError, setActionError] = useState('');

  // Native HTML5 drag-and-drop state — no external DnD library needed.
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const [projectResult, tasksResult] = await Promise.all([
          projectService.getById(projectId),
          taskService.getByProject(projectId),
        ]);
        setProject(projectResult);
        setTasks(tasksResult);
      } catch (err) {
        setError(err.message || 'Failed to load the task board. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const canManage = useMemo(() => {
    if (!project || !user) return false;
    return user.role === 'admin' || project.createdBy?._id === user._id;
  }, [project, user]);

  const canChangeStatus = useCallback(
    (task) => {
      if (!user) return false;
      if (canManage) return true;
      return task.assignedTo?._id === user._id;
    },
    [canManage, user]
  );

  const assignableUsers = useMemo(() => {
    if (!project) return [];
    const owner = project.createdBy ? [project.createdBy] : [];
    const members = project.members || [];
    const seen = new Set();
    return [...owner, ...members].filter((u) => {
      if (!u || seen.has(u._id)) return false;
      seen.add(u._id);
      return true;
    });
  }, [project]);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.search.trim()) {
        const term = filters.search.trim().toLowerCase();
        if (!task.title.toLowerCase().includes(term)) return false;
      }
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.assignee) {
        if (filters.assignee === 'unassigned') {
          if (task.assignedTo) return false;
        } else if (task.assignedTo?._id !== filters.assignee) {
          return false;
        }
      }
      if (filters.dueBefore) {
        if (!task.dueDate) return false;
        if (new Date(task.dueDate) > new Date(`${filters.dueBefore}T23:59:59`)) return false;
      }
      return true;
    });
  }, [tasks, filters]);

  // The status filter narrows which columns are shown, since status
  // already defines the column grouping — filtering it the same way
  // as the other fields would just empty out two columns.
  const visibleColumns = filters.status ? COLUMNS.filter((c) => c.status === filters.status) : COLUMNS;

  const tasksByStatus = useMemo(() => {
    const grouped = { todo: [], 'in-progress': [], completed: [] };
    filteredTasks.forEach((task) => {
      if (grouped[task.status]) grouped[task.status].push(task);
    });
    return grouped;
  }, [filteredTasks]);

  // ─── CRUD actions ───────────────────────────────────────────────────────────

  const handleCreate = async (payload) => {
    const created = await taskService.create(projectId, payload);
    setTasks((prev) => [created, ...prev]);
  };

  const handleUpdate = async (taskId, updates) => {
    const updated = await taskService.update(taskId, updates);
    setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
    setDetailsTask((prev) => (prev && prev._id === taskId ? updated : prev));
  };

  const handleDelete = async () => {
    await taskService.remove(deleteTarget._id);
    setTasks((prev) => prev.filter((t) => t._id !== deleteTarget._id));
    setDetailsTask((prev) => (prev && prev._id === deleteTarget._id ? null : prev));
  };

  const handleStatusChange = async (taskId, status) => {
    setActionError('');
    try {
      const updated = await taskService.updateStatus(taskId, status);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: updated.status } : t)));
    } catch (err) {
      setActionError(err.message || 'Failed to update task status.');
      throw err;
    }
  };

  // ─── Drag and drop ──────────────────────────────────────────────────────────

  const handleDragStart = (e, task) => {
    setDraggingTaskId(task._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverStatus(null);
  };

  const handleDropTask = async (status) => {
    setDragOverStatus(null);
    const taskId = draggingTaskId;
    setDraggingTaskId(null);
    if (!taskId) return;

    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === status) return;

    // Optimistic update, rolled back on failure.
    const previousStatus = task.status;
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status } : t)));
    try {
      await handleStatusChange(taskId, status);
    } catch {
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: previousStatus } : t)));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        <BoardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white py-14 text-center dark:border-gray-800 dark:bg-gray-900">
        <Alert variant="error" message={error} />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => fetchData()}>
            Try Again
          </Button>
          <Button variant="ghost" onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      <Link
        to={`/projects/${projectId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <FiArrowLeft size={15} />
        Back to {project.title}
      </Link>

      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Board</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{project.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-card transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <FiRefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          {canManage && (
            <Button onClick={() => setFormModal({ open: true, task: null, defaultStatus: 'todo' })}>
              <FiPlus size={16} />
              New Task
            </Button>
          )}
        </div>
      </div>

      {actionError && <Alert variant="error" message={actionError} />}

      <TaskFilters
        filters={filters}
        onChange={setFilters}
        assignableUsers={assignableUsers}
        hasActiveFilters={hasActiveFilters}
        onClear={() => setFilters(emptyFilters)}
      />

      {filteredTasks.length === 0 && tasks.length > 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500">No tasks match your search or filters.</p>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2">
        {visibleColumns.map((col) => (
          <TaskColumn
            key={col.status}
            status={col.status}
            label={col.label}
            tasks={tasksByStatus[col.status]}
            canManage={canManage}
            canChangeStatus={canChangeStatus}
            draggingTaskId={draggingTaskId}
            isDragOver={dragOverStatus === col.status}
            onDragEnter={(_e, status) => setDragOverStatus(status)}
            onDragLeave={() => setDragOverStatus(null)}
            onDragOver={(_e, status) => setDragOverStatus(status)}
            onDropTask={handleDropTask}
            onAddTask={(status) => setFormModal({ open: true, task: null, defaultStatus: status })}
            onOpenTask={setDetailsTask}
            onEditTask={(task) => setFormModal({ open: true, task, defaultStatus: task.status })}
            onDeleteTask={setDeleteTarget}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      <TaskFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, task: null, defaultStatus: 'todo' })}
        task={formModal.task}
        project={project}
        defaultStatus={formModal.defaultStatus}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <TaskDetailsModal
        isOpen={Boolean(detailsTask)}
        onClose={() => setDetailsTask(null)}
        task={detailsTask}
        canManage={canManage}
        canChangeStatus={detailsTask ? canChangeStatus(detailsTask) : false}
        onEdit={(task) => {
          setDetailsTask(null);
          setFormModal({ open: true, task, defaultStatus: task.status });
        }}
        onDelete={(task) => {
          setDetailsTask(null);
          setDeleteTarget(task);
        }}
        onStatusChange={handleStatusChange}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Task"
      />
    </div>
  );
};

export default TaskBoard;
