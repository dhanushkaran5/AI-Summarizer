import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText, Upload, Search, Grid, List,
  Trash2, GitCompare, ArrowUpDown, Clock, CheckCircle2,
  AlertCircle, RefreshCw, Plus, Eye
} from 'lucide-react';
import { documentApi } from '../services/api';
import type { Document } from '../types';
import { useToast } from '../components/ToastContainer';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await documentApi.getAll();
      setDocuments(res.data);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load documents.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentApi.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      addToast({ type: 'success', title: 'Document Deleted', message: 'The document was removed.' });
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to delete document.' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected documents?`)) return;

    const idsToDelete = Array.from(selectedIds);
    try {
      await Promise.allSettled(idsToDelete.map((id) => documentApi.delete(id)));
      setDocuments((prev) => prev.filter((d) => !selectedIds.has(d.id)));
      setSelectedIds(new Set());
      addToast({ type: 'success', title: 'Bulk Delete', message: `Deleted ${idsToDelete.length} documents.` });
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Some documents could not be deleted.' });
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDocuments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocuments.map((d) => d.id)));
    }
  };

  // Filtering & Sorting
  const filteredDocuments = useMemo(() => {
    return documents
      .filter((d) => {
        const name = (d.originalName || d.filename || '').toLowerCase();
        const matchesQuery = name.includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || d.fileType?.toLowerCase() === typeFilter.toLowerCase();
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'ready' && (d.status as string) === 'COMPLETED') ||
          (statusFilter === 'processing' && (d.status as string) !== 'COMPLETED' && (d.status as string) !== 'FAILED') ||
          (statusFilter === 'failed' && (d.status as string) === 'FAILED');
        return matchesQuery && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'date') {
          const tA = new Date(a.uploadedAt || 0).getTime();
          const tB = new Date(b.uploadedAt || 0).getTime();
          diff = tA - tB;
        } else if (sortBy === 'name') {
          diff = (a.originalName || a.filename || '').localeCompare(b.originalName || b.filename || '');
        } else if (sortBy === 'size') {
          diff = (a.fileSize || 0) - (b.fileSize || 0);
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [documents, searchQuery, typeFilter, statusFilter, sortBy, sortOrder]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-surface-100 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-primary-600" />
            Document Library
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            Browse, manage, and query your indexed knowledge base documents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.size > 1 && (
            <button
              onClick={() => navigate(`/compare?docs=${Array.from(selectedIds).slice(0, 3).join(',')}`)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
            >
              <GitCompare className="w-4 h-4" />
              Compare ({selectedIds.size})
            </button>
          )}

          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedIds.size})
            </button>
          )}

          <Link
            to="/upload"
            className="btn-primary text-xs py-2 px-4 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Ingest Document
          </Link>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search document title or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/60 text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* File Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-300 outline-none"
          >
            <option value="all">All Formats</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="pptx">PPTX</option>
            <option value="txt">TXT</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-300 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="ready">Ready (Indexed)</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-300 outline-none"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
          </select>

          <button
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="p-2 rounded-xl border border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-surface-200 dark:border-surface-800 rounded-xl p-0.5 bg-surface-50 dark:bg-surface-900">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-surface-800 text-primary-600 shadow-2xs font-semibold'
                  : 'text-surface-400 hover:text-surface-600'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-surface-800 text-primary-600 shadow-2xs font-semibold'
                  : 'text-surface-400 hover:text-surface-600'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-5 h-44 flex flex-col justify-between">
              <div className="skeleton h-5 w-3/4 mb-3" />
              <div className="skeleton h-4 w-1/2 mb-2" />
              <div className="skeleton h-8 w-full mt-auto" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredDocuments.length === 0 && (
        <div className="card p-12 text-center max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-600 mx-auto mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-surface-900 dark:text-surface-100">
            {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'No matching documents'
              : 'Your knowledge workspace is empty'}
          </h3>
          <p className="text-xs text-surface-500 mt-1.5 max-w-sm mx-auto">
            {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search filters to find what you are looking for.'
              : 'Upload your first document (PDF, DOCX, PPTX, or TXT) to transform it into searchable intelligence.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setTypeFilter('all'); setStatusFilter('all'); }}
                className="btn-secondary text-xs py-2 px-4"
              >
                Clear Filters
              </button>
            )}
            <Link to="/upload" className="btn-primary text-xs py-2 px-4">
              <Upload className="w-3.5 h-3.5" />
              Upload Document
            </Link>
          </div>
        </div>
      )}

      {/* Documents Grid View */}
      {!loading && viewMode === 'grid' && filteredDocuments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const isSelected = selectedIds.has(doc.id);
            const isReady = (doc.status as string) === 'COMPLETED';
            const isFailed = doc.status === 'FAILED';

            return (
              <div
                key={doc.id}
                onClick={() => navigate(`/document/${doc.id}`)}
                className={`card p-5 cursor-pointer relative group flex flex-col justify-between transition-all hover:border-primary-400 dark:hover:border-primary-600 ${
                  isSelected ? 'border-primary-500 ring-2 ring-primary-500/20' : ''
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleSelect(doc.id); }}
                        className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900'
                        }`}
                      >
                        {isSelected && <span className="text-[10px] leading-none">✓</span>}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                        {doc.fileType || 'TXT'}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                        isReady
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : isFailed
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 animate-pulse'
                      }`}
                    >
                      {isReady ? <CheckCircle2 className="w-3 h-3" /> : isFailed ? <AlertCircle className="w-3 h-3" /> : <RefreshCw className="w-3 h-3 animate-spin" />}
                      {isReady ? 'Ready' : isFailed ? 'Failed' : 'Processing'}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate mb-1" title={doc.originalName || doc.filename}>
                    {doc.originalName || doc.filename}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-surface-400 mt-2">
                    <span>{doc.pageCount || 1} {doc.pageCount === 1 ? 'page' : 'pages'}</span>
                    <span>•</span>
                    <span>{doc.wordCount ? `${doc.wordCount.toLocaleString()} words` : formatFileSize(doc.fileSize)}</span>
                    {doc.readingTimeMinutes ? (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.ceil(doc.readingTimeMinutes)}m read
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 mt-4 border-t border-surface-100 dark:border-surface-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-surface-400">
                    {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Recent'}
                  </span>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/document/${doc.id}`); }}
                      className="p-1.5 rounded-lg text-surface-500 hover:text-primary-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                      title="Open Document"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(doc.id, e)}
                      className="p-1.5 rounded-lg text-surface-500 hover:text-rose-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Documents List View */}
      {!loading && viewMode === 'list' && filteredDocuments.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 text-surface-400 text-[10px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredDocuments.length && filteredDocuments.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-surface-300"
                    />
                  </th>
                  <th className="p-3.5">Document</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Pages</th>
                  <th className="p-3.5">Reading Time</th>
                  <th className="p-3.5">Uploaded</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {filteredDocuments.map((doc) => {
                  const isSelected = selectedIds.has(doc.id);
                  const isReady = (doc.status as string) === 'COMPLETED';
                  const isFailed = doc.status === 'FAILED';

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => navigate(`/document/${doc.id}`)}
                      className="hover:bg-surface-50 dark:hover:bg-surface-900/40 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(doc.id)}
                          className="rounded border-surface-300"
                        />
                      </td>
                      <td className="p-3.5 font-medium text-surface-900 dark:text-surface-100 flex items-center gap-2 max-w-xs truncate">
                        <FileText className="w-4 h-4 text-primary-500 shrink-0" />
                        <span className="truncate">{doc.originalName || doc.filename}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 uppercase font-semibold">
                          {doc.fileType || 'TXT'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${
                            isReady
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : isFailed
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {isReady ? 'Ready' : isFailed ? 'Failed' : 'Processing'}
                        </span>
                      </td>
                      <td className="p-3.5 text-surface-500">{doc.pageCount || 1}</td>
                      <td className="p-3.5 text-surface-500">
                        {doc.readingTimeMinutes ? `${Math.ceil(doc.readingTimeMinutes)} min` : '-'}
                      </td>
                      <td className="p-3.5 text-surface-400">
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="p-3.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/document/${doc.id}`)}
                          className="p-1.5 text-surface-400 hover:text-primary-600 rounded"
                          title="Open"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-surface-400 hover:text-rose-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
