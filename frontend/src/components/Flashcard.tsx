import React, { useState } from 'react';
import { RotateCw, BookOpen } from 'lucide-react';
import type { FlashcardItem } from '../types';

interface FlashcardProps {
  card: FlashcardItem;
  index: number;
  className?: string;
}

export const Flashcard: React.FC<FlashcardProps> = ({
  card,
  index,
  className = '',
}) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className={`min-h-[220px] rounded-2xl border transition-all duration-300 cursor-pointer p-6 flex flex-col justify-between select-none group shadow-xs hover:shadow-md ${
        flipped
          ? 'bg-primary-900 border-primary-800 text-white'
          : 'bg-white border-surface-200 hover:border-primary-300 text-surface-900'
      } ${className}`}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            flipped ? 'bg-primary-800 text-primary-200' : 'bg-surface-100 text-surface-500'
          }`}
        >
          {flipped ? 'Answer / Explanation' : `Concept #${index + 1}`}
        </span>
        <span
          className={`flex items-center gap-1 text-xs transition-colors ${
            flipped ? 'text-primary-300' : 'text-surface-400 group-hover:text-primary-600'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          Flip
        </span>
      </div>

      {/* Content Center */}
      <div className="py-4 my-auto">
        <p
          className={`text-base font-semibold leading-relaxed ${
            flipped ? 'text-primary-50 font-normal text-sm' : 'text-surface-900'
          }`}
        >
          {flipped ? card.back : card.front}
        </p>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-surface-100/30 flex items-center justify-between text-[11px]">
        {card.sourceReference ? (
          <span
            className={`flex items-center gap-1 ${
              flipped ? 'text-primary-300' : 'text-surface-400'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            {card.sourceReference}
          </span>
        ) : (
          <span />
        )}
        <span className={flipped ? 'text-primary-400' : 'text-surface-400'}>
          Click anywhere to flip
        </span>
      </div>
    </div>
  );
};
