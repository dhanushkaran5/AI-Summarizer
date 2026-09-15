import React from 'react';
import { GitCompare, CheckCircle2 } from 'lucide-react';

export interface ComparisonData {
  docAName: string;
  docBName: string;
  overview?: string;
  similarities?: string[];
  differences?: Array<{ feature: string; docA: string; docB: string }>;
  methodologyComparison?: { docA: string; docB: string };
  conclusionComparison?: { docA: string; docB: string };
}

interface ComparisonViewProps {
  data: ComparisonData;
  className?: string;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  data,
  className = '',
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-primary-50/60 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-900/60 transition-all">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300 block mb-1">
            Document A (Base)
          </span>
          <h3 className="font-semibold text-base text-surface-900 dark:text-surface-100 truncate">{data.docAName}</h3>
        </div>
        <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 transition-all">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block mb-1">
            Document B (Target)
          </span>
          <h3 className="font-semibold text-base text-surface-900 dark:text-surface-100 truncate">{data.docBName}</h3>
        </div>
      </div>

      {/* Overview */}
      {data.overview && (
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-xs">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-2">
            Comparative Synthesis
          </h4>
          <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">{data.overview}</p>
        </div>
      )}

      {/* Structured Differences Table */}
      {data.differences && data.differences.length > 0 && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-xs overflow-hidden">
          <div className="p-4 bg-surface-50 dark:bg-surface-800/60 border-b border-surface-200 dark:border-surface-800">
            <h4 className="font-semibold text-sm text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-primary-600" />
              Key Differences Matrix
            </h4>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-surface-800 text-xs">
            {data.differences.map((diff, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-3 p-4 gap-3 items-start hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                <div className="font-semibold text-surface-800 dark:text-surface-200 text-xs uppercase tracking-wide pt-1">
                  {diff.feature}
                </div>
                <div className="text-surface-700 dark:text-surface-300 p-3 rounded-xl bg-primary-50/40 dark:bg-primary-950/30 border border-primary-100/60 dark:border-primary-900/40 leading-relaxed">
                  <span className="font-semibold text-primary-800 dark:text-primary-300 block text-[10px] uppercase mb-1">{data.docAName}:</span>
                  {diff.docA}
                </div>
                <div className="text-surface-700 dark:text-surface-300 p-3 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-100/60 dark:border-indigo-900/40 leading-relaxed">
                  <span className="font-semibold text-indigo-800 dark:text-indigo-300 block text-[10px] uppercase mb-1">{data.docBName}:</span>
                  {diff.docB}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Similarities List */}
      {data.similarities && data.similarities.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-xs">
          <h4 className="font-semibold text-sm text-surface-900 dark:text-surface-100 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Common Ground & Similarities
          </h4>
          <ul className="space-y-2 text-xs text-surface-700 dark:text-surface-300">
            {data.similarities.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
