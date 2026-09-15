import React from 'react';
import { FileText, AlignLeft, Hash, Clock, Layers, Cpu } from 'lucide-react';
import type { DocumentAnalytics, DocumentIntelligence } from '../types';

interface AnalyticsPanelProps {
  analytics?: DocumentAnalytics | DocumentIntelligence | null;
  className?: string;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  analytics,
  className = '',
}) => {
  if (!analytics) return null;

  const readingTime = 'estimatedReadingTimeMinutes' in analytics
    ? analytics.estimatedReadingTimeMinutes
    : Math.ceil(analytics.readingTimeMinutes || 1);

  const characterCount = 'characterCount' in analytics
    ? analytics.characterCount
    : analytics.charCount || 0;

  const stats = [
    {
      label: 'Total Pages',
      value: analytics.pageCount ?? 1,
      icon: FileText,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      label: 'Word Count',
      value: Number(analytics.wordCount || 0).toLocaleString(),
      icon: AlignLeft,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      label: 'Characters',
      value: Number(characterCount).toLocaleString(),
      icon: Hash,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      label: 'Est. Reading Time',
      value: `${readingTime} min`,
      icon: Clock,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      label: 'Document Sections',
      value: analytics.sectionCount ?? 1,
      icon: Layers,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      label: 'Indexed Chunks',
      value: analytics.chunkCount ?? 0,
      icon: Cpu,
      color: 'text-teal-600 bg-teal-50 border-teal-100',
    },
  ];

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 ${className}`}>
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="p-4 rounded-xl bg-white border border-surface-200/80 shadow-xs hover:shadow-sm transition-all"
          >
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-2.5 ${item.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold text-surface-900 tracking-tight">{item.value}</div>
            <div className="text-xs text-surface-500 font-medium mt-0.5">{item.label}</div>
          </div>
        );
      })}
    </div>
  );
};
