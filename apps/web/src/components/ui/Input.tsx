'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-toss-gray-700 mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-3 rounded-toss-sm border transition-all duration-200',
            'bg-white text-toss-gray-900 placeholder-toss-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-30 focus:border-primary',
            error
              ? 'border-down focus:border-down focus:ring-down'
              : 'border-toss-gray-300 hover:border-toss-gray-400',
            'disabled:bg-toss-gray-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-down">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-toss-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
