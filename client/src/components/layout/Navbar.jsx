import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiChevronDown, FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import Badge from '../common/Badge';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white md:hidden"
        aria-label="Open sidebar"
      >
        <FiMenu size={22} />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
              {initials || <FiUser size={14} />}
            </div>
            <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-200 sm:block">
              {user?.name}
            </span>
            <FiChevronDown size={16} className="text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-card-hover dark:border-gray-800 dark:bg-gray-900">
              <div className="px-2.5 py-2">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                <Badge value={user?.role} className="mt-1.5" />
              </div>
              <hr className="my-1 border-gray-100 dark:border-gray-800" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/profile');
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <FiUser size={16} />
                View Profile
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <FiLogOut size={16} />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
