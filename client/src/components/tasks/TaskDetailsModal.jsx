import { useState, useEffect } from 'react';
import { FiCalendar, FiUser, FiClock, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Alert from '../common/Alert';
import Spinner from '../common/Spinner';
import TaskComments from './TaskComments';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const formatDateTime = (dateStr) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

/**
 * Side-panel-style modal with the full task record: description,
 * metadata, comments, and a status selector. The status selector is
 * the accessible/non-drag fallback for moving a task between Kanban
 * columns, kept here alongside the board's native drag-and-drop.
 */
const TaskDetailsModal = ({ isOpen, onClose, task, canManage, canChangeStatus, onEdit, onDelete, onStatusChange }) => {
  const [localTask, setLocalTask] = useState(task);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    setLocalTask(task);
    setStatusError('');
  }, [task]);

  if (!isOpen || !localTask) return null;

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    const previous = localTask.status;
    setLocalTask((prev) => ({ ...prev, status: newStatus }));
    setStatusUpdating(true);
    setStatusError('');
    try {
      await onStatusChange(localTask._id, newStatus);
    } catch (err) {
      setLocalTask((prev) => ({ ...prev, status: previous }));
      setStatusError(err.message || 'Failed to update status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCommentsChange = (updatedComments) => {
    setLocalTask((prev) => ({ ...prev, comments: updatedComments }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Task Details"
      size="xl"
      footer={
        canManage && (
          <>
            <Button variant="danger" onClick={() => onDelete(localTask)}>
              <FiTrash2 size={14} />
              Delete
            </Button>
            <Button variant="secondary" onClick={() => onEdit(localTask)}>
              <FiEdit2 size={14} />
              Edit Task
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="min-w-0 flex-1 break-words text-lg font-bold text-gray-900 dark:text-white">
            {localTask.title}
          </h2>
          <Badge value={localTask.priority} />
        </div>

        <p className="whitespace-pre-wrap break-words text-sm text-gray-600 dark:text-gray-300">
          {localTask.description || 'No description provided.'}
        </p>

        <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-800/50 sm:grid-cols-2">
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Status
            </p>
            {canChangeStatus ? (
              <div className="flex items-center gap-2">
                <select
                  value={localTask.status}
                  onChange={handleStatusChange}
                  disabled={statusUpdating}
                  className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {statusUpdating && <Spinner size="sm" />}
              </div>
            ) : (
              <Badge value={localTask.status} />
            )}
          </div>

          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              <FiUser size={12} /> Assignee
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              {localTask.assignedTo?.name || 'Unassigned'}
            </p>
          </div>

          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              <FiCalendar size={12} /> Due Date
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              {localTask.dueDate ? formatDate(localTask.dueDate) : 'No due date'}
            </p>
          </div>

          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              <FiClock size={12} /> Created / Updated
            </p>
            <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(localTask.createdAt)}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Updated {formatDateTime(localTask.updatedAt)}</p>
          </div>
        </div>

        {statusError && <Alert variant="error" message={statusError} />}

        <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
          <TaskComments
            taskId={localTask._id}
            comments={localTask.comments || []}
            onCommentsChange={handleCommentsChange}
          />
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailsModal;
