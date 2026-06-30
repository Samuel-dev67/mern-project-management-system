import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit2,
  FiArchive,
  FiRotateCcw,
  FiTrash2,
  FiCalendar,
  FiUsers,
  FiCheckSquare,
  FiUser,
  FiTrello,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import projectService from '../services/projectService';
import Badge from '../components/common/Badge';
import Alert from '../components/common/Alert';
import Button from '../components/common/Button';
import ProjectFormModal from '../components/projects/ProjectFormModal';
import ConfirmDialog from '../components/projects/ConfirmDialog';
import MemberManager from '../components/projects/MemberManager';

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const DetailSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 w-64 rounded-lg bg-gray-200 dark:bg-gray-800" />
    <div className="h-40 w-full rounded-2xl bg-gray-200 dark:bg-gray-800" />
    <div className="h-56 w-full rounded-2xl bg-gray-200 dark:bg-gray-800" />
  </div>
);

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveError, setArchiveError] = useState('');

  const fetchProject = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await projectService.getById(id);
      setProject(result);
    } catch (err) {
      setError(err.message || 'Failed to load project. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  if (loading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white py-14 text-center dark:border-gray-800 dark:bg-gray-900">
        <Alert variant="error" message={error} />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchProject}>
            Try Again
          </Button>
          <Button variant="ghost" onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const canManage = user?.role === 'admin' || project.createdBy?._id === user?._id;

  const handleUpdate = async (projectId, updates) => {
    const updated = await projectService.update(projectId, updates);
    setProject(updated);
  };

  const handleArchiveToggle = async () => {
    setArchiveError('');
    try {
      const updated = await projectService.archive(project._id);
      setProject((prev) => ({ ...prev, status: updated.status }));
    } catch (err) {
      setArchiveError(err.message || 'Failed to update project status.');
    }
  };

  const handleDelete = async () => {
    await projectService.remove(project._id);
    navigate('/projects', { replace: true });
  };

  const handleMembersChange = (updatedMembers) => {
    setProject((prev) => ({ ...prev, members: updatedMembers }));
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <FiArrowLeft size={15} />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="truncate text-2xl font-bold text-gray-900 dark:text-white">
              {project.title}
            </h1>
            <Badge value={project.status} />
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            {project.description || 'No description provided.'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate(`/projects/${project._id}/tasks`)}>
            <FiTrello size={14} />
            Task Board
          </Button>
          {canManage && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                <FiEdit2 size={14} />
                Edit
              </Button>
              <Button variant="secondary" size="sm" onClick={handleArchiveToggle}>
                {project.status === 'archived' ? <FiRotateCcw size={14} /> : <FiArchive size={14} />}
                {project.status === 'archived' ? 'Restore' : 'Archive'}
              </Button>
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                <FiTrash2 size={14} />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {archiveError && <Alert variant="error" message={archiveError} />}

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
            <FiUsers size={15} />
            <span className="text-xs font-medium uppercase tracking-wide">Members</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-gray-900 dark:text-white">
            {project.members?.length ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
            <FiCheckSquare size={15} />
            <span className="text-xs font-medium uppercase tracking-wide">Status</span>
          </div>
          <p className="mt-2">
            <Badge value={project.status} />
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
            <FiCalendar size={15} />
            <span className="text-xs font-medium uppercase tracking-wide">Created</span>
          </div>
          <p className="mt-1.5 text-sm font-medium text-gray-900 dark:text-white">
            {formatDate(project.createdAt)}
          </p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            Updated {formatDate(project.updatedAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Owner & info */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Owner</h2>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
              {project.createdBy?.name?.charAt(0).toUpperCase() || <FiUser size={16} />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {project.createdBy?.name || 'Unknown'}
              </p>
              <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                {project.createdBy?.email}
              </p>
            </div>
            {project.createdBy?.role && <Badge value={project.createdBy.role} className="ml-auto" />}
          </div>
        </div>

        {/* Member management */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Members ({project.members?.length ?? 0})
            </h2>
          </div>
          <div className="px-5 py-4">
            {canManage ? (
              <MemberManager
                projectId={project._id}
                members={project.members || []}
                onMembersChange={handleMembersChange}
              />
            ) : project.members?.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {project.members.map((m) => (
                  <li key={m._id} className="flex items-center gap-2.5 py-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
                      {m.name?.charAt(0).toUpperCase() || <FiUser size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{m.email}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
                No members on this project yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <ProjectFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        project={project}
        onUpdate={handleUpdate}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.title}"? This will also delete all of its tasks. This action cannot be undone.`}
        confirmLabel="Delete Project"
      />
    </div>
  );
};

export default ProjectDetails;
