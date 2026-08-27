import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, Trash2, GitCompare, MessageSquare, X } from 'lucide-react';
import type { Collection } from '../types';
import { collectionApi } from '../services/api';

export default function CollectionsPage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const colRes = await collectionApi.getAll();
      setCollections(colRes.data);
    } catch {} finally { setLoading(false); }
  };

  const createCollection = async () => {
    if (!newName.trim()) return;
    try {
      await collectionApi.create({ name: newName, description: newDesc });
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      loadData();
    } catch {}
  };

  const deleteCollection = async (id: number) => {
    try { await collectionApi.delete(id); loadData(); } catch {}
  };

  return (
    <div className="min-h-screen bg-surface-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="text-sm text-surface-400 hover:text-surface-600 mb-6 block">← Back to Dashboard</button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-surface-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center"><FolderOpen className="w-5 h-5 text-white" /></div>
              Collections
            </h1>
            <p className="text-surface-500 mt-1">Group documents for comparison and cross-document analysis</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary !py-2 !px-5"><Plus className="w-4 h-4" /> New Collection</button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-md" style={{ animation: 'scale-in 0.2s ease-out' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-surface-900">New Collection</h3>
                <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-surface-400" /></button>
              </div>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Collection name" className="input-field mb-3" />
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)" className="input-field !min-h-[80px] mb-4" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreate(false)} className="btn-secondary !py-2 !px-5">Cancel</button>
                <button onClick={createCollection} className="btn-primary !py-2 !px-5">Create</button>
              </div>
            </div>
          </div>
        )}

        {/* Collections list */}
        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
        ) : collections.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {collections.map(col => (
              <div key={col.id} className="card hover-lift group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-surface-900">{col.name}</h3>
                      <p className="text-xs text-surface-400">{col.documentCount || 0} documents</p>
                    </div>
                  </div>
                  <button onClick={() => deleteCollection(col.id)} className="opacity-0 group-hover:opacity-100 text-surface-300 hover:text-red-500 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {col.description && <p className="text-sm text-surface-500 mb-4">{col.description}</p>}
                <div className="flex gap-2">
                  <button className="btn-secondary !py-1.5 !px-3 !text-xs"><GitCompare className="w-3 h-3" /> Compare</button>
                  <button className="btn-secondary !py-1.5 !px-3 !text-xs"><MessageSquare className="w-3 h-3" /> Chat</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <FolderOpen className="w-16 h-16 text-surface-200 mx-auto mb-4" />
            <p className="text-surface-500 font-medium mb-2">No collections yet</p>
            <p className="text-surface-400 text-sm">Create a collection to group and compare documents</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 !py-2 !px-5 !text-sm"><Plus className="w-4 h-4" /> Create Collection</button>
          </div>
        )}
      </div>
    </div>
  );
}
