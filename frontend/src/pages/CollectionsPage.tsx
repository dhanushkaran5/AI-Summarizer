import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, X } from 'lucide-react';
import type { Collection } from '../types';
import { collectionApi } from '../services/api';
import { CollectionCard } from '../components/CollectionCard';
import { EmptyState } from '../components/EmptyState';

export default function CollectionsPage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const colRes = await collectionApi.getAll();
      setCollections(colRes.data);
    } catch {} finally {
      setLoading(false);
    }
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
    try {
      await collectionApi.delete(id);
      loadData();
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 dark:text-surface-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-xs">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            Corpus Collections
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1 text-sm">
            Group related documents into dedicated topic libraries for cross-file comparative analysis.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary !py-2.5 !px-4 text-xs inline-flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" /> New Collection
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="card w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-surface-900 dark:text-surface-100">Create New Collection</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 rounded-lg text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Q3 Financial Earnings Reports"
              className="input-field"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description of documents grouped in this collection..."
              className="input-field !min-h-[80px]"
            />
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowCreate(false)}
                className="btn-secondary !py-2 !px-4 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={createCollection}
                disabled={!newName.trim()}
                className="btn-primary !py-2 !px-4 text-xs"
              >
                Create Collection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collections Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-white border border-surface-200 animate-pulse" />
          ))}
        </div>
      ) : collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <CollectionCard
              key={col.id}
              collection={col}
              onSelect={() => navigate('/compare')}
              onDelete={deleteCollection}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="No Collections Established"
          description="Create your first collection to group documents for multi-file comparison and unified workspace exploration."
          actionLabel="Create Collection"
          onAction={() => setShowCreate(true)}
        />
      )}
    </div>
  );
}
