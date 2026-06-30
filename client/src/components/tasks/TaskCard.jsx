import { FiCalendar, FiEdit2, FiTrash2, FiUser, FiMessageSquare, FiAlertCircle } from 'react-icons/fi';
import Badge from '../common/Badge';

const formatDueDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const isOverdue = (dateStr, status) => {
  if (!dateStr || status === 'completed') return false;
  const due = new Date(dateStr);
  due.setHours(23, 59, 59, 999);
  return due.getTime() < Date.now();
};

/**
 * Single task card rendered inside a Kanban column. Draggable when the
 * current user is allowed to change the task's status (project owner,
 * admin, or the assignee — mirrors canUpdateTaskStatus on the server).
 */
const TaskCard = ({ task, canManage, canChangeStatus, onOpen, onEdit, onDelete, onDragStart, onDragEnd, isDragging }) => {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={canChangeStatus}
      onDragStart={canChangeStatus ? (e) => onDragStart(e, task) : undefined}
      onDragEnd={canChangeStatus ? onDragEnd : undefined}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(task);
        }
      }}
      className={`group flex cursor-pointer flex-col gap-2.5 rounded-xl border border-gray-200 bg-white p-3.5 text-left shadow-card transition hover:shadow-card-hover dark:border-gray-800 dark:bg-gray-900 ${
        canChangeStatus ? 'cursor-grab active:cursor-grabbing' : ''
      } ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 break-words text-sm font-semibold text-gray-900 dark:text-white">
          {task.title}
        </p>
        <Badge value={task.priority} />
      </div>

      {task.description && (
        <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{task.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-400 dark:text-gray-500">
        {task.dueDate && (
          <span
            className={`flex items-center gap-1 ${
              overdue ? 'font-medium text-red-600 dark:text-red-400' : ''
            }`}
          >
            {overdue ? <FiAlertCircle size={12} /> : <FiCalendar size={12} />}
            {formatDueDate(task.dueDate)}
          </span>
        )}
        {task.comments?.length > 0 && (
          <span className="flex items-center gap-1">
            <FiMessageSquare size={12} />
            {task.comments.length}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 dark:border-gray-800">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
            {task.assignedTo?.name?.charAt(0).toUpperCase() || <FiUser size={11} />}
          </div>
          <span className="max-w-[7rem] truncate">{task.assignedTo?.name || 'Unassigned'}</span>
        </div>

        {canManage && (
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              aria-label="Edit task"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <FiEdit2 size={13} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task);
              }}
              aria-label="Delete task"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <FiTrash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
