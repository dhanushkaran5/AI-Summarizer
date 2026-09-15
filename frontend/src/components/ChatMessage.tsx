import React, { useState } from 'react';
import { User, Bot, Copy, CheckCircle } from 'lucide-react';
import { Citation } from './Citation';
import { VerificationBadge } from './VerificationBadge';
import type { Source, VerificationResult } from '../types';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  verification?: VerificationResult;
  claimStatus?: string;
  mock?: boolean;
  onSelectSource?: (source: Source) => void;
  className?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  sources = [],
  verification,
  claimStatus,
  mock,
  onSelectSource,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = role === 'user';

  const copyText = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3.5 ${isUser ? 'flex-row-reverse' : ''} ${className}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${
          isUser ? 'bg-surface-800' : 'bg-primary-600 shadow-sm'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-2xl space-y-2.5 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`p-4 rounded-2xl text-sm leading-relaxed relative group ${
            isUser
              ? 'bg-primary-600 text-white rounded-tr-xs shadow-sm'
              : 'bg-white border border-surface-200 text-surface-800 rounded-tl-xs shadow-xs'
          }`}
        >
          <div className="whitespace-pre-wrap">{content}</div>

          {!isUser && (
            <button
              onClick={copyText}
              className="absolute top-2.5 right-2.5 p-1 rounded-md text-surface-400 hover:text-surface-700 hover:bg-surface-100 opacity-0 group-hover:opacity-100 transition-all"
              title="Copy message"
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Verification Status Badge */}
        {!isUser && (verification || claimStatus) && (
          <div className="flex items-center gap-2 pt-0.5">
            <VerificationBadge
              status={verification?.status || 'supported'}
              claimStatus={verification?.claimStatus || claimStatus}
              confidence={verification?.confidence}
            />
            {mock && (
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-100 text-surface-500">
                Deterministic
              </span>
            )}
          </div>
        )}

        {/* Source Citations */}
        {!isUser && sources.length > 0 && (
          <div className="space-y-1 pt-1">
            <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block">
              Grounded Sources:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((s, idx) => (
                <Citation key={idx} source={s} index={idx} onClick={onSelectSource} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
