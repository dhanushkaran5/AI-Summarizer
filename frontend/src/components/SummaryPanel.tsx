import React, { useState } from 'react';
import { Copy, CheckCircle, RefreshCw } from 'lucide-react';
import type { MultiLevelSummary, SummaryMode } from '../types';

interface SummaryPanelProps {
  summary: MultiLevelSummary | null;
  currentMode: SummaryMode;
  currentLevel: number;
  isLoading?: boolean;
  onModeChange: (mode: SummaryMode) => void;
  onLevelChange: (level: number) => void;
  onRegenerate: () => void;
  className?: string;
}

const MODES: { id: SummaryMode; label: string; desc: string }[] = [
  { id: 'executive', label: 'Executive', desc: 'Bottom-line impact, risks, ROI' },
  { id: 'student', label: 'Student', desc: 'Core concepts, definitions, takeaways' },
  { id: 'research', label: 'Research', desc: 'Methodology, findings, limitations' },
  { id: 'technical', label: 'Technical', desc: 'Architecture, algorithms, specs' },
  { id: 'beginner', label: 'Beginner (ELI5)', desc: 'Simple analogies, jargon-free' },
  { id: 'meeting', label: 'Meeting', desc: 'Action items, decisions, owners' },
  { id: 'exam', label: 'Exam Prep', desc: 'High-yield points, formulas' },
  { id: 'legal_policy', label: 'Legal & Policy', desc: 'Rights, obligations, compliance' },
  { id: 'custom', label: 'Custom', desc: 'Holistic multi-perspective' },
];

const DEPTH_LEVELS = [
  { level: 0, label: 'L0: Essence', desc: 'One-sentence thesis' },
  { level: 1, label: 'L1: Executive', desc: 'Bulleted overview' },
  { level: 2, label: 'L2: Structured', desc: 'Categorized breakdown' },
  { level: 3, label: 'L3: Sections', desc: 'Section-by-section' },
  { level: 4, label: 'L4: Deep Tech', desc: 'Algorithmic analysis' },
  { level: 5, label: 'L5: Q&A Base', desc: 'Self-contained Q&A' },
];

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  summary,
  currentMode,
  currentLevel,
  isLoading = false,
  onModeChange,
  onLevelChange,
  onRegenerate,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Configuration Header: Audience Mode & Depth Level */}
      <div className="p-6 rounded-2xl bg-white border border-surface-200/80 shadow-xs space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 mb-2.5">
            1. Select Audience Lens (9 Modes)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onModeChange(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentMode === m.id
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-surface-100 hover:bg-surface-200 text-surface-700'
                }`}
                title={m.desc}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 mb-2.5">
            2. Select Depth Level (L0 – L5)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {DEPTH_LEVELS.map((dl) => (
              <button
                key={dl.level}
                type="button"
                onClick={() => onLevelChange(dl.level)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  currentLevel === dl.level
                    ? 'border-primary-500 bg-primary-50/60 ring-2 ring-primary-400/30'
                    : 'border-surface-200 hover:border-surface-300 bg-surface-50/50'
                }`}
              >
                <div className={`text-xs font-bold ${currentLevel === dl.level ? 'text-primary-700' : 'text-surface-800'}`}>
                  {dl.label}
                </div>
                <div className="text-[10px] text-surface-500 truncate mt-0.5">{dl.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isLoading}
            className="btn-secondary inline-flex items-center gap-2 text-xs py-2 px-3.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate Summary
          </button>
        </div>
      </div>

      {/* Summary Content Body */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-surface-200">
          <div className="w-8 h-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-surface-600 font-medium">Generating Level {currentLevel} summary...</p>
        </div>
      ) : summary ? (
        <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-xs relative">
          <button
            onClick={() => {
              const text = currentLevel === 0 ? summary.level0
                : currentLevel === 1 ? summary.level1
                : currentLevel === 2 ? Object.entries(summary.level2 || {}).map(([k, v]) => `${k}:\n${v}`).join('\n\n')
                : currentLevel === 3 ? (summary.level3 || []).map((s) => `## ${s.section}\n${s.summary}`).join('\n\n')
                : currentLevel === 4 ? summary.level4
                : (summary.level5 || []).map((q) => `Q: ${q.question}\nA: ${q.answer}`).join('\n\n');
              copyText(text);
            }}
            className="absolute top-4 right-4 p-2 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Render based on selected level */}
          {currentLevel === 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-2">Level 0: Thesis & Essence</div>
              <p className="text-base text-surface-800 leading-relaxed font-medium bg-primary-50/40 p-4 rounded-xl border border-primary-100">
                "{summary.level0}"
              </p>
            </div>
          )}

          {currentLevel === 1 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-2">Level 1: Executive Overview</div>
              <div className="prose prose-sm text-surface-700 whitespace-pre-line leading-relaxed">
                {summary.level1}
              </div>
            </div>
          )}

          {currentLevel === 2 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-4">Level 2: Structured Categorization</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(summary.level2 || {}).map(([key, val]) => (
                  <div key={key} className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                    <h4 className="text-sm font-semibold text-surface-900 mb-1.5 capitalize">{key.replace(/_/g, ' ')}</h4>
                    <p className="text-xs text-surface-600 leading-relaxed">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentLevel === 3 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-4">Level 3: Section-by-Section Breakdown</div>
              <div className="space-y-3.5">
                {(summary.level3 || []).map((sec, i) => (
                  <div key={i} className="p-4 rounded-xl bg-surface-50/80 border border-surface-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-sm font-semibold text-surface-900">{sec.section}</h4>
                      {sec.page && <span className="text-[11px] font-mono text-surface-400">Page {sec.page}</span>}
                    </div>
                    <p className="text-xs text-surface-600 leading-relaxed">{sec.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentLevel === 4 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-2">Level 4: Deep Technical Analysis</div>
              <div className="prose prose-sm text-surface-700 whitespace-pre-line leading-relaxed">
                {summary.level4}
              </div>
            </div>
          )}

          {currentLevel === 5 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-4">Level 5: Q&A Knowledge Base</div>
              <div className="space-y-3">
                {(summary.level5 || []).map((qa, i) => (
                  <div key={i} className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                    <h4 className="text-sm font-semibold text-surface-900 mb-2 text-primary-900">Q: {qa.question}</h4>
                    <p className="text-xs text-surface-700 leading-relaxed bg-white p-3 rounded-lg border border-surface-100">
                      <strong>A:</strong> {qa.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
