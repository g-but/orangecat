'use client';

import { ArrowLeft } from 'lucide-react';
import { DocumentFileUpload } from '@/components/documents/DocumentFileUpload';
import type { ExtractedContent } from './useDocumentCreate';

interface Props {
  onBack: () => void;
  onWrite: () => void;
  onContentExtracted: (extracted: ExtractedContent) => void;
  onError: (error: string) => void;
}

export function DocumentUploadMode({ onBack, onWrite, onContentExtracted, onError }: Props) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to options
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload a file</h1>
        <p className="text-gray-600">
          Upload a text file and we&apos;ll extract the content for you.
        </p>
      </div>

      <DocumentFileUpload onContentExtracted={onContentExtracted} onError={onError} />

      <div className="mt-6 text-center">
        <span className="text-gray-400 text-sm">or</span>
        <button
          onClick={onWrite}
          className="block mx-auto mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Write from scratch instead →
        </button>
      </div>
    </div>
  );
}
