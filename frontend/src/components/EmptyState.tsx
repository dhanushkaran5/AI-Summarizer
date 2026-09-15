import React from 'react';
import { FileQuestion, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FileQuestion,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-surface-200 bg-surface-50/50 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 mb-4 shadow-sm">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold text-surface-900 mb-1.5">{title}</h3>
      <p className="text-sm text-surface-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all focus:ring-2 focus:ring-primary-500 focus:outline-none"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
