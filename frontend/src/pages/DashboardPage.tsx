import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText, Upload, MessageSquare, BookOpen, Plus, Sparkles,
  CheckCircle2, Clock, Brain, Trash2, ArrowRight, ArrowUpRight
} from 'lucide-react';
import type { Document, DashboardStats } from '../types';
import { documentApi, dashboardApi } from '../services/api';
import { useToast } from '../components/ToastContainer';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({ totalDocuments: 0 });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, docsRes] = await Promise.allSettled([
        dashboardApi.getStats(),
        documentApi.getAll(),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (docsRes.status === 'fulfilled') setDocuments(docsRes.value.data);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentApi.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      addToast({ type: 'success', title: 'Document Deleted', message: 'Document removed from workspace.' });
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to delete document.' });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const recentDocs = documents.slice(0, 5);

  const totalWords = documents.reduce((acc, d) => acc + (d.wordCount || 0), 0);
  const avgReadingTime = documents.length > 0
    ? Math.round(documents.reduce((acc, d) => acc + (d.readingTimeMinutes || 0), 0) / documents.length)
    : 0;

  const statCards = [
    {
      label: 'Indexed Documents',
      value: stats.totalDocuments || documents.length || 0,
      icon: FileText,
      color: 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800',
    },
    {
      label: 'AI Ready & Verified',
      value: stats.processedDocuments ?? documents.filter((d) => (d.status as string) === 'COMPLETED').length,
      icon: CheckCircle2,
      color: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    },
    {
      label: 'Summaries Generated',
      value: stats.summariesGenerated ?? 0,
      icon: BookOpen,
      color: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    },
    {
      label: 'Evidence Queries Asked',
      value: stats.questionsAsked ?? stats.totalQueries ?? 0,
      icon: MessageSquare,
      color: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* 1. Header Banner */}
      <div className="card p-6 sm:p-8 bg-gradient-to-r from-surface-50 via-white to-primary-50/40 dark:from-surface-900 dark:via-surface-900 dark:to-primary-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100/70 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            IntelliDoc AI Intelligence Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-surface-900 dark:text-surface-100">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Researcher'}.
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
            Your knowledge workspace is ready. Turn complex documents into grounded multi-depth summaries, verified answers, and instant study material.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/upload')}
            className="btn-primary text-xs py-2.5 px-5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Upload Document
          </button>
          <button
            onClick={() => navigate('/ask')}
            className="btn-secondary text-xs py-2.5 px-5 dark:bg-surface-800 dark:text-surface-200 dark:border-surface-700"
          >
            <MessageSquare className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            Ask Your Documents
          </button>
        </div>
      </div>

      {/* 2. Metric Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="card p-5 flex items-center gap-4 transition-all hover:border-surface-300 dark:hover:border-surface-700"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100 tracking-tight">
                {loading ? '—' : stat.value}
              </p>
              <p className="text-xs font-medium text-surface-500 truncate mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Main Workspace Grid: Recent Documents & Knowledge Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Documents */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-600" />
              Recent Documents
            </h2>
            <Link
              to="/documents"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
            >
              View Library ({documents.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-4 h-20 flex items-center justify-between">
                  <div className="skeleton h-4 w-1/3" />
                  <div className="skeleton h-4 w-1/4" />
                </div>
              ))}
            </div>
          ) : recentDocs.length === 0 ? (
            <div className="card p-10 text-center">
              <FileText className="w-8 h-8 text-surface-400 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-semibold text-surface-700 dark:text-surface-300">No documents indexed yet</p>
              <p className="text-[11px] text-surface-400 mt-1 max-w-xs mx-auto">
                Upload your first document to unlock multi-depth summaries and anti-hallucination Q&A.
              </p>
              <Link to="/upload" className="btn-primary text-xs mt-4 py-2 px-4 inline-flex">
                <Upload className="w-3.5 h-3.5" />
                Upload Document
              </Link>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden divide-y divide-surface-100 dark:divide-surface-800">
              {recentDocs.map((doc) => {
                const isReady = (doc.status as string) === 'COMPLETED';
                return (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/document/${doc.id}`)}
                    className="p-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 cursor-pointer flex items-center justify-between gap-4 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0 font-bold text-xs uppercase">
                        {doc.fileType || 'TXT'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-surface-900 dark:text-surface-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {doc.originalName || doc.filename}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-surface-400 mt-0.5">
                          <span>{doc.pageCount || 1} {doc.pageCount === 1 ? 'page' : 'pages'}</span>
                          <span>•</span>
                          <span>{doc.wordCount ? `${doc.wordCount.toLocaleString()} words` : `${Math.round((doc.fileSize || 0) / 1024)} KB`}</span>
                          {doc.readingTimeMinutes ? (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {Math.ceil(doc.readingTimeMinutes)}m read
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          isReady
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {isReady ? 'Ready' : 'Processing'}
                      </span>
                      <button
                        onClick={(e) => handleDelete(doc.id, e)}
                        className="p-1.5 text-surface-400 hover:text-rose-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Knowledge Insights & Activity */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary-600" />
            Knowledge Insights
          </h2>

          <div className="card p-5 space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-surface-400">Total Indexed Content</span>
              <p className="text-xl font-bold text-surface-900 dark:text-surface-100 mt-1">
                {totalWords.toLocaleString()} <span className="text-xs font-normal text-surface-400">words across corpus</span>
              </p>
            </div>

            <div className="pt-3 border-t border-surface-100 dark:border-surface-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-surface-400">Avg. Reading Time</span>
              <p className="text-sm font-semibold text-surface-800 dark:text-surface-200 mt-0.5">
                {avgReadingTime > 0 ? `~${avgReadingTime} minutes per document` : 'N/A'}
              </p>
            </div>

            <div className="pt-3 border-t border-surface-100 dark:border-surface-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-surface-400">AI Readiness Status</span>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 bg-surface-100 dark:bg-surface-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        documents.length > 0
                          ? Math.round((documents.filter((d) => (d.status as string) === 'COMPLETED').length / documents.length) * 100)
                          : 100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {documents.length > 0
                    ? `${Math.round((documents.filter((d) => (d.status as string) === 'COMPLETED').length / documents.length) * 100)}%`
                    : '100%'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-100 dark:border-surface-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-surface-400">Quick Capabilities</span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Link
                  to="/compare"
                  className="p-2.5 rounded-xl border border-surface-200 dark:border-surface-800 hover:border-primary-400 text-xs font-medium flex items-center justify-between text-surface-700 dark:text-surface-300 hover:text-primary-600 transition-colors"
                >
                  <span>Compare</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/collections"
                  className="p-2.5 rounded-xl border border-surface-200 dark:border-surface-800 hover:border-primary-400 text-xs font-medium flex items-center justify-between text-surface-700 dark:text-surface-300 hover:text-primary-600 transition-colors"
                >
                  <span>Collections</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
