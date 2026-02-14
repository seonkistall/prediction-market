'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-toss-gray-700 mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full px-4 py-3 pr-10 rounded-toss-sm border transition-all duration-200 appearance-none',
              'bg-white text-toss-gray-900',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-30 focus:border-primary',
              error
                ? 'border-down focus:border-down focus:ring-down'
                : 'border-toss-gray-300 hover:border-toss-gray-400',
              'disabled:bg-toss-gray-50 disabled:cursor-not-allowed',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-toss-gray-400 pointer-events-none" />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-down">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
