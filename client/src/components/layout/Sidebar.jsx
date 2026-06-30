import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiFolder,
  FiUser,
  FiUserPlus,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: FiGrid, roles: ['admin', 'manager', 'member'] },
  { to: '/projects', label: 'Projects', icon: FiFolder, roles: ['admin', 'manager', 'member'] },
  { to: '/profile', label: 'Profile', icon: FiUser, roles: ['admin', 'manager', 'member'] },
  { to: '/manage-managers', label: 'Manage Managers', icon: FiUserPlus, roles: ['admin'] },
];

/**
 * isOpen/onClose control the mobile slide-over drawer behavior.
 * On desktop (md breakpoint and up) the sidebar is always visible
 * as a fixed column; on smaller screens it overlays the content.
 */
const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-200
          bg-white transition-transform duration-200 ease-in-out
          dark:border-gray-800 dark:bg-gray-900
          md:relative md:z-0 md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
              T
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">TaskFlow</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 md:hidden"
            aria-label="Close sidebar"
          >
            <FiX size={20} />
          </button>
        </div>

        <nav className="mt-4 flex flex-col gap-1 px-3">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
