import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';
import Avatar from './Avatar';
import authService from '../../services/authService';

// Loose http(s) URL check. Intentionally permissive — the backend
// just stores whatever string is sent (`avatar` is a free-form String
// field on the User schema), so this is purely a friendly nudge, not
// a hard contract.
const isLikelyUrl = (value) => /^https?:\/\/.+\..+/i.test(value.trim());

/**
 * Edit Profile modal. Name and avatar map directly to the existing
 * PUT /auth/update-profile endpoint (server/controllers/authController.js).
 * Email is intentionally read-only here: the backend has no endpoint
 * to change it (update-profile only accepts name/avatar), and adding
 * one would mean touching auth/backend contracts, which is out of
 * scope for this module.
 */
const EditProfileModal = ({ isOpen, onClose, user, onSaved }) => {
  const [form, setForm] = useState({ name: '', avatar: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      name: user?.name || '',
      avatar: user?.avatar || '',
    });
    setFieldErrors({});
    setApiError('');
  }, [isOpen, user]);

  const validate = () => {
    const errors = {};

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      errors.name = 'Name is required';
    } else if (trimmedName.length > 50) {
      errors.name = 'Name cannot exceed 50 characters';
    }

    const trimmedAvatar = form.avatar.trim();
    if (trimmedAvatar && !isLikelyUrl(trimmedAvatar)) {
      errors.avatar = 'Enter a valid image URL (starting with http:// or https://)';
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

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
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
      const updatedUser = await authService.updateProfile({
        name: form.name.trim(),
        avatar: form.avatar.trim(),
      });
      onSaved(updatedUser);
    } catch (err) {
      setApiError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Profile"
      size="md"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="edit-profile-form" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </>
      }
    >
      <form id="edit-profile-form" onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Alert variant="error" message={apiError} />

        <div className="flex items-center gap-4">
          <Avatar name={form.name} src={form.avatar.trim()} size="lg" />
          <div className="flex-1">
            <Input
              id="avatar"
              name="avatar"
              label="Avatar URL"
              placeholder="https://example.com/photo.jpg"
              value={form.avatar}
              onChange={handleChange}
              error={fieldErrors.avatar}
            />
          </div>
        </div>

        <Input
          id="name"
          name="name"
          label="Full Name"
          placeholder="Jane Doe"
          value={form.name}
          onChange={handleChange}
          error={fieldErrors.name}
        />

        <div className="w-full">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-2.5 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400"
          />
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            Email cannot be changed from here.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default EditProfileModal;
