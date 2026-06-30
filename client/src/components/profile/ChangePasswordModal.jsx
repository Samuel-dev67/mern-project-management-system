import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Alert from '../common/Alert';
import authService from '../../services/authService';

const emptyForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

// Mirrors server/validators/authValidators.js -> updatePasswordValidator,
// the only password rule the backend actually enforces (min 6 chars).
const MIN_LENGTH = 6;

const getStrength = (password) => {
  if (!password) return { label: '', barClassName: '', textClassName: '' };

  let score = 0;
  if (password.length >= MIN_LENGTH) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { label: 'Weak', barClassName: 'w-1/3 bg-red-500', textClassName: 'text-red-600 dark:text-red-400' };
  }
  if (score <= 3) {
    return { label: 'Okay', barClassName: 'w-2/3 bg-amber-500', textClassName: 'text-amber-600 dark:text-amber-400' };
  }
  return { label: 'Strong', barClassName: 'w-full bg-emerald-500', textClassName: 'text-emerald-600 dark:text-emerald-400' };
};

/**
 * Change Password modal, wired to the existing
 * PUT /auth/update-password endpoint. The backend responds with a
 * fresh JWT, which we adopt to stay in sync with what the server
 * just issued.
 */
const ChangePasswordModal = ({ isOpen, onClose, onChanged }) => {
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibility, setVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const resetForm = () => {
    setForm(emptyForm);
    setFieldErrors({});
    setApiError('');
    setVisibility({ currentPassword: false, newPassword: false, confirmPassword: false });
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const validate = () => {
    const errors = {};

    if (!form.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!form.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (form.newPassword.length < MIN_LENGTH) {
      errors.newPassword = `New password must be at least ${MIN_LENGTH} characters`;
    } else if (form.newPassword === form.currentPassword) {
      errors.newPassword = 'New password must be different from the current password';
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (form.confirmPassword !== form.newPassword) {
      errors.confirmPassword = 'Passwords do not match';
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

  const toggleVisibility = (field) => {
    setVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
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
      const { token } = await authService.updatePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      // Adopt the freshly issued token, the same way AuthContext
      // stores it after login — done directly here rather than
      // touching AuthContext itself, since the auth flow is out of
      // scope for this module.
      if (token) {
        localStorage.setItem('token', token);
      }

      resetForm();
      onChanged();
    } catch (err) {
      setApiError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const strength = getStrength(form.newPassword);

  const renderPasswordField = (name, label) => (
    <div className="w-full">
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visibility[name] ? 'text' : 'password'}
          autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
          value={form[name]}
          onChange={handleChange}
          className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-sm
            bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            transition-colors duration-150 focus:outline-none focus:ring-2
            focus:ring-primary-500 focus:border-transparent
            ${fieldErrors[name] ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
        />
        <button
          type="button"
          onClick={() => toggleVisibility(name)}
          tabIndex={-1}
          aria-label={visibility[name] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          {visibility[name] ? <FiEyeOff size={16} /> : <FiEye size={16} />}
        </button>
      </div>
      {fieldErrors[name] && <p className="mt-1.5 text-sm text-red-500">{fieldErrors[name]}</p>}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Password"
      size="md"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="change-password-form" isLoading={isSubmitting}>
            Update Password
          </Button>
        </>
      }
    >
      <form id="change-password-form" onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Alert variant="error" message={apiError} />

        {renderPasswordField('currentPassword', 'Current Password')}
        {renderPasswordField('newPassword', 'New Password')}

        {form.newPassword && (
          <div className="-mt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${strength.barClassName}`} />
            </div>
            <p className={`mt-1 text-xs font-medium ${strength.textClassName}`}>{strength.label} password</p>
          </div>
        )}

        {renderPasswordField('confirmPassword', 'Confirm New Password')}

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Password must be at least {MIN_LENGTH} characters long.
        </p>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
