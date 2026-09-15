import React from 'react';
import { Sparkles, ArrowUpRight, type LucideIcon } from 'lucide-react';

interface InsightCardProps {
  title: string;
  description: string;
  category?: string;
  icon?: LucideIcon;
  badge?: string;
  onClick?: () => void;
  className?: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  title,
  description,
  category,
  icon: Icon = Sparkles,
  badge,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-white border border-surface-200/80 shadow-xs hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer group hover:border-primary-300' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0 group-hover:scale-105 transition-transform">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2">
          {category && (
            <span className="text-[11px] font-medium uppercase tracking-wider text-surface-400">
              {category}
            </span>
          )}
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-100 text-primary-800">
              {badge}
            </span>
          )}
          {onClick && (
            <ArrowUpRight className="w-4 h-4 text-surface-400 group-hover:text-primary-600 transition-colors" />
          )}
        </div>
      </div>
      <h4 className="text-base font-semibold text-surface-900 mb-1.5 leading-snug group-hover:text-primary-700 transition-colors">
        {title}
      </h4>
      <p className="text-sm text-surface-600 leading-relaxed line-clamp-3">
        {description}
      </p>
    </div>
  );
};
