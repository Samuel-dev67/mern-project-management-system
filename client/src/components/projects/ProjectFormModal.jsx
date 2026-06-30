import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';
import MemberPicker from './MemberPicker';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

const emptyForm = { title: '', description: '', status: 'active' };

/**
 * Single modal that handles both creating a new project and editing
 * an existing one. `project` being null/undefined means "create" mode;
 * passing a project pre-fills the form for "edit" mode.
 */
const ProjectFormModal = ({ isOpen, onClose, project, onCreate, onUpdate }) => {
  const isEditMode = Boolean(project);

  const [form, setForm] = useState(emptyForm);
  const [members, setMembers] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset/pre-fill the form whenever the modal opens or the target
  // project changes, so stale state from a previous open doesn't leak in.
  useEffect(() => {
    if (!isOpen) return;

    if (project) {
      setForm({
        title: project.title || '',
        description: project.description || '',
        status: project.status || 'active',
      });
    } else {
      setForm(emptyForm);
      setMembers([]);
    }
    setFieldErrors({});
    setApiError('');
  }, [isOpen, project]);

  const validate = () => {
    const errors = {};

    if (!form.title.trim()) {
      errors.title = 'Title is required';
    } else if (form.title.trim().length > 100) {
      errors.title = 'Title cannot exceed 100 characters';
    }

    if (form.description.trim().length > 1000) {
      errors.description = 'Description cannot exceed 1000 characters';
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

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await onUpdate(project._id, {
          title: form.title.trim(),
          description: form.description.trim(),
          status: form.status,
        });
      } else {
        await onCreate({
          title: form.title.trim(),
          description: form.description.trim(),
          members: members.map((m) => m._id),
        });
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
      title={isEditMode ? 'Edit Project' : 'Create Project'}
      size="lg"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" isLoading={isSubmitting}>
            {isEditMode ? 'Save Changes' : 'Create Project'}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Alert variant="error" message={apiError} />

        <Input
          id="title"
          name="title"
          label="Project title"
          placeholder="Website Redesign"
          value={form.title}
          onChange={handleChange}
          error={fieldErrors.title}
        />

        <div className="w-full">
          <label
            htmlFor="description"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="What is this project about?"
            value={form.description}
            onChange={handleChange}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm
              bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              transition-colors duration-150 focus:outline-none focus:ring-2
              focus:ring-primary-500 focus:border-transparent
              ${fieldErrors.description ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
          />
          {fieldErrors.description && (
            <p className="mt-1.5 text-sm text-red-500">{fieldErrors.description}</p>
          )}
        </div>

        {isEditMode ? (
          <div className="w-full">
            <label
              htmlFor="status"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
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
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              Member management is available from the project details page.
            </p>
          </div>
        ) : (
          <MemberPicker selected={members} onChange={setMembers} />
        )}
      </form>
    </Modal>
  );
};

export default ProjectFormModal;
