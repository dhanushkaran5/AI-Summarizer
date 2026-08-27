import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Send, FileText, Brain, Sparkles } from 'lucide-react';
import { documentApi, chatApi } from '../services/api';
import type { Document, Source, VerificationResult, ClaimStatus } from '../types';

export default function AskDocumentPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Array<{
    role: string;
    content: string;
    sources?: Source[];
    verification?: VerificationResult;
    claimStatus?: ClaimStatus;
    mock?: boolean;
  }>>([]);
  const [input, setInput] = useState('');
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
      }
    } catch {}
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedDocId || loading) return;
    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const res = await chatApi.sendMessage(selectedDocId, { question });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.answer,
        sources: res.data.sources,
        verification: res.data.verification,
        claimStatus: res.data.verification?.claimStatus || 'EXPLICITLY STATED',
        mock: res.data.mock,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'This document does not provide enough information to answer that question.',
        claimStatus: 'NOT FOUND',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-surface-200 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-surface-900">Ask Your Document (Grounded RAG)</h1>
              <p className="text-xs text-surface-500">Query your documents with source evidence verification</p>
            </div>
          </div>
          <Link to="/dashboard" className="btn-secondary !py-1.5 !px-4 !text-xs">
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document Selector Sidebar */}
        <div className="card !p-4 lg:col-span-1 h-[650px] flex flex-col">
          <h3 className="font-bold text-surface-900 text-sm mb-3 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-primary-600" /> Active Document
          </h3>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {documents.map(doc => (
              <button
                key={doc.id}
                onClick={() => {
                  setSelectedDocId(doc.id);
                  setMessages([]);
                }}
                className={`w-full text-left p-3 rounded-xl text-xs transition-all border ${
                  selectedDocId === doc.id
                    ? 'border-primary-500 bg-primary-50/70 font-bold text-primary-900 shadow-xs'
                    : 'border-surface-200 bg-white hover:border-surface-300 text-surface-700'
                }`}
              >
                <p className="truncate">{doc.originalName}</p>
                <span className="badge badge-purple !py-0.5 mt-1 !text-[10px]">{doc.fileType.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Conversation Area */}
        <div className="card !p-0 lg:col-span-3 h-[650px] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-20">
                <Brain className="w-14 h-14 text-primary-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-surface-800">Ask Any Question</h3>
                <p className="text-xs text-surface-400 max-w-sm mx-auto mt-1">
                  Answers are synthesized from retrieved chunks and verified against factual source citations.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 ${
                  m.role === 'user'
                    ? 'gradient-bg text-white'
                    : 'bg-surface-50 text-surface-900 border border-surface-200'
                }`}>
                  {m.role === 'assistant' && m.claimStatus && (
                    <span className={`badge text-xs font-bold mb-2 ${
                      m.claimStatus === 'EXPLICITLY STATED' ? 'claim-explicit' :
                      m.claimStatus === 'INFERRED' ? 'claim-inferred' :
                      m.claimStatus === 'UNCERTAIN' ? 'claim-uncertain' : 'claim-notfound'
                    }`}>
                      CLAIM STATUS: {m.claimStatus}
                    </span>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>

                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-surface-200 text-xs">
                      <span className="font-bold text-surface-500 block mb-1">Evidence Citations:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.sources.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-white border border-surface-200 text-primary-700">
                            Page {s.pageNumber || 1} • {s.section || 'General'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-50 rounded-2xl p-4 border border-surface-200 text-xs text-primary-600 font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" /> Retrieving context & verifying claims...
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="p-4 border-t border-surface-200 bg-white">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask a question about the active document..."
                className="input-field"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim() || !selectedDocId}
                className="btn-primary !px-5"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
