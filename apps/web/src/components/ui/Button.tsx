import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'up' | 'down' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, fullWidth, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary hover:bg-toss-blue-600 text-white',
      secondary: 'bg-toss-gray-100 hover:bg-toss-gray-200 text-toss-gray-700',
      up: 'bg-up hover:opacity-90 text-white',
      down: 'bg-down hover:opacity-90 text-white',
      ghost: 'bg-transparent hover:bg-toss-gray-100 text-toss-gray-700',
      outline: 'bg-transparent border border-toss-gray-300 text-toss-gray-700 hover:bg-toss-gray-50',
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-6 py-4 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-toss-sm font-semibold',
          'transition-all duration-200 active:scale-[0.97]',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-30',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          loading && 'relative text-transparent',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {children}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
