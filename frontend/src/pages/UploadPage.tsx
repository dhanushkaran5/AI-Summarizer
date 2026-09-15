import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, AlertCircle, CheckCircle, X, Brain,
  ArrowRight, Shield, Layers, Sparkles
} from 'lucide-react';
import { documentApi, jobApi } from '../services/api';
import type { DocumentStatus } from '../types';

const SUPPORTED_EXTS = ['.pdf', '.docx', '.pptx', '.txt'];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

const STAGE_CONFIG: Record<string, { label: string; percent: number; step: number }> = {
  UPLOADING: { label: 'Uploading file securely...', percent: 15, step: 1 },
  EXTRACTING: { label: 'Extracting text and document structure...', percent: 35, step: 2 },
  CHUNKING: { label: 'Semantic segmentation & overlap chunking...', percent: 60, step: 3 },
  EMBEDDING: { label: 'Generating embeddings & vector indexing...', percent: 80, step: 4 },
  SUMMARIZING: { label: 'Synthesizing multi-level intelligence...', percent: 95, step: 5 },
  COMPLETED: { label: 'Document intelligence indexing complete!', percent: 100, step: 5 },
  FAILED: { label: 'Processing encountered an issue', percent: 100, step: 0 },
};

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<DocumentStatus | null>(null);
  const [currentStageDesc, setCurrentStageDesc] = useState<string>('');
  const [error, setError] = useState('');
  const [diagnosticRemedy, setDiagnosticRemedy] = useState('');
  const [documentId, setDocumentId] = useState<number | null>(null);

  const validateFile = (f: File): string | null => {
    const ext = '.' + (f.name.split('.').pop() || '').toLowerCase();
    if (!SUPPORTED_EXTS.includes(ext)) {
      return `Unsupported format: ${ext}. Supported formats: PDF, DOCX, PPTX, TXT`;
    }
    if (f.size > MAX_SIZE) return `File exceeds size limit: ${(f.size / 1024 / 1024).toFixed(1)}MB (max 50MB)`;
    if (f.size === 0) return 'File is empty (0 bytes)';
    return null;
  };

  const handleFile = useCallback((f: File) => {
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setFile(f);
    setError('');
    setDiagnosticRemedy('');
    setStatus(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!file) return;
    setError('');
    setDiagnosticRemedy('');
    setStatus('UPLOADING');
    setCurrentStageDesc('Uploading file to server...');

    try {
      const res = await documentApi.upload(file);
      const createdDoc = res.data.document;
      const createdJobId = res.data.jobId;

      setDocumentId(createdDoc.id);

      // Poll asynchronous job status
      const poll = async () => {
        try {
          const jobRes = await jobApi.getStatus(createdJobId);
          const job = jobRes.data;
          setStatus(job.status as DocumentStatus);
          if (job.currentStageDescription) {
            setCurrentStageDesc(job.currentStageDescription);
          }

          if (job.status === 'COMPLETED') {
            return;
          } else if (job.status === 'FAILED') {
            setError(job.errorMessage || 'Document processing could not complete.');
            setDiagnosticRemedy(job.diagnosticRemedy || 'Verify document format and readability.');
            return;
          } else {
            setTimeout(poll, 1200);
          }
        } catch {
          // Fallback check document directly
          try {
            const docRes = await documentApi.getById(createdDoc.id);
            if (docRes.data.status === 'COMPLETED') {
              setStatus('COMPLETED');
            }
          } catch {}
        }
      };

      poll();

    } catch (err: any) {
      setStatus('FAILED');
      const msg = err.response?.data?.message || err.message || 'Upload failed due to connection error.';
      const remedy = err.response?.data?.remedy || 'Check server status or try uploading a standard text PDF.';
      setError(msg);
      setDiagnosticRemedy(remedy);
    }
  };

  const stage = status ? STAGE_CONFIG[status] || STAGE_CONFIG.UPLOADING : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 dark:text-surface-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white shadow-xs">
            <Upload className="w-5 h-5" />
          </div>
          Ingest Document
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1.5 text-xs sm:text-sm">
          Upload documents for structural segmentation, semantic indexing, and multi-depth intelligence.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Dropzone & Upload Action */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-0 overflow-hidden">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => { if (!file) document.getElementById('file-upload-input')?.click(); }}
              className={`p-10 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/30 scale-[1.01]'
                  : file
                  ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-surface-300 dark:border-surface-700 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-surface-50 dark:hover:bg-surface-800/40'
              }`}
            >
              <input
                id="file-upload-input"
                type="file"
                className="hidden"
                accept=".pdf,.docx,.pptx,.txt"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />

              {file ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-bold text-surface-900 dark:text-surface-100 text-sm truncate">{file.name}</p>
                      <p className="text-xs text-surface-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setStatus(null);
                      setError('');
                    }}
                    className="w-8 h-8 rounded-full bg-surface-200 dark:bg-surface-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 flex items-center justify-center transition-colors shrink-0"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4 text-surface-600 dark:text-surface-300" />
                  </button>
                </div>
              ) : (
                <div className="py-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-100/70 dark:bg-primary-950/60 flex items-center justify-center mb-4 text-primary-600 dark:text-primary-400 shadow-xs">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-sm sm:text-base font-bold text-surface-900 dark:text-surface-100 mb-1">
                    Drag and drop file here, or click to browse
                  </p>
                  <p className="text-xs text-surface-400">
                    PDF, DOCX, PPTX, TXT (Max 50MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Diagnostic Error Box */}
          {error && (
            <div className="card p-5 bg-rose-50/80 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-800 dark:text-rose-300">
                <AlertCircle className="w-5 h-5 shrink-0" />
                Ingestion Diagnosis Failed
              </div>
              <p className="text-xs">{error}</p>
              {diagnosticRemedy && (
                <div className="p-3 bg-white/80 dark:bg-surface-900/80 rounded-xl text-xs border border-rose-100 dark:border-rose-900">
                  <span className="font-semibold text-rose-800 dark:text-rose-400">Suggested Action: </span>
                  {diagnosticRemedy}
                </div>
              )}
            </div>
          )}

          {/* Progress Tracker */}
          {status && stage && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span className="text-surface-700 dark:text-surface-200 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-primary-500 animate-ping'}`} />
                  {stage.label}
                </span>
                <span className="text-surface-500 dark:text-surface-400 font-mono text-xs">{stage.percent}%</span>
              </div>

              <div className="w-full bg-surface-100 dark:bg-surface-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 bg-primary-600`}
                  style={{ width: `${stage.percent}%` }}
                />
              </div>

              {currentStageDesc && (
                <p className="text-xs text-surface-500 dark:text-surface-400 italic">{currentStageDesc}</p>
              )}

              {status === 'COMPLETED' && (
                <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Ready for Multi-Depth Analysis
                  </div>
                  <button
                    onClick={() => documentId && navigate(`/document/${documentId}`)}
                    className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2"
                  >
                    Explore Document <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Upload Action Button */}
          {file && !status && (
            <button
              onClick={handleUpload}
              className="btn-primary w-full py-3 text-sm shadow-sm"
            >
              <Brain className="w-4 h-4" /> Start AI Ingestion
            </button>
          )}
        </div>

        {/* Right Column: Ingestion Pipeline Overview & Guidance */}
        <div className="space-y-6">
          {/* Pipeline Steps Card */}
          <div className="card p-5 space-y-4">
            <h3 className="font-bold text-sm text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-600" />
              Automated Ingestion Pipeline
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800/60">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <div className="font-semibold text-surface-800 dark:text-surface-200">Structure Extraction</div>
                  <div className="text-surface-500 text-[11px]">Extracts sections, headers, and metadata</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800/60">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <div className="font-semibold text-surface-800 dark:text-surface-200">Semantic Chunking</div>
                  <div className="text-surface-500 text-[11px]">1,000-character segments with 200 overlap preservation</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800/60">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <div className="font-semibold text-surface-800 dark:text-surface-200">Vector Indexing</div>
                  <div className="text-surface-500 text-[11px]">Generates embeddings stored in ChromaDB vector space</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800/60">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0">4</div>
                <div>
                  <div className="font-semibold text-surface-800 dark:text-surface-200">Verification Readiness</div>
                  <div className="text-surface-500 text-[11px]">Multi-depth summaries and citation cross-checking ready</div>
                </div>
              </div>
            </div>
          </div>

          {/* Supported Formats Card */}
          <div className="card p-5 space-y-3">
            <h3 className="font-bold text-sm text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-600" />
              Supported Formats
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {['PDF', 'DOCX', 'PPTX', 'TXT'].map((fmt) => (
                <span
                  key={fmt}
                  className="px-2.5 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-semibold text-surface-700 dark:text-surface-300"
                >
                  {fmt}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-surface-400">
              Maximum file size: 50MB. Text is processed securely with zero unauthorized data retention.
            </p>
          </div>

          {/* Security Box */}
          <div className="card p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-emerald-950 dark:text-emerald-200 block">Encrypted Document Storage</span>
              <span className="text-emerald-800 dark:text-emerald-400 text-[11px]">
                Documents are scoped to your user account and never exposed or shared with other tenants.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
