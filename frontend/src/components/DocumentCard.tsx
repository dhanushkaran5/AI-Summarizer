import React from 'react';
import { Calendar, Layers, Trash2, ArrowRight, BookOpen, AlertTriangle } from 'lucide-react';
import type { Document } from '../types';

interface DocumentCardProps {
  document: Document;
  onSelect: (doc: Document) => void;
  onDelete?: (docId: number) => void;
  className?: string;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onSelect,
  onDelete,
  className = '',
}) => {
  const getFileBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'docx': case 'doc': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pptx': case 'ppt': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'txt': case 'md': return 'bg-surface-100 text-surface-700 border-surface-200';
      default: return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Ready</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Failed</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-50 text-primary-700 border border-primary-200 animate-pulse">Processing</span>;
    }
  };

  const formattedDate = new Date(document.uploadedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={() => onSelect(document)}
      className={`p-5 rounded-2xl bg-white border border-surface-200/90 shadow-xs hover:shadow-md hover:border-primary-300 transition-all cursor-pointer group flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase border ${getFileBadgeColor(document.fileType)}`}>
              {document.fileType}
            </span>
            {getStatusBadge(document.status)}
          </div>
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete ${document.originalName}?`)) {
                  onDelete(document.id);
                }
              }}
              className="p-1.5 rounded-lg text-surface-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
              title="Delete Document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <h3 className="font-semibold text-base text-surface-900 mb-2 truncate group-hover:text-primary-700 transition-colors" title={document.originalName}>
          {document.originalName}
        </h3>

        <div className="flex items-center gap-4 text-xs text-surface-500 mb-4">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            {document.pageCount || 1} {document.pageCount === 1 ? 'page' : 'pages'}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-surface-100 flex items-center justify-between text-xs font-medium text-primary-600 group-hover:text-primary-700">
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          Inspect Intelligence
        </span>
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};
