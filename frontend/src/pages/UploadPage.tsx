import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, FileText, AlertCircle, CheckCircle, X, Brain, FileType2, HelpCircle, ArrowRight } from 'lucide-react';
import { documentApi, jobApi } from '../services/api';
import type { DocumentStatus } from '../types';

const SUPPORTED_EXTS = ['.pdf', '.docx', '.pptx', '.txt', '.md', '.html', '.csv'];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

const STAGE_CONFIG: Record<string, { label: string; percent: number; color: string }> = {
  UPLOADING: { label: 'Uploading file securely...', percent: 15, color: 'bg-blue-500' },
  EXTRACTING: { label: 'Extracting text and structure...', percent: 35, color: 'bg-purple-500' },
  CHUNKING: { label: 'Semantic segmentation & overlap chunking...', percent: 60, color: 'bg-violet-500' },
  EMBEDDING: { label: 'Generating embeddings & vector indexing...', percent: 80, color: 'bg-indigo-500' },
  SUMMARIZING: { label: 'Synthesizing multi-level intelligence...', percent: 95, color: 'bg-primary-500' },
  COMPLETED: { label: 'Document intelligence indexing complete!', percent: 100, color: 'bg-green-500' },
  FAILED: { label: 'Processing encountered an issue', percent: 100, color: 'bg-red-500' },
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
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_EXTS.includes(ext)) {
      return `Unsupported format: ${ext}. Supported: PDF, DOCX, PPTX, TXT, MD, HTML, CSV`;
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
          setStatus(job.status);
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
      const msg = err.response?.data?.message || 'Upload failed due to connection error.';
      const remedy = err.response?.data?.remedy || 'Check server status or try uploading a standard text PDF.';
      setError(msg);
      setDiagnosticRemedy(remedy);
    }
  };

  const stage = status ? STAGE_CONFIG[status] || STAGE_CONFIG.UPLOADING : null;

  return (
    <div className="min-h-screen bg-surface-50 p-6 md:p-10 text-surface-900">
      <div className="max-w-2xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 mb-6 transition-colors font-medium">
          ← Back to Dashboard
        </Link>

        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-extrabold text-surface-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5 text-white" />
            </div>
            Ingest Document
          </h1>
          <p className="text-surface-500 mt-2 text-base">
            Upload complex documents for structural analysis, semantic indexing, and multi-depth intelligence.
          </p>
        </div>

        {/* Drop zone */}
        <div className="card !p-0 mb-6" style={{ animation: 'scale-in 0.3s ease-out' }}>
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => { if (!file) document.getElementById('file-upload-input')?.click(); }}
            className={`p-10 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer ${
              dragOver
                ? 'border-primary-500 bg-primary-50/70'
                : file
                ? 'border-green-400 bg-green-50/50'
                : 'border-surface-300 hover:border-primary-400 hover:bg-primary-50/30'
            }`}
          >
            <input
              id="file-upload-input"
              type="file"
              className="hidden"
              accept=".pdf,.docx,.pptx,.txt,.md,.html,.csv"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            {file ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-green-700" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-surface-900 text-sm">{file.name}</p>
                    <p className="text-xs text-surface-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setFile(null);
                    setStatus(null);
                    setError('');
                  }}
                  className="w-8 h-8 rounded-full bg-surface-200 hover:bg-red-100 flex items-center justify-center transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4 text-surface-700" />
                </button>
              </div>
            ) : (
              <div>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-100 flex items-center justify-center mb-3">
                  <Upload className="w-7 h-7 text-primary-600" />
                </div>
                <p className="text-base font-bold text-surface-800 mb-1">Drag and drop file here, or click to browse</p>
                <p className="text-xs text-surface-400">PDF, DOCX, PPTX, TXT, Markdown, HTML, CSV (Max 50MB)</p>
              </div>
            )}
          </div>
        </div>

        {/* Format indicators */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {['PDF', 'DOCX', 'PPTX', 'TXT', 'MD', 'HTML', 'CSV'].map(fmt => (
            <div key={fmt} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-surface-200 text-xs font-semibold text-surface-600">
              <FileType2 className="w-3.5 h-3.5 text-primary-600" /> {fmt}
            </div>
          ))}
        </div>

        {/* Failure-First Diagnostic Error Box */}
        {error && (
          <div className="card !p-5 mb-6 bg-red-50/80 border border-red-200 text-red-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              Processing Issue Encountered
            </div>
            <p className="text-xs text-red-800 leading-relaxed pl-7">{error}</p>
            {diagnosticRemedy && (
              <div className="mt-3 p-3 bg-white rounded-xl border border-red-200 text-xs text-surface-800 space-y-1">
                <span className="font-bold flex items-center gap-1 text-primary-700">
                  <HelpCircle className="w-3.5 h-3.5" /> Recommended Solution:
                </span>
                <p className="text-surface-600 leading-relaxed">{diagnosticRemedy}</p>
              </div>
            )}
          </div>
        )}

        {/* Processing Progress with Async Job Tracking */}
        {status && stage && (
          <div className="card mb-6 space-y-4" style={{ animation: 'scale-in 0.25s ease-out' }}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-surface-800">{stage.label}</span>
              <span className="font-semibold text-primary-600">{stage.percent}%</span>
            </div>
            <div className="w-full h-3 bg-surface-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                style={{ width: `${stage.percent}%` }}
              />
            </div>
            {currentStageDesc && (
              <p className="text-xs text-surface-500 italic">{currentStageDesc}</p>
            )}

            {status === 'COMPLETED' && (
              <div className="mt-4 pt-3 border-t border-surface-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Ready for Multi-Depth Analysis
                </div>
                <button
                  onClick={() => documentId && navigate(`/document/${documentId}`)}
                  className="btn-primary !py-2 !px-5 !text-sm"
                >
                  Explore Document <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upload Button */}
        {file && !status && (
          <button onClick={handleUpload} className="btn-primary w-full !py-3.5 !text-base">
            <Brain className="w-5 h-5" /> Start AI Ingestion
          </button>
        )}
      </div>
    </div>
  );
}
