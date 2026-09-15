import React, { useState } from 'react';
import { CheckCircle2, XCircle, Eye, EyeOff, BookOpen } from 'lucide-react';
import type { StudyQuestion as StudyQuestionType } from '../types';

interface StudyQuestionProps {
  question: StudyQuestionType;
  index: number;
  className?: string;
}

export const StudyQuestion: React.FC<StudyQuestionProps> = ({
  question,
  index,
  className = '',
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const isMcq = question.type === 'mcq' && question.options && question.options.length > 0;
  const correctAns = question.correctAnswer || question.correct;

  return (
    <div className={`p-5 rounded-2xl bg-white border border-surface-200/90 shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-100">
          Question {index + 1} {question.difficulty ? `• ${question.difficulty}` : ''}
        </span>
        {question.sourceReference && (
          <span className="flex items-center gap-1 text-[11px] text-surface-400 font-medium">
            <BookOpen className="w-3 h-3 text-primary-600" />
            {question.sourceReference}
          </span>
        )}
      </div>

      {/* Prompt */}
      <h4 className="text-sm sm:text-base font-semibold text-surface-900 leading-snug">
        {question.question || question.front}
      </h4>

      {/* MCQ Options */}
      {isMcq ? (
        <div className="space-y-2 pt-1">
          {question.options!.map((opt, i) => {
            const isThisSelected = selectedOption === opt;
            const isThisCorrect = opt === correctAns;
            let btnStyle = 'border-surface-200 hover:border-primary-300 bg-surface-50/60 text-surface-700';

            if (selectedOption) {
              if (isThisCorrect) {
                btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-medium ring-1 ring-emerald-400';
              } else if (isThisSelected) {
                btnStyle = 'border-rose-500 bg-rose-50 text-rose-900 ring-1 ring-rose-400';
              } else {
                btnStyle = 'border-surface-200 bg-surface-50/30 text-surface-400 opacity-60';
              }
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => !selectedOption && setSelectedOption(opt)}
                disabled={!!selectedOption}
                className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${btnStyle}`}
              >
                <span>{opt}</span>
                {selectedOption && isThisCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-2" />
                )}
                {selectedOption && isThisSelected && !isThisCorrect && (
                  <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* Q&A Reveal Toggle */
        <div>
          <button
            type="button"
            onClick={() => setRevealed(!revealed)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {revealed ? 'Hide Answer' : 'Show Answer'}
          </button>
          {revealed && (
            <div className="mt-3 p-3.5 rounded-xl bg-surface-50 border border-surface-200 text-xs text-surface-800 leading-relaxed animate-fade-in">
              <strong>Answer:</strong> {correctAns || question.back}
            </div>
          )}
        </div>
      )}

      {/* Explanation when answered or revealed */}
      {(selectedOption || revealed) && question.explanation && (
        <div className="p-3 rounded-xl bg-primary-50/40 border border-primary-100 text-xs text-primary-900 leading-relaxed">
          💡 <strong>Explanation:</strong> {question.explanation}
        </div>
      )}
    </div>
  );
};
