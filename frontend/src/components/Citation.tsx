import React from 'react';
import { BookOpen } from 'lucide-react';
import type { Source } from '../types';

interface CitationProps {
  source: Source;
  index?: number;
  onClick?: (source: Source) => void;
  className?: string;
}

export const Citation: React.FC<CitationProps> = ({
  source,
  index,
  onClick,
  className = '',
}) => {
  const pageLabel = source.pageNumber ? `P.${source.pageNumber}` : null;
  const sectionLabel = source.section ? source.section : null;
  const displayLabel = [pageLabel, sectionLabel].filter(Boolean).join(' • ') || `Ref ${index !== undefined ? index + 1 : ''}`;

  return (
    <button
      type="button"
      onClick={() => onClick?.(source)}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-400 ${className}`}
      title={source.textPreview}
    >
      <BookOpen className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
      <span>{displayLabel}</span>
      {source.relevanceScore && (
        <span className="text-[10px] text-primary-500 font-mono">
          {Math.round(source.relevanceScore * 100)}%
        </span>
      )}
    </button>
  );
};
