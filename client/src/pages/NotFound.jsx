import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center dark:bg-surface-dark">
      <p className="text-7xl font-bold text-primary-600 dark:text-primary-400">404</p>
      <h1 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
      >
        <FiArrowLeft size={16} />
        Back to safety
      </Link>
    </div>
  );
};

export default NotFound;
