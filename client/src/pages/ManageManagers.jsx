import { useState, useEffect, useCallback, useMemo } from 'react';
import { FiSearch, FiUsers, FiRefreshCw, FiCalendar } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import userService from '../services/userService';
import Badge from '../components/common/Badge';
import Alert from '../components/common/Alert';
import Avatar from '../components/profile/Avatar';
import ConfirmDialog from '../components/projects/ConfirmDialog';

const ROLE_FILTERS = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'member', label: 'Member' },
];

const ROLE_OPTIONS = ['member', 'manager', 'admin'];

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const SkeletonBlock = ({ className }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800 ${className}`} />
);

const SkeletonRow = () => (
  <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 last:border-0 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-3">
      <SkeletonBlock className="h-9 w-9 rounded-full" />
      <div className="space-y-1.5">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-3 w-44" />
      </div>
    </div>
    <div className="flex items-center gap-3">
      <SkeletonBlock className="h-5 w-16 rounded-full" />
      <SkeletonBlock className="h-4 w-20" />
      <SkeletonBlock className="h-9 w-28 rounded-xl" />
    </div>
  </div>
);

const ManageManagersSkeleton = () => (
  <div className="space-y-6">
    <div>
      <SkeletonBlock className="h-7 w-48" />
      <SkeletonBlock className="mt-2 h-4 w-72" />
    </div>
    <div className="flex flex-col gap-3 sm:flex-row">
      <SkeletonBlock className="h-10 flex-1" />
      <SkeletonBlock className="h-10 w-full sm:w-44" />
    </div>
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {[...Array(5)].map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────

const ManageManagers = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [successMessage, setSuccessMessage] = useState('');
  const [pendingChange, setPendingChange] = useState(null); // { user, newRole }

  const fetchUsers = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const result = await userService.getAll();
      setUsers(result);
    } catch (err) {
      setError(err.message || 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Auto-dismiss success banners so they don't linger indefinitely.
  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const visibleUsers = useMemo(() => {
    let result = users;

    if (roleFilter) {
      result = result.filter((u) => u.role === roleFilter);
    }

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
      );
    }

    // Always alphabetical by name, regardless of fetch/filter order.
    return [...result].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [users, search, roleFilter]);

  const handleRoleChange = async () => {
    if (!pendingChange) return;
    const { user, newRole } = pendingChange;
    const updated = await userService.updateRole(user._id, newRole);
    setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
    setSuccessMessage(`${updated.name}'s role was changed to ${newRole}.`);
  };

  if (loading) return <ManageManagersSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Managers</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View every user and manage their role across the system.
          </p>
        </div>
        <button
          onClick={() => fetchUsers(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-card transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <FiRefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {successMessage && <Alert variant="success" message={successMessage} />}

      {/* Search & filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <FiSearch
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 sm:w-48"
        >
          {ROLE_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white py-14 text-center dark:border-gray-800 dark:bg-gray-900">
          <Alert variant="error" message={error} />
          <button
            onClick={() => fetchUsers()}
            className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!error && visibleUsers.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
            <FiUsers size={22} />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {users.length === 0 ? 'No users found' : 'No users match your search'}
          </p>
          <p className="max-w-sm text-sm text-gray-400 dark:text-gray-500">
            {users.length === 0
              ? 'There are no registered users yet.'
              : 'Try adjusting your search or role filter.'}
          </p>
        </div>
      )}

      {/* User directory */}
      {!error && visibleUsers.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
              {visibleUsers.length} user{visibleUsers.length === 1 ? '' : 's'}
            </p>
          </div>

          {visibleUsers.map((u) => {
            const isSelf = u._id === currentUser?._id;
            return (
              <div
                key={u._id}
                className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 last:border-0 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={u.name} src={u.avatar} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {u.name}
                      {isSelf && <span className="ml-1.5 text-xs font-normal text-gray-400">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <Badge value={u.role} />

                  <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                    <FiCalendar size={12} />
                    Joined {formatDate(u.createdAt)}
                  </span>

                  <select
                    value={u.role}
                    disabled={isSelf}
                    title={isSelf ? "You can't change your own role" : 'Change role'}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      if (newRole === u.role) return;
                      setPendingChange({ user: u, newRole });
                    }}
                    className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role change confirmation */}
      <ConfirmDialog
        isOpen={Boolean(pendingChange)}
        onClose={() => setPendingChange(null)}
        onConfirm={handleRoleChange}
        title="Change User Role"
        message={
          pendingChange
            ? `Change ${pendingChange.user.name}'s role from ${pendingChange.user.role} to ${pendingChange.newRole}?`
            : ''
        }
        confirmLabel="Change Role"
        variant="primary"
      />
    </div>
  );
};

export default ManageManagers;
