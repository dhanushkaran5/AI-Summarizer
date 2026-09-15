import React from 'react';
import { Folder, FileText, ArrowRight, Trash2 } from 'lucide-react';
import type { Collection } from '../types';

interface CollectionCardProps {
  collection: Collection;
  onSelect: (collection: Collection) => void;
  onDelete?: (id: number) => void;
  className?: string;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  onSelect,
  onDelete,
  className = '',
}) => {
  return (
    <div
      onClick={() => onSelect(collection)}
      className={`p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-xs hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all cursor-pointer group flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-900/60 group-hover:scale-105 transition-transform">
            <Folder className="w-5 h-5" />
          </div>
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete collection "${collection.name}"?`)) {
                  onDelete(collection.id);
                }
              }}
              className="p-1.5 rounded-lg text-surface-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-all"
              title="Delete Collection"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <h3 className="font-semibold text-base text-surface-900 dark:text-surface-100 mb-1.5 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {collection.name}
        </h3>

        <p className="text-xs text-surface-500 dark:text-surface-400 mb-4 line-clamp-2 leading-relaxed">
          {collection.description || 'No description provided.'}
        </p>
      </div>

      <div className="pt-3 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
        <span className="flex items-center gap-1.5 font-medium">
          <FileText className="w-3.5 h-3.5 text-primary-500" />
          {collection.documentCount || 0} {collection.documentCount === 1 ? 'document' : 'documents'}
        </span>
        <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold group-hover:translate-x-0.5 transition-transform">
          Explore <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
