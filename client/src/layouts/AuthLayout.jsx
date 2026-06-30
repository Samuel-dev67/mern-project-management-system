import { Outlet } from 'react-router-dom';
import ThemeToggle from '../components/layout/ThemeToggle';

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-surface-dark">
      <div className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
            T
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">TaskFlow</span>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-card dark:border-gray-800 dark:bg-gray-900">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
