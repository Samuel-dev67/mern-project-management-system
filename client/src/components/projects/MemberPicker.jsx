import { useState, useEffect, useRef, useCallback } from 'react';
import { FiSearch, FiX, FiUserPlus } from 'react-icons/fi';
import userService from '../../services/userService';
import Spinner from '../common/Spinner';

/**
 * Search-as-you-type user picker. Keeps a list of selected users
 * (passed up via onChange) and prevents the same user being added
 * twice. Used by ProjectFormModal when creating a project with an
 * initial member list.
 */
const MemberPicker = ({ selected, onChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  const selectedIds = new Set(selected.map((u) => u._id));

  const runSearch = useCallback(async (term) => {
    setLoading(true);
    setError('');
    try {
      const users = await userService.getAll();
      const filtered = term
        ? users.filter(
            (u) =>
              u.name.toLowerCase().includes(term.toLowerCase()) ||
              u.email.toLowerCase().includes(term.toLowerCase())
          )
        : users;
      setResults(filtered);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, open, runSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addUser = (user) => {
    if (selectedIds.has(user._id)) return; // prevent duplicates
    onChange([...selected, user]);
    setQuery('');
  };

  const removeUser = (userId) => {
    onChange(selected.filter((u) => u._id !== userId));
  };

  return (
    <div ref={containerRef}>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Members
      </label>

      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((user) => (
            <span
              key={user._id}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 py-1 pl-2.5 pr-1.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
            >
              {user.name}
              <button
                type="button"
                onClick={() => removeUser(user._id)}
                aria-label={`Remove ${user.name}`}
                className="rounded-full p-0.5 hover:bg-primary-100 dark:hover:bg-primary-900/50"
              >
                <FiX size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <FiSearch
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search people by name or email..."
          className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
        />

        {open && (
          <div className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-card-hover dark:border-gray-800 dark:bg-gray-900">
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" />
              </div>
            )}
            {!loading && error && (
              <p className="px-3.5 py-3 text-sm text-red-500">{error}</p>
            )}
            {!loading && !error && results.length === 0 && (
              <p className="px-3.5 py-3 text-sm text-gray-400 dark:text-gray-500">
                No users found.
              </p>
            )}
            {!loading &&
              !error &&
              results.map((user) => {
                const isSelected = selectedIds.has(user._id);
                return (
                  <button
                    type="button"
                    key={user._id}
                    onClick={() => addUser(user)}
                    disabled={isSelected}
                    className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm hover:bg-gray-50 disabled:cursor-default disabled:opacity-50 dark:hover:bg-gray-800"
                  >
                    <span>
                      <span className="block font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </span>
                      <span className="block text-xs text-gray-400 dark:text-gray-500">
                        {user.email}
                      </span>
                    </span>
                    {isSelected ? (
                      <span className="text-xs text-gray-400 dark:text-gray-500">Added</span>
                    ) : (
                      <FiUserPlus size={14} className="text-primary-600 dark:text-primary-400" />
                    )}
                  </button>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberPicker;
