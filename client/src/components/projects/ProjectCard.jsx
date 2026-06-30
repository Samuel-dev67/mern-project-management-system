import { Link } from 'react-router-dom';
import { FiUsers, FiCalendar, FiEdit2, FiTrash2, FiArchive, FiRotateCcw } from 'react-icons/fi';
import Badge from '../common/Badge';

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

/**
 * Single project card for the list/grid view. Management actions
 * (edit/archive/delete) are only rendered when `canManage` is true,
 * mirroring the server's owner-or-admin authorization rule.
 */
const ProjectCard = ({ project, canManage, onEdit, onDelete, onArchive }) => {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-card transition hover:shadow-card-hover dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/projects/${project._id}`}
          className="min-w-0 flex-1 truncate text-base font-semibold text-gray-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
        >
          {project.title}
        </Link>
        <Badge value={project.status} />
      </div>

      <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-gray-500 dark:text-gray-400">
        {project.description || 'No description provided.'}
      </p>

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1.5">
          <FiUsers size={13} />
          {project.members?.length ?? 0} member{project.members?.length === 1 ? '' : 's'}
        </span>
        <span className="flex items-center gap-1.5">
          <FiCalendar size={13} />
          {formatDate(project.createdAt)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
          {project.createdBy?.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <span className="truncate">Owned by {project.createdBy?.name || 'Unknown'}</span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
        <Link
          to={`/projects/${project._id}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          View details
        </Link>

        {canManage && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(project)}
              aria-label="Edit project"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <FiEdit2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => onArchive(project)}
              aria-label={project.status === 'archived' ? 'Restore project' : 'Archive project'}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              {project.status === 'archived' ? <FiRotateCcw size={15} /> : <FiArchive size={15} />}
            </button>
            <button
              type="button"
              onClick={() => onDelete(project)}
              aria-label="Delete project"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <FiTrash2 size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
