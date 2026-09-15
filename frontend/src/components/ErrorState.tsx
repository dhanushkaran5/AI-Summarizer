import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  code?: string;
  remedy?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while processing your request.',
  code,
  remedy,
  onRetry,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`p-6 rounded-2xl bg-red-50/80 border border-red-200 text-red-900 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base text-red-950">{title}</h3>
            {code && (
              <span className="text-xs font-mono uppercase px-2 py-0.5 bg-red-100/80 text-red-700 rounded-md font-medium">
                {code}
              </span>
            )}
          </div>
          <p className="text-sm text-red-800 mt-1 leading-relaxed">{message}</p>
          {remedy && (
            <p className="text-xs text-red-700 mt-2 bg-white/60 p-2 rounded-lg border border-red-100">
              💡 <strong>Suggested remedy:</strong> {remedy}
            </p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors focus:ring-2 focus:ring-red-400 focus:outline-none"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
