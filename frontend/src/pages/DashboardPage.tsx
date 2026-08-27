import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText, Upload, MessageSquare, BookOpen, Brain, Plus,
  Clock, ChevronRight, BarChart3, LogOut, FolderOpen, Sparkles,
  GitFork, ShieldAlert, GitCompare, Settings
} from 'lucide-react';
import type { Document, DashboardStats } from '../types';
import { documentApi, dashboardApi } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ totalDocuments: 0, processedDocuments: 0, summariesGenerated: 0, questionsAsked: 0 });
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
      // Stats fallback
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Documents', value: stats.totalDocuments, icon: FileText, color: 'bg-purple-50 text-purple-600' },
    { label: 'Indexed & Grounded', value: stats.processedDocuments, icon: Sparkles, color: 'bg-green-50 text-green-600' },
    { label: 'Multi-Depth Summaries', value: stats.summariesGenerated, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
    { label: 'Questions Verified', value: stats.questionsAsked, icon: MessageSquare, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-surface-200 p-6 hidden lg:flex flex-col z-40">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold">ANTI-<span className="gradient-text">SUMMARY</span></span>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto">
          {[
            { icon: BarChart3, label: 'Dashboard', path: '/dashboard', active: true },
            { icon: Upload, label: 'Ingest Document', path: '/upload' },
            { icon: MessageSquare, label: 'Ask Document (RAG)', path: '/ask' },
            { icon: GitFork, label: 'Knowledge Map', path: '/knowledge-map' },
            { icon: ShieldAlert, label: 'Contradictions', path: '/contradictions' },
            { icon: GitCompare, label: 'Compare & Diff', path: '/compare' },
            { icon: FolderOpen, label: 'Collections', path: '/collections' },
            { icon: Settings, label: 'Settings', path: '/settings' },
          ].map(item => (
            <Link key={item.label} to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                item.active ? 'bg-primary-50 text-primary-700 font-bold' : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
              }`}>
              <item.icon className="w-4 h-4 text-primary-600" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="pt-4 border-t border-surface-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-900 truncate">{user?.name}</p>
              <p className="text-xs text-surface-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-surface-400 hover:text-red-500 transition-colors w-full px-2 py-2">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main id="main-content" className="lg:ml-64 p-6 md:p-8">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-surface-900">ANTI-SUMMARY</span>
          </div>
          <button onClick={logout} className="text-surface-400 hover:text-red-500" aria-label="Sign out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-8" style={{ animation: 'slide-up 0.4s ease-out' }}>
          <h1 className="text-3xl font-extrabold text-surface-900">Welcome back, {user?.name?.split(' ')[0] || 'User'}</h1>
          <p className="text-surface-500 mt-1">Adaptive understanding layer for your document corpus</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <div key={stat.label} className="card !p-5 hover-lift" style={{ animation: `scale-in 0.3s ease-out ${i * 0.1}s both` }}>
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-surface-900">{loading ? '—' : stat.value}</p>
              <p className="text-xs font-semibold text-surface-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick upload banner */}
        <div className="card mb-8 !p-0 overflow-hidden" style={{ animation: 'slide-up 0.5s ease-out 0.2s both' }}>
          <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-primary-50 via-white to-primary-50">
            <div>
              <h3 className="font-bold text-surface-900 text-lg">Ingest New Document</h3>
              <p className="text-xs text-surface-500 mt-1">Supports PDF, DOCX, PPTX, TXT, Markdown, HTML, and CSV files (up to 50MB)</p>
            </div>
            <button onClick={() => navigate('/upload')} className="btn-primary flex-shrink-0">
              <Plus className="w-5 h-5" /> Ingest Document
            </button>
          </div>
        </div>

        {/* Recent documents */}
        <div className="card" style={{ animation: 'slide-up 0.5s ease-out 0.3s both' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-surface-900 text-lg">Document Corpus</h3>
            <span className="text-xs text-surface-400">{documents.length} Total</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-surface-50">
                  <div className="skeleton w-10 h-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-48" />
                    <div className="skeleton h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map(doc => (
                <Link key={doc.id} to={`/document/${doc.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-50 transition-colors group border border-surface-100 hover:border-primary-200">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-surface-900 truncate group-hover:text-primary-600 transition-colors text-sm">{doc.originalName}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-surface-400">
                      <span className="badge badge-purple !text-xs !py-0.5">{doc.fileType?.toUpperCase()}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      <span className={`badge !text-xs !py-0.5 ${
                        doc.status === 'COMPLETED' ? 'badge-green' : doc.status === 'FAILED' ? 'badge-red' : 'badge-yellow'
                      }`}>{doc.status}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-surface-300 group-hover:text-primary-500 transition-colors" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-surface-300" />
              </div>
              <p className="text-surface-700 font-bold">No documents indexed yet</p>
              <p className="text-surface-400 text-xs mt-1">Upload your first document to unlock multi-depth intelligence</p>
              <button onClick={() => navigate('/upload')} className="btn-primary mt-4 !py-2 !px-5 !text-sm">
                <Upload className="w-4 h-4" /> Ingest First Document
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
