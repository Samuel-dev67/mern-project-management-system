import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const VARIANTS = {
  error: {
    wrapper: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
    icon: FiAlertCircle,
  },
  success: {
    wrapper:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
    icon: FiCheckCircle,
  },
};

const Alert = ({ variant = 'error', message }) => {
  if (!message) return null;

  const { wrapper, icon: Icon } = VARIANTS[variant];

  return (
    <div className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm ${wrapper}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
};

export default Alert;
