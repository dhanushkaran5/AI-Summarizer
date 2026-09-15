import React from 'react';
import { Tag } from 'lucide-react';

interface KeywordListProps {
  keywords?: string[];
  title?: string;
  onKeywordClick?: (keyword: string) => void;
  className?: string;
}

export const KeywordList: React.FC<KeywordListProps> = ({
  keywords = [],
  title = 'Extracted Keywords & Entities',
  onKeywordClick,
  className = '',
}) => {
  if (!keywords || keywords.length === 0) return null;

  return (
    <div className={`p-4 rounded-xl bg-white border border-surface-200/80 shadow-xs ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-4 h-4 text-primary-600" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-600">{title}</h4>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {keywords.map((kw, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onKeywordClick?.(kw)}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-surface-100 hover:bg-primary-50 text-surface-700 hover:text-primary-700 border border-surface-200 hover:border-primary-200 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-400"
          >
            {kw}
          </button>
        ))}
      </div>
    </div>
  );
};
