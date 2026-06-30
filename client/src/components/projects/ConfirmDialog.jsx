import { useState } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Alert from '../common/Alert';

/**
 * Generic "are you sure?" dialog. Used by the project list/details
 * pages before any destructive action (currently: delete project).
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" variant={variant} onClick={handleConfirm} isLoading={isSubmitting}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
            <FiAlertTriangle size={18} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
        </div>
        <Alert variant="error" message={error} />
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
