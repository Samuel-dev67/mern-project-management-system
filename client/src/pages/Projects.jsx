import { useState, useEffect, useCallback, useMemo } from 'react';
import { FiPlus, FiSearch, FiFolder, FiChevronLeft, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import projectService from '../services/projectService';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectFormModal from '../components/projects/ProjectFormModal';
import ConfirmDialog from '../components/projects/ConfirmDialog';

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

const PAGE_SIZE = 9;

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
    <div className="h-5 w-2/3 rounded-lg bg-gray-200 dark:bg-gray-800" />
    <div className="mt-3 h-4 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
    <div className="mt-2 h-4 w-1/2 rounded-lg bg-gray-200 dark:bg-gray-800" />
    <div className="mt-5 h-4 w-1/3 rounded-lg bg-gray-200 dark:bg-gray-800" />
  </div>
);

const Projects = () => {
  const { user } = useAuth();
  const canCreate = user?.role === 'admin' || user?.role === 'manager';

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [formModal, setFormModal] = useState({ open: false, project: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionError, setActionError] = useState('');

  const fetchProjects = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const result = await projectService.getAll(statusFilter ? { status: statusFilter } : {});
      setProjects(result);
    } catch (err) {
      setError(err.message || 'Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Reset to page 1 whenever the active filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    const term = search.trim().toLowerCase();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term)
    );
  }, [projects, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const paginatedProjects = filteredProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const canManageProject = (project) =>
    user?.role === 'admin' || project.createdBy?._id === user?._id;

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleCreate = async (payload) => {
    const created = await projectService.create(payload);
    setProjects((prev) => [created, ...prev]);
  };

  const handleUpdate = async (id, updates) => {
    const updated = await projectService.update(id, updates);
    setProjects((prev) => prev.map((p) => (p._id === id ? updated : p)));
  };

  const handleArchive = async (project) => {
    setActionError('');
    try {
      const updated = await projectService.archive(project._id);
      setProjects((prev) =>
        prev.map((p) => (p._id === project._id ? { ...p, status: updated.status } : p))
      );
    } catch (err) {
      setActionError(err.message || 'Failed to update project status.');
    }
  };

  const handleDelete = async () => {
    await projectService.remove(deleteTarget._id);
    setProjects((prev) => prev.filter((p) => p._id !== deleteTarget._id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Browse, search, and manage all projects you have access to.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchProjects(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-card transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <FiRefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          {canCreate && (
            <Button onClick={() => setFormModal({ open: true, project: null })}>
              <FiPlus size={16} />
              New Project
            </Button>
          )}
        </div>
      </div>

      {actionError && <Alert variant="error" message={actionError} />}

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
            placeholder="Search projects by title or description..."
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 sm:w-48"
        >
          {STATUS_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white py-14 text-center dark:border-gray-800 dark:bg-gray-900">
          <Alert variant="error" message={error} />
          <Button variant="secondary" onClick={() => fetchProjects()}>
            Try Again
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredProjects.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
            <FiFolder size={22} />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {projects.length === 0 ? 'No projects yet' : 'No projects match your search'}
          </p>
          <p className="max-w-sm text-sm text-gray-400 dark:text-gray-500">
            {projects.length === 0
              ? canCreate
                ? 'Create your first project to get your team started.'
                : "You haven't been added to any projects yet."
              : 'Try adjusting your search or filter.'}
          </p>
          {canCreate && projects.length === 0 && (
            <Button onClick={() => setFormModal({ open: true, project: null })} className="mt-1">
              <FiPlus size={16} />
              New Project
            </Button>
          )}
        </div>
      )}

      {/* Project grid */}
      {!loading && !error && paginatedProjects.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedProjects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                canManage={canManageProject(project)}
                onEdit={(p) => setFormModal({ open: true, project: p })}
                onDelete={(p) => setDeleteTarget(p)}
                onArchive={handleArchive}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Page {page} of {totalPages} · {filteredProjects.length} project
                {filteredProjects.length === 1 ? '' : 's'}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <FiChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create / Edit modal */}
      <ProjectFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, project: null })}
        project={formModal.project}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will also delete all of its tasks. This action cannot be undone.`}
        confirmLabel="Delete Project"
      />
    </div>
  );
};

export default Projects;
