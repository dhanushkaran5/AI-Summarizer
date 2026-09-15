import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Trash2, Eye, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Document } from '../types';

interface DocumentTableProps {
  documents: Document[];
  onSelect: (doc: Document) => void;
  onDelete?: (docId: number) => void;
  className?: string;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  onSelect,
  onDelete,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'date' | 'pages'>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.originalName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || doc.fileType.toLowerCase() === filterType.toLowerCase();
      return matchesSearch && matchesType;
    }).sort((a, b) => {
      let res = 0;
      if (sortField === 'name') res = a.originalName.localeCompare(b.originalName);
      else if (sortField === 'date') res = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      else if (sortField === 'pages') res = (a.pageCount || 1) - (b.pageCount || 1);
      return sortAsc ? res : -res;
    });
  }, [documents, searchTerm, filterType, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredDocs.length / pageSize) || 1;
  const paginatedDocs = filteredDocs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (field: 'name' | 'date' | 'pages') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-surface-200 shadow-xs overflow-hidden ${className}`}>
      {/* Controls Bar */}
      <div className="p-4 border-b border-surface-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="input-field !py-2 !pl-9 !text-sm w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
            className="input-field !py-2 !text-sm w-full sm:w-36"
          >
            <option value="all">All Formats</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="pptx">PPTX</option>
            <option value="txt">TXT</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-50 text-surface-600 text-xs uppercase tracking-wider font-semibold border-b border-surface-200">
              <th className="p-4 cursor-pointer hover:text-surface-900" onClick={() => toggleSort('name')}>
                <span className="flex items-center gap-1.5">
                  Document <ArrowUpDown className="w-3.5 h-3.5" />
                </span>
              </th>
              <th className="p-4">Type</th>
              <th className="p-4 cursor-pointer hover:text-surface-900" onClick={() => toggleSort('pages')}>
                <span className="flex items-center gap-1.5">
                  Pages <ArrowUpDown className="w-3.5 h-3.5" />
                </span>
              </th>
              <th className="p-4 cursor-pointer hover:text-surface-900" onClick={() => toggleSort('date')}>
                <span className="flex items-center gap-1.5">
                  Uploaded <ArrowUpDown className="w-3.5 h-3.5" />
                </span>
              </th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 text-sm">
            {paginatedDocs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-surface-500">
                  No documents found matching the search criteria.
                </td>
              </tr>
            ) : (
              paginatedDocs.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => onSelect(doc)}
                  className="hover:bg-surface-50/80 cursor-pointer transition-colors"
                >
                  <td className="p-4 font-medium text-surface-900 flex items-center gap-3">
                    <FileText className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    <span className="truncate max-w-xs">{doc.originalName}</span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-surface-100 text-surface-700">
                      {doc.fileType}
                    </span>
                  </td>
                  <td className="p-4 text-surface-600">{doc.pageCount || 1}</td>
                  <td className="p-4 text-surface-500">
                    {new Date(doc.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      doc.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                      doc.status === 'FAILED' ? 'bg-rose-50 text-rose-700' : 'bg-primary-50 text-primary-700 animate-pulse'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onSelect(doc)}
                      className="p-1.5 rounded-lg text-surface-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      title="Inspect"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${doc.originalName}?`)) {
                            onDelete(doc.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-surface-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-surface-100 flex items-center justify-between text-xs text-surface-500">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredDocs.length)} of {filteredDocs.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md hover:bg-surface-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md hover:bg-surface-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
