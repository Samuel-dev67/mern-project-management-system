import { forwardRef } from 'react';

const Input = forwardRef(
  ({ label, id, error, type = 'text', className = '', ...rest }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm
            bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            transition-colors duration-150 focus:outline-none focus:ring-2
            focus:ring-primary-500 focus:border-transparent
            ${error ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}
            ${className}`}
          {...rest}
        />
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
