const SIZE_MAP = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
};

const Spinner = ({ size = 'md', className = '' }) => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`${SIZE_MAP[size]} animate-spin rounded-full border-primary-600
        border-t-transparent dark:border-primary-400 dark:border-t-transparent ${className}`}
    />
  );
};

export default Spinner;
