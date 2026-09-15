import React from 'react';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import type { DocumentStatus } from '../types';

interface ProcessingStatusProps {
  status: DocumentStatus;
  progressPercent?: number;
  stageDescription?: string;
  errorMessage?: string;
  className?: string;
}

const STAGES: { key: DocumentStatus; label: string }[] = [
  { key: 'UPLOADING', label: 'Upload' },
  { key: 'VALIDATING', label: 'Validate' },
  { key: 'EXTRACTING', label: 'Extract' },
  { key: 'CHUNKING', label: 'Chunk' },
  { key: 'EMBEDDING', label: 'Embed' },
  { key: 'INDEXING', label: 'Index' },
  { key: 'ANALYZING', label: 'Analyze' },
  { key: 'COMPLETED', label: 'Ready' },
];

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  status,
  progressPercent = 0,
  stageDescription,
  errorMessage,
  className = '',
}) => {
  const currentIndex = STAGES.findIndex((s) => s.key === status);
  const isFailed = status === 'FAILED';

  return (
    <div className={`p-5 rounded-2xl bg-white border border-surface-200 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isFailed ? (
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          ) : status === 'COMPLETED' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
          )}
          <span className="text-sm font-semibold text-surface-900">
            {isFailed ? 'Processing Failed' : status === 'COMPLETED' ? 'Document Intelligence Ready' : 'Processing Document...'}
          </span>
        </div>
        <span className="text-xs font-mono font-medium text-surface-500">
          {isFailed ? 'Error' : `${progressPercent}%`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-100 rounded-full h-2.5 overflow-hidden mb-4">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
            isFailed
              ? 'bg-rose-500'
              : status === 'COMPLETED'
              ? 'bg-emerald-500'
              : 'bg-primary-600'
          }`}
          style={{ width: `${Math.min(100, Math.max(isFailed ? 100 : 5, progressPercent))}%` }}
        />
      </div>

      {/* Stages Step Indicators */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
        {STAGES.map((s, idx) => {
          const isDone = currentIndex > idx || status === 'COMPLETED';
          const isCurrent = currentIndex === idx && !isFailed;
          return (
            <div key={s.key} className="flex flex-col items-center text-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-100 text-emerald-700'
                    : isCurrent
                    ? 'bg-primary-600 text-white animate-pulse'
                    : 'bg-surface-100 text-surface-400'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <span
                className={`text-[10px] mt-1 truncate max-w-full ${
                  isCurrent ? 'font-semibold text-primary-700' : 'text-surface-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {stageDescription && !isFailed && (
        <p className="text-xs text-surface-500 mt-3.5 pt-3 border-t border-surface-100 text-center">
          {stageDescription}
        </p>
      )}

      {errorMessage && (
        <p className="text-xs text-rose-600 mt-3.5 pt-3 border-t border-rose-100 text-center font-medium">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
