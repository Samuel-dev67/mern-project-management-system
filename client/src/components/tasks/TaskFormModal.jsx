import { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const emptyForm = { title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '', status: 'todo' };

const toDateInputValue = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

/**
 * Single modal that handles both creating a new task and editing an
 * existing one, mirroring the create/edit pattern used by
 * ProjectFormModal. `task` being null/undefined means "create" mode.
 */
const TaskFormModal = ({ isOpen, onClose, task, project, defaultStatus = 'todo', onCreate, onUpdate }) => {
  const isEditMode = Boolean(task);

  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assignable users are limited to the project's owner + members, since
  // the server rejects assigning a task to anyone outside the project.
  const assignableUsers = useMemo(() => {
    if (!project) return [];
    const owner = project.createdBy ? [project.createdBy] : [];
    const members = project.members || [];
    const seen = new Set();
    return [...owner, ...members].filter((u) => {
      if (!u || seen.has(u._id)) return false;
      seen.add(u._id);
      return true;
    });
  }, [project]);

  useEffect(() => {
    if (!isOpen) return;

    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        assignedTo: task.assignedTo?._id || '',
        dueDate: toDateInputValue(task.dueDate),
        status: task.status || 'todo',
      });
    } else {
      setForm({ ...emptyForm, status: defaultStatus });
    }
    setFieldErrors({});
    setApiError('');
  }, [isOpen, task, defaultStatus]);

  const validate = () => {
    const errors = {};

    if (!form.title.trim()) {
      errors.title = 'Title is required';
    } else if (form.title.trim().length > 150) {
      errors.title = 'Title cannot exceed 150 characters';
    }

    if (form.description.trim().length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters';
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      assignedTo: form.assignedTo || null,
      dueDate: form.dueDate || null,
    };

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await onUpdate(task._id, { ...payload, status: form.status });
      } else {
        await onCreate(payload);
      }
      onClose();
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Task' : 'Create Task'}
      size="lg"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" isLoading={isSubmitting}>
            {isEditMode ? 'Save Changes' : 'Create Task'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Alert variant="error" message={apiError} />

        <Input
          id="title"
          name="title"
          label="Task title"
          placeholder="Design landing page hero"
          value={form.title}
          onChange={handleChange}
          error={fieldErrors.title}
        />

        <div className="w-full">
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="What needs to be done?"
            value={form.description}
            onChange={handleChange}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm
              bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              transition-colors duration-150 focus:outline-none focus:ring-2
              focus:ring-primary-500 focus:border-transparent
              ${fieldErrors.description ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
          />
          {fieldErrors.description && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.description}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="w-full">
            <label htmlFor="priority" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            label="Due date"
            value={form.dueDate}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="w-full">
            <label htmlFor="assignedTo" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Assignee
            </label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={form.assignedTo}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">Unassigned</option>
              {assignableUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {isEditMode && (
            <div className="w-full">
              <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default TaskFormModal;
