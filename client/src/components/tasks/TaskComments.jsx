import { useState } from 'react';
import { FiSend, FiUser, FiMessageSquare } from 'react-icons/fi';
import taskService from '../../services/taskService';
import Spinner from '../common/Spinner';
import Alert from '../common/Alert';

const formatTimestamp = (dateStr) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Displays a task's comment thread and a box to add a new one.
 * Posts through taskService.addComment and refreshes the local list
 * from the server's response (which is already the full, up-to-date
 * comment array) rather than guessing the new comment's shape.
 */
const TaskComments = ({ taskId, comments, onCommentsChange }) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setError('');
    setIsSubmitting(true);
    try {
      const updatedComments = await taskService.addComment(taskId, trimmed);
      onCommentsChange(updatedComments);
      setText('');
    } catch (err) {
      setError(err.message || 'Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
        <FiMessageSquare size={15} />
        Comments ({comments.length})
      </h3>

      {comments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 py-5 text-center text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
          No comments yet. Be the first to add one.
        </p>
      ) : (
        <ul className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
          {comments.map((c) => (
            <li key={c._id} className="flex gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
                {c.user?.name?.charAt(0).toUpperCase() || <FiUser size={13} />}
              </div>
              <div className="min-w-0 flex-1 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                    {c.user?.name || 'Unknown user'}
                  </p>
                  <p className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                    {formatTimestamp(c.createdAt)}
                  </p>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">
                  {c.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Alert variant="error" message={error} />

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1">
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            maxLength={500}
            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !text.trim()}
          aria-label="Post comment"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
        >
          {isSubmitting ? <Spinner size="sm" className="border-white border-t-transparent" /> : <FiSend size={15} />}
        </button>
      </form>
    </div>
  );
};

export default TaskComments;
