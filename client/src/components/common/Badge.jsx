const COLOR_MAP = {
  // roles
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  member: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  // project status
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  // task status
  todo: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'in-progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  // priority
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const LABEL_MAP = {
  'in-progress': 'In Progress',
};

const Badge = ({ value, className = '' }) => {
  const colorClasses = COLOR_MAP[value] || COLOR_MAP.member;
  const label = LABEL_MAP[value] || (value ? value.charAt(0).toUpperCase() + value.slice(1) : '');

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${colorClasses} ${className}`}
    >
      {label}
    </span>
  );
};

export default Badge;
