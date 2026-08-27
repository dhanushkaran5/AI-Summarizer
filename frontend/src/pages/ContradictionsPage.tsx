import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, CheckCircle } from 'lucide-react';
import { documentApi } from '../services/api';
import type { Document, Contradiction } from '../types';

export default function ContradictionsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    try {
      const res = await documentApi.getAll();
      const docs = res.data;
      setDocuments(docs);
      if (docs.length > 0) {
        setSelectedDocId(docs[0].id);
        fetchContradictions(docs[0].id);
      }
    } catch {}
  };

  const fetchContradictions = async (id: number) => {
    setLoading(true);
    try {
      const res = await documentApi.getContradictions(id);
      setContradictions(res.data.contradictions || []);
    } catch {
      setContradictions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 p-6 md:p-8 text-surface-900">
      <div className="max-w-5xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-primary-600 mb-6 font-medium">
          ← Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-surface-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              Contradiction & Consistency Engine
            </h1>
            <p className="text-surface-500 mt-1">Cross-section semantic verification for conflicting claims and metrics.</p>
          </div>

          {documents.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="doc-select-c" className="text-xs font-bold text-surface-500">Document:</label>
              <select
                id="doc-select-c"
                value={selectedDocId || ''}
                onChange={e => {
                  const id = Number(e.target.value);
                  setSelectedDocId(id);
                  fetchContradictions(id);
                }}
                className="input-field !py-2 !text-xs !w-64"
              >
                {documents.map(d => (
                  <option key={d.id} value={d.id}>{d.originalName}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="card space-y-6">
          {loading ? (
            <div className="text-center py-20 text-surface-400 font-medium">Scanning for internal inconsistencies...</div>
          ) : contradictions.length > 0 ? (
            <div className="space-y-4">
              {contradictions.map((c, i) => (
                <div key={i} className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="badge badge-yellow text-xs font-bold uppercase">
                      Inconsistency #{i + 1} ({c.severity} Severity)
                    </span>
                  </div>
                  <p className="text-sm font-bold text-amber-950">{c.explanation}</p>
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 bg-white rounded-xl border border-amber-100 shadow-xs">
                      <span className="text-xs font-bold text-surface-500 block mb-1">
                        Statement A (Page {c.pageA || 1} • {c.sectionA || 'Section A'})
                      </span>
                      <p className="text-sm text-surface-800 italic leading-relaxed">"{c.statementA}"</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-amber-100 shadow-xs">
                      <span className="text-xs font-bold text-surface-500 block mb-1">
                        Statement B (Page {c.pageB || 2} • {c.sectionB || 'Section B'})
                      </span>
                      <p className="text-sm text-surface-800 italic leading-relaxed">"{c.statementB}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-green-50/60 rounded-2xl border border-green-200 text-green-800">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
              <h3 className="text-lg font-bold">Document Consistency Verified</h3>
              <p className="text-xs opacity-80 mt-1 max-w-md mx-auto">
                No contradictory numbers, opposing requirements, or conflicting facts were detected across sections.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
