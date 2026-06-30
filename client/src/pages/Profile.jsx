import { useState, useEffect, useCallback } from 'react';
import { FiEdit2, FiLock, FiMail, FiCalendar, FiClock } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';
import Badge from '../components/common/Badge';
import Alert from '../components/common/Alert';
import Button from '../components/common/Button';
import Avatar from '../components/profile/Avatar';
import EditProfileModal from '../components/profile/EditProfileModal';
import ChangePasswordModal from '../components/profile/ChangePasswordModal';

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

const ProfileSkeleton = () => (
  <div className="space-y-6">
    <div>
      <SkeletonBlock className="h-7 w-40" />
      <SkeletonBlock className="mt-2 h-4 w-64" />
    </div>
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-4 w-52" />
          <SkeletonBlock className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <SkeletonBlock className="h-5 w-32" />
      <SkeletonBlock className="mt-4 h-10 w-full" />
    </div>
  </div>
);

// ─── Small presentational pieces ──────────────────────────────────────────────

const MetaRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-2.5">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
      <Icon size={15} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────

const Profile = () => {
  const { user: contextUser, updateUser } = useAuth();

  const [profile, setProfile] = useState(contextUser || null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const freshUser = await authService.getMe();
      setProfile(freshUser);
      updateUser(freshUser);
    } catch (err) {
      setLoadError(err.message || 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
    // updateUser is stable (useCallback in AuthContext); only refetch on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Auto-dismiss success banners after a few seconds so they don't linger.
  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleProfileSaved = (updatedUser) => {
    setProfile(updatedUser);
    updateUser(updatedUser);
    setIsEditOpen(false);
    setSuccessMessage('Profile updated successfully.');
  };

  const handlePasswordChanged = () => {
    setIsPasswordOpen(false);
    setSuccessMessage('Password updated successfully.');
  };

  if (loading) return <ProfileSkeleton />;

  if (loadError && !profile) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <Alert variant="error" message={loadError} />
        <Button onClick={fetchProfile}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your personal information and account security.
        </p>
      </div>

      {successMessage && <Alert variant="success" message={successMessage} />}
      {loadError && profile && <Alert variant="error" message={loadError} />}

      {/* Profile info card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <Avatar name={profile?.name} src={profile?.avatar} size="xl" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {profile?.name || 'Unnamed User'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.email}</p>
              <Badge value={profile?.role} className="mt-2" />
            </div>
          </div>

          <Button onClick={() => setIsEditOpen(true)} className="w-full sm:w-auto">
            <FiEdit2 size={15} />
            Edit Profile
          </Button>
        </div>

        <hr className="my-5 border-gray-100 dark:border-gray-800" />

        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          <MetaRow icon={FiMail} label="Email Address" value={profile?.email || '—'} />
          <MetaRow icon={FiCalendar} label="Account Created" value={formatDate(profile?.createdAt)} />
          <MetaRow icon={FiClock} label="Last Updated" value={formatDate(profile?.updatedAt)} />
        </div>
      </div>

      {/* Account security card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
              <FiLock size={17} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Password</h3>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                Change your password to keep your account secure.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => setIsPasswordOpen(true)}
            className="w-full sm:w-auto"
          >
            Change Password
          </Button>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        user={profile}
        onSaved={handleProfileSaved}
      />

      <ChangePasswordModal
        isOpen={isPasswordOpen}
        onClose={() => setIsPasswordOpen(false)}
        onChanged={handlePasswordChanged}
      />
    </div>
  );
};

export default Profile;
