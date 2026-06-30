import { useState, useEffect, useRef, useCallback } from 'react';
import { FiSearch, FiUserPlus, FiUserMinus, FiUser } from 'react-icons/fi';
import userService from '../../services/userService';
import projectService from '../../services/projectService';
import Spinner from '../common/Spinner';
import Alert from '../common/Alert';

/**
 * Renders the current member list with remove buttons, plus a search
 * box to find and add new members. All mutations go through
 * projectService.updateMembers, which is the single source of truth
 * for membership — this component just reflects its result back up
 * via onMembersChange so the parent page's project state stays in sync.
 */
const MemberManager = ({ projectId, members, onMembersChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  const memberIds = new Set(members.map((m) => m._id));

  const runSearch = useCallback(
    async (term) => {
      setSearching(true);
      setSearchError('');
      try {
        const users = await userService.getAll();
        const filtered = users
          .filter((u) => !memberIds.has(u._id))
          .filter(
            (u) =>
              !term ||
              u.name.toLowerCase().includes(term.toLowerCase()) ||
              u.email.toLowerCase().includes(term.toLowerCase())
          );
        setResults(filtered);
      } catch (err) {
        setSearchError(err.message || 'Failed to load users');
      } finally {
        setSearching(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [members]
  );

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

  const handleAdd = async (user) => {
    if (memberIds.has(user._id)) return; // prevent duplicates
    setActionError('');
    setPendingId(user._id);
    try {
      const updatedMembers = await projectService.updateMembers(projectId, {
        action: 'add',
        memberId: user._id,
      });
      onMembersChange(updatedMembers);
      setQuery('');
      setResults((prev) => prev.filter((u) => u._id !== user._id));
    } catch (err) {
      setActionError(err.message || 'Failed to add member.');
    } finally {
      setPendingId(null);
    }
  };

  const handleRemove = async (user) => {
    setActionError('');
    setPendingId(user._id);
    try {
      const updatedMembers = await projectService.updateMembers(projectId, {
        action: 'remove',
        memberId: user._id,
      });
      onMembersChange(updatedMembers);
    } catch (err) {
      setActionError(err.message || 'Failed to remove member.');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {actionError && <Alert variant="error" message={actionError} />}

      {/* Search to add */}
      <div ref={containerRef} className="relative">
        <FiSearch
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search people to add..."
          className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
        />

        {open && (
          <div className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-card-hover dark:border-gray-800 dark:bg-gray-900">
            {searching && (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" />
              </div>
            )}
            {!searching && searchError && (
              <p className="px-3.5 py-3 text-sm text-red-500">{searchError}</p>
            )}
            {!searching && !searchError && results.length === 0 && (
              <p className="px-3.5 py-3 text-sm text-gray-400 dark:text-gray-500">
                No matching users to add.
              </p>
            )}
            {!searching &&
              !searchError &&
              results.map((u) => (
                <button
                  type="button"
                  key={u._id}
                  onClick={() => handleAdd(u)}
                  disabled={pendingId === u._id}
                  className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-800"
                >
                  <span>
                    <span className="block font-medium text-gray-900 dark:text-white">{u.name}</span>
                    <span className="block text-xs text-gray-400 dark:text-gray-500">{u.email}</span>
                  </span>
                  {pendingId === u._id ? (
                    <Spinner size="sm" />
                  ) : (
                    <FiUserPlus size={14} className="text-primary-600 dark:text-primary-400" />
                  )}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Current members */}
      {members.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
          No members yet. Search above to add someone.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {members.map((m) => (
            <li key={m._id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
                  {m.name?.charAt(0).toUpperCase() || <FiUser size={14} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{m.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(m)}
                disabled={pendingId === m._id}
                aria-label={`Remove ${m.name}`}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                {pendingId === m._id ? <Spinner size="sm" /> : <FiUserMinus size={14} />}
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MemberManager;
