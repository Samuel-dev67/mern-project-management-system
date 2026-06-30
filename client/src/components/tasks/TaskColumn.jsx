import { FiPlus } from 'react-icons/fi';
import TaskCard from './TaskCard';

const COLUMN_STYLES = {
  todo: 'border-t-gray-400 dark:border-t-gray-600',
  'in-progress': 'border-t-amber-400 dark:border-t-amber-500',
  completed: 'border-t-emerald-400 dark:border-t-emerald-500',
};

/**
 * One Kanban column for a single task status. Accepts drops from
 * TaskCard's native HTML5 drag-and-drop (no external DnD library)
 * and reports the dropped task id back up via onDropTask.
 */
const TaskColumn = ({
  status,
  label,
  tasks,
  canManage,
  draggingTaskId,
  isDragOver,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDropTask,
  onAddTask,
  onOpenTask,
  onEditTask,
  onDeleteTask,
  onDragStart,
  onDragEnd,
  canChangeStatus,
}) => {
  return (
    <div
      onDragEnter={(e) => onDragEnter(e, status)}
      onDragLeave={onDragLeave}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e, status);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDropTask(status);
      }}
      className={`flex min-w-[280px] flex-1 flex-col rounded-2xl border border-t-4 bg-gray-50/60 transition-colors dark:border-gray-800 dark:bg-gray-900/40 ${
        COLUMN_STYLES[status]
      } ${isDragOver ? 'ring-2 ring-primary-400 dark:ring-primary-500' : 'border-gray-200'}`}
    >
      <div className="flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{label}</h3>
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {tasks.length}
          </span>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => onAddTask(status)}
            aria-label={`Add task to ${label}`}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <FiPlus size={15} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-3 pb-3">
        {tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gray-300 py-8 text-center text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
            No tasks here
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              canManage={canManage}
              canChangeStatus={canChangeStatus(task)}
              onOpen={onOpenTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={draggingTaskId === task._id}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TaskColumn;
