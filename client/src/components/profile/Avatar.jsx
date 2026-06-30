import { useState, useEffect } from 'react';
import { FiUser } from 'react-icons/fi';

// Same sizing scale used by the rest of the app's rounded-xl/2xl
// components — keeps the avatar visually consistent whether it shows
// up small (forms) or large (profile header).
const SIZE_CLASSES = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-14 w-14 text-base',
  lg: 'h-20 w-20 text-xl',
  xl: 'h-24 w-24 text-2xl sm:h-28 sm:w-28 sm:text-3xl',
};

const ICON_SIZE = {
  sm: 14,
  md: 20,
  lg: 28,
  xl: 32,
};

const getInitials = (name) =>
  name
    ?.split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/**
 * Shows the user's avatar image when one is set and loads successfully;
 * falls back to initials (or a generic user icon if no name is known
 * yet) otherwise. Mirrors the same initials logic already used in
 * Navbar, just extracted so the Profile module can reuse it too.
 */
const Avatar = ({ name, src, size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);

  // If the avatar URL changes (e.g. live preview while editing),
  // give the new URL a fresh chance to load instead of sticking with
  // a previous failure.
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const sizeClasses = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const initials = getInitials(name);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s avatar` : 'User avatar'}
        onError={() => setImgError(true)}
        className={`${sizeClasses} shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-gray-900 ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClasses} shrink-0 items-center justify-center rounded-full bg-primary-600 font-semibold text-white ring-2 ring-white dark:ring-gray-900 ${className}`}
    >
      {initials || <FiUser size={ICON_SIZE[size] || 18} />}
    </div>
  );
};

export default Avatar;
