import React from 'react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading document intelligence...',
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-12 text-center ${className}`}
    >
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-primary-200 animate-ping opacity-30" />
        <div className="w-12 h-12 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
      </div>
      <p className="text-surface-600 font-medium text-sm animate-pulse">{message}</p>
      <span className="sr-only">Loading</span>
    </div>
  );
};
