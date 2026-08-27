import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GitFork, Brain } from 'lucide-react';
import { documentApi } from '../services/api';
import type { Document, KnowledgeNode } from '../types';

export default function KnowledgeMapPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [mapRoot, setMapRoot] = useState<KnowledgeNode | null>(null);
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
        fetchMap(docs[0].id);
      }
    } catch {}
  };

  const fetchMap = async (id: number) => {
    setLoading(true);
    try {
      const res = await documentApi.getKnowledgeMap(id);
      setMapRoot(res.data.root);
    } catch {
      setMapRoot(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 p-6 md:p-8 text-surface-900">
      <div className="max-w-6xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-primary-600 mb-6 font-medium">
          ← Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-surface-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                <GitFork className="w-5 h-5 text-white" />
              </div>
              Semantic Knowledge Map
            </h1>
            <p className="text-surface-500 mt-1">Hierarchical concept visualization linked directly to document evidence.</p>
          </div>

          {documents.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="doc-select" className="text-xs font-bold text-surface-500">Document:</label>
              <select
                id="doc-select"
                value={selectedDocId || ''}
                onChange={e => {
                  const id = Number(e.target.value);
                  setSelectedDocId(id);
                  fetchMap(id);
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

        {/* Tree Container */}
        <div className="card !p-8">
          {loading ? (
            <div className="text-center py-20 text-surface-400 font-medium">Building concept hierarchy...</div>
          ) : mapRoot ? (
            <div className="space-y-6">
              <div className="p-5 gradient-bg text-white rounded-2xl shadow-md flex items-center gap-3 text-lg font-bold">
                <Brain className="w-7 h-7" /> {mapRoot.name}
              </div>

              {mapRoot.children && mapRoot.children.length > 0 && (
                <div className="pl-6 md:pl-10 space-y-6 border-l-3 border-primary-300">
                  {mapRoot.children.map(child => (
                    <div key={child.id} className="space-y-3">
                      <div className="p-4 bg-white rounded-xl border border-surface-200 shadow-xs flex items-center justify-between hover-lift">
                        <div>
                          <span className="font-bold text-surface-900 text-base">{child.name}</span>
                          {child.description && <p className="text-xs text-surface-500 mt-0.5">{child.description}</p>}
                        </div>
                        {child.page && <span className="badge badge-purple text-xs">Page {child.page}</span>}
                      </div>

                      {child.children && child.children.length > 0 && (
                        <div className="pl-6 md:pl-8 space-y-2 border-l-2 border-surface-300">
                          {child.children.map(sub => (
                            <div key={sub.id} className="p-3 bg-surface-50 rounded-xl text-xs flex items-center justify-between border border-surface-200">
                              <span className="font-semibold text-surface-800">{sub.name}</span>
                              {sub.description && <span className="text-surface-500 italic">{sub.description}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-surface-400">
              Select or upload a document to generate its semantic knowledge tree.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
