/**
 * Document File Upload Component
 *
 * Drag & drop or click to upload files for context.
 * Supports .txt, .md, .pdf, .doc, .docx files.
 * Extracts text and auto-populates document form.
 *
 * Created: 2026-01-21
 * Last Modified: 2026-01-21
 * Last Modified Summary: Initial implementation
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, File, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExtractedContent {
  title: string;
  content: string;
  fileType: string;
  fileName: string;
}

interface DocumentFileUploadProps {
  onContentExtracted: (content: ExtractedContent) => void;
  onError?: (error: string) => void;
  className?: string;
}

const ACCEPTED_TYPES = [
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ACCEPTED_EXTENSIONS = ['.txt', '.md', '.pdf', '.doc', '.docx'];

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

export function DocumentFileUpload({
  onContentExtracted,
  onError,
  className,
}: DocumentFileUploadProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate file type
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(extension)) {
        const error = `Unsupported file type. Please upload ${ACCEPTED_EXTENSIONS.join(', ')} files.`;
        setErrorMessage(error);
        setState('error');
        onError?.(error);
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        const error = 'File too large. Maximum size is 10MB.';
        setErrorMessage(error);
        setState('error');
        onError?.(error);
        return;
      }

      setFileName(file.name);
      setState('uploading');
      setErrorMessage(null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/documents/extract', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to extract content');
        }

        const data = await response.json();

        if (data.success && data.data) {
          setState('success');
          onContentExtracted({
            title: data.data.title,
            content: data.data.content,
            fileType: data.data.fileType,
            fileName: file.name,
          });
        } else {
          throw new Error(data.error || 'Failed to extract content');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to process file';
        setErrorMessage(message);
        setState('error');
        onError?.(message);
      }
    },
    [onContentExtracted, onError]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState('dragging');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState('idle');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setState('idle');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleReset = useCallback(() => {
    setState('idle');
    setFileName(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={state === 'idle' || state === 'error' ? handleClick : undefined}
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-all duration-200',
          'flex flex-col items-center justify-center p-8 text-center',
          state === 'idle' &&
            'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer',
          state === 'dragging' && 'border-indigo-500 bg-indigo-50 scale-[1.02]',
          state === 'uploading' && 'border-indigo-400 bg-indigo-50 cursor-wait',
          state === 'success' && 'border-green-400 bg-green-50',
          state === 'error' && 'border-red-400 bg-red-50 cursor-pointer'
        )}
      >
        {state === 'idle' && (
          <>
            <div className="p-4 bg-indigo-100 rounded-full mb-4">
              <Upload className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Upload a file</h3>
            <p className="text-sm text-gray-600 mb-3">Drag & drop or click to browse</p>
            <div className="flex flex-wrap justify-center gap-2">
              {ACCEPTED_EXTENSIONS.map(ext => (
                <span
                  key={ext}
                  className="px-2 py-1 bg-white rounded-md text-xs font-medium text-gray-600 border border-gray-200"
                >
                  {ext}
                </span>
              ))}
            </div>
          </>
        )}

        {state === 'dragging' && (
          <>
            <div className="p-4 bg-indigo-200 rounded-full mb-4 animate-pulse">
              <Upload className="h-8 w-8 text-indigo-700" />
            </div>
            <h3 className="text-lg font-semibold text-indigo-900">Drop your file here</h3>
          </>
        )}

        {state === 'uploading' && (
          <>
            <div className="p-4 bg-indigo-100 rounded-full mb-4">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Processing...</h3>
            <p className="text-sm text-gray-600">Extracting content from {fileName}</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="p-4 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-1">Content extracted!</h3>
            <p className="text-sm text-green-700 mb-3">{fileName}</p>
            <button
              onClick={e => {
                e.stopPropagation();
                handleReset();
              }}
              className="text-sm text-green-600 hover:text-green-800 font-medium underline"
            >
              Upload a different file
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="p-4 bg-red-100 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-1">Upload failed</h3>
            <p className="text-sm text-red-600 mb-3">{errorMessage}</p>
            <p className="text-sm text-gray-600">Click to try again</p>
          </>
        )}
      </div>
    </div>
  );
}
