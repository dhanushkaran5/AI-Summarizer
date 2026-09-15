import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Sparkles, MessageSquare } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import type { Source, VerificationResult } from '../types';

export interface ChatMessageType {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  verification?: VerificationResult;
  claimStatus?: string;
  mock?: boolean;
}

interface ChatWindowProps {
  messages: ChatMessageType[];
  isLoading?: boolean;
  onSendMessage: (question: string) => void;
  onClearChat?: () => void;
  onSelectSource?: (source: Source) => void;
  suggestedQuestions?: string[];
  placeholder?: string;
  className?: string;
}

const DEFAULT_SUGGESTIONS = [
  'What is the main objective of this document?',
  'What methodology or approach was used?',
  'What are the key findings or results?',
  'What limitations or risks are identified?',
  'Explain the overall conclusion simply.',
];

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading = false,
  onSendMessage,
  onClearChat,
  onSelectSource,
  suggestedQuestions = DEFAULT_SUGGESTIONS,
  placeholder = 'Ask a question grounded in this document...',
  className = '',
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const query = input.trim();
    setInput('');
    onSendMessage(query);
  };

  return (
    <div className={`flex flex-col h-[650px] bg-surface-50/50 rounded-2xl border border-surface-200 overflow-hidden shadow-xs ${className}`}>
      {/* Header */}
      <div className="p-4 bg-white border-b border-surface-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-surface-900 leading-tight">Verified RAG Intelligence Chat</h3>
            <p className="text-[11px] text-surface-400">Strictly grounded in document evidence</p>
          </div>
        </div>
        {onClearChat && messages.length > 0 && (
          <button
            type="button"
            onClick={onClearChat}
            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 mb-3 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-surface-900 text-sm mb-1">Evidence-Grounded Q&A</h4>
            <p className="text-xs text-surface-500 mb-5 leading-relaxed">
              Every answer is verified against retrieved chunks with clickable citations and claim classification.
            </p>

            <div className="w-full space-y-2 text-left">
              <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block text-center">
                Suggested Prompts
              </span>
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSendMessage(q)}
                  className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-primary-50 border border-surface-200/80 hover:border-primary-200 text-xs text-surface-700 hover:text-primary-700 transition-all shadow-2xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              sources={msg.sources}
              verification={msg.verification}
              claimStatus={msg.claimStatus}
              mock={msg.mock}
              onSelectSource={onSelectSource}
            />
          ))
        )}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-surface-200 text-surface-500 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-600 animate-ping" />
              <span>Retrieving relevant chunks & verifying claims...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-3.5 bg-white border-t border-surface-200 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="input-field !py-2.5 !text-sm flex-1"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="btn-primary !p-2.5 rounded-xl disabled:opacity-40 shadow-xs flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
