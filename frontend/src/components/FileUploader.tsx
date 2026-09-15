import React, { useState, useRef } from 'react';
import { UploadCloud, AlertTriangle } from 'lucide-react';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  maxSizeBytes?: number; // default 50MB
  className?: string;
}

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.txt'];

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelected,
  isUploading = false,
  uploadProgress = 0,
  maxSizeBytes = 50 * 1024 * 1024,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndHandle = (file: File) => {
    setValidationError(null);

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setValidationError(`Unsupported format "${ext}". Supported: PDF, DOCX, PPTX, TXT.`);
      return;
    }

    if (file.size > maxSizeBytes) {
      setValidationError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 50MB limit.`);
      return;
    }

    if (file.size === 0) {
      setValidationError('Cannot process an empty file.');
      return;
    }

    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndHandle(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
          isDragOver
            ? 'border-primary-500 bg-primary-50/60 scale-[1.01]'
            : 'border-surface-300 hover:border-primary-400 bg-surface-50/50 hover:bg-white'
        } ${isUploading ? 'opacity-80 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              validateAndHandle(e.target.files[0]);
            }
          }}
        />

        <div className="w-16 h-16 rounded-2xl bg-primary-100/70 text-primary-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-surface-900 mb-1.5">
          Upload document for AI intelligence
        </h3>
        <p className="text-sm text-surface-500 mb-6 max-w-md mx-auto leading-relaxed">
          Drag and drop your document here, or click to browse. Supported formats: <strong>PDF, DOCX, PPTX, TXT</strong>.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-surface-200 text-xs font-medium text-surface-600 shadow-xs">
          <span>Max 50MB</span>
          <span>•</span>
          <span>Anti-Hallucination Verified</span>
        </div>

        {isUploading && (
          <div className="mt-6 max-w-xs mx-auto">
            <div className="flex items-center justify-between text-xs text-primary-700 font-medium mb-1">
              <span>Uploading & Validating...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-primary-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {validationError && (
        <div className="mt-3.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
};
