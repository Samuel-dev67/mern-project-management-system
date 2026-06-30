import { FiSearch, FiX } from 'react-icons/fi';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const selectClass =
  'rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

/**
 * Search + filter controls for the Kanban board. Status filter
 * collapses the board down to a single column (rather than hiding
 * cards within all three) since status IS the column grouping.
 */
const TaskFilters = ({ filters, onChange, assignableUsers, hasActiveFilters, onClear }) => {
  const handleField = (field) => (e) => onChange({ ...filters, [field]: e.target.value });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-[200px] flex-1">
        <FiSearch
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={filters.search}
          onChange={handleField('search')}
          placeholder="Search tasks by title..."
          className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>

      <select value={filters.status} onChange={handleField('status')} className={`${selectClass} sm:w-40`}>
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select value={filters.priority} onChange={handleField('priority')} className={`${selectClass} sm:w-40`}>
        {PRIORITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select value={filters.assignee} onChange={handleField('assignee')} className={`${selectClass} sm:w-44`}>
        <option value="">All Assignees</option>
        <option value="unassigned">Unassigned</option>
        {assignableUsers.map((u) => (
          <option key={u._id} value={u._id}>
            {u.name}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={filters.dueBefore}
        onChange={handleField('dueBefore')}
        aria-label="Due on or before"
        className={`${selectClass} sm:w-40`}
      />

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <FiX size={13} />
          Clear
        </button>
      )}
    </div>
  );
};

export default TaskFilters;
