import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Upload, BarChart3, Files, MessageSquare,
  GitCompare, FolderOpen, Settings, Moon, Sun, Laptop,
  FileText, X, ArrowRight, ShieldAlert, GitFork
} from 'lucide-react';
import { documentApi } from '../services/api';
import type { Document } from '../types';
import { useTheme } from '../context/ThemeContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ActionItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Theme';
  icon: React.ElementType;
  handler: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      documentApi.getAll()
        .then((res) => setDocuments(res.data))
        .catch(() => setDocuments([]));
    }
  }, [isOpen]);

  const defaultActions: ActionItem[] = [
    {
      id: 'upload',
      title: 'Ingest New Document',
      category: 'Actions',
      icon: Upload,
      handler: () => { navigate('/upload'); onClose(); },
      shortcut: 'U',
    },
    {
      id: 'docs',
      title: 'Document Library',
      category: 'Navigation',
      icon: Files,
      handler: () => { navigate('/documents'); onClose(); },
    },
    {
      id: 'dashboard',
      title: 'Workspace Dashboard',
      category: 'Navigation',
      icon: BarChart3,
      handler: () => { navigate('/dashboard'); onClose(); },
    },
    {
      id: 'ask',
      title: 'Ask Documents (Verified RAG)',
      category: 'Navigation',
      icon: MessageSquare,
      handler: () => { navigate('/ask'); onClose(); },
    },
    {
      id: 'compare',
      title: 'Compare & Diff Documents',
      category: 'Navigation',
      icon: GitCompare,
      handler: () => { navigate('/compare'); onClose(); },
    },
    {
      id: 'collections',
      title: 'Knowledge Collections',
      category: 'Navigation',
      icon: FolderOpen,
      handler: () => { navigate('/collections'); onClose(); },
    },
    {
      id: 'contradictions',
      title: 'Contradiction Audit Engine',
      category: 'Navigation',
      icon: ShieldAlert,
      handler: () => { navigate('/contradictions'); onClose(); },
    },
    {
      id: 'knowledge-map',
      title: 'Interactive Knowledge Map',
      category: 'Navigation',
      icon: GitFork,
      handler: () => { navigate('/knowledge-map'); onClose(); },
    },
    {
      id: 'settings',
      title: 'Workspace Settings',
      category: 'Navigation',
      icon: Settings,
      handler: () => { navigate('/settings'); onClose(); },
    },
    {
      id: 'theme-light',
      title: 'Switch to Light Theme',
      category: 'Theme',
      icon: Sun,
      handler: () => { setTheme('light'); onClose(); },
    },
    {
      id: 'theme-dark',
      title: 'Switch to Dark Theme',
      category: 'Theme',
      icon: Moon,
      handler: () => { setTheme('dark'); onClose(); },
    },
    {
      id: 'theme-system',
      title: 'Use System Theme Preference',
      category: 'Theme',
      icon: Laptop,
      handler: () => { setTheme('system'); onClose(); },
    },
  ];

  // Filter actions based on query
  const filteredActions = defaultActions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  // Filter documents based on query
  const filteredDocuments = documents.filter((d) =>
    (d.originalName || d.filename || '').toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const totalItemsCount = filteredActions.length + filteredDocuments.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (totalItemsCount || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItemsCount) % (totalItemsCount || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex < filteredActions.length) {
          filteredActions[selectedIndex]?.handler();
        } else {
          const docIdx = selectedIndex - filteredActions.length;
          const targetDoc = filteredDocuments[docIdx];
          if (targetDoc) {
            navigate(`/document/${targetDoc.id}`);
            onClose();
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredActions, filteredDocuments, totalItemsCount, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-surface-100 dark:border-surface-800">
          <Search className="w-5 h-5 text-surface-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search documents..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent border-none outline-none text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {totalItemsCount === 0 && (
            <div className="py-12 text-center text-sm text-surface-400">
              No matching commands or documents found for "{query}".
            </div>
          )}

          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-surface-400 px-3 py-1.5">
                Commands & Navigation
              </div>
              {filteredActions.map((action, index) => {
                const isSelected = selectedIndex === index;
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.handler}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300'
                        : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400'}`} />
                      <span>{action.title}</span>
                    </div>
                    {action.shortcut ? (
                      <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
                        {action.shortcut}
                      </kbd>
                    ) : (
                      <ArrowRight className={`w-3.5 h-3.5 opacity-0 ${isSelected ? 'opacity-100' : ''}`} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Matching Documents */}
          {filteredDocuments.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] uppercase font-bold tracking-wider text-surface-400 px-3 py-1.5">
                Documents
              </div>
              {filteredDocuments.map((doc, docIdx) => {
                const index = filteredActions.length + docIdx;
                const isSelected = selectedIndex === index;
                return (
                  <button
                    key={doc.id}
                    onClick={() => {
                      navigate(`/document/${doc.id}`);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300'
                        : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-primary-500 shrink-0" />
                      <span className="truncate">{doc.originalName || doc.filename}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-500 uppercase">
                        {doc.fileType}
                      </span>
                    </div>
                    <span className="text-[11px] text-surface-400 shrink-0">
                      {doc.pageCount || 1} {doc.pageCount === 1 ? 'page' : 'pages'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-surface-50 dark:bg-surface-950/60 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-[11px] text-surface-400">
          <div className="flex items-center gap-3">
            <span><kbd className="font-sans px-1 py-0.5 rounded bg-surface-200 dark:bg-surface-800">↑↓</kbd> navigate</span>
            <span><kbd className="font-sans px-1 py-0.5 rounded bg-surface-200 dark:bg-surface-800">↵</kbd> select</span>
            <span><kbd className="font-sans px-1 py-0.5 rounded bg-surface-200 dark:bg-surface-800">esc</kbd> close</span>
          </div>
          <span className="font-medium text-surface-500">IntelliDoc Command Engine</span>
        </div>
      </div>
    </div>
  );
};
