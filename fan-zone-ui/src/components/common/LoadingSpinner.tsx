import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', color = 'text-green-500' }) => {
  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} ${color} animate-spin rounded-full border-2 border-current border-t-transparent`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
};
