/**
 * Create/Edit Document Page
 *
 * Page for creating a new document or editing an existing one.
 * Documents provide context for My Cat AI assistant.
 * Features easy file upload with drag & drop support.
 *
 * Created: 2026-01-20
 * Last Modified: 2026-01-21
 * Last Modified Summary: Added file upload support for easy context adding
 */

'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { EntityForm } from '@/components/create/EntityForm';
import { documentFormConfig } from '@/config/entity-configs/document-form-config';
import { DocumentFileUpload } from '@/components/documents/DocumentFileUpload';
import { ArrowLeft, Upload, PenLine, Cat, FileText, Sparkles } from 'lucide-react';
import type { DocumentFormData } from '@/lib/validation';
import { ROUTES } from '@/config/routes';
import { logger } from '@/utils/logger';

type CreateMode = 'choose' | 'upload' | 'form';

interface ExtractedContent {
  title: string;
  content: string;
  fileType: string;
  fileName: string;
}

function DocumentPageContent() {
  const { user, isLoading: authLoading, hydrated } = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit') || null;

  const [mode, setMode] = useState<CreateMode>('choose');
  const [initialValues, setInitialValues] = useState<Partial<DocumentFormData> | undefined>(
    undefined
  );
  const [isLoadingDocument, setIsLoadingDocument] = useState(!!editId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Fetch existing document if in edit mode
  useEffect(() => {
    async function fetchDocument() {
      if (!editId || !user) {
        return;
      }

      try {
        setIsLoadingDocument(true);
        setLoadError(null);

        const response = await fetch(`/api/documents/${editId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setLoadError('Document not found');
          } else {
            throw new Error('Failed to load document');
          }
          return;
        }

        const data = await response.json();
        if (data.success && data.data) {
          setInitialValues({
            title: data.data.title,
            content: data.data.content || '',
            document_type: data.data.document_type,
            visibility: data.data.visibility,
            tags: data.data.tags || [],
          });
          setMode('form');
        }
      } catch (error) {
        logger.error('Error fetching document', error, 'Documents');
        setLoadError('Failed to load document for editing');
      } finally {
        setIsLoadingDocument(false);
      }
    }

    if (hydrated && user && editId) {
      fetchDocument();
    } else if (!editId) {
      setIsLoadingDocument(false);
    }
  }, [editId, user, hydrated]);

  const handleContentExtracted = useCallback((extracted: ExtractedContent) => {
    setInitialValues({
      title: extracted.title,
      content: extracted.content,
      document_type: 'notes',
      visibility: 'cat_visible',
      tags: [],
    });
    setUploadedFileName(extracted.fileName);
    setMode('form');
  }, []);

  const handleUploadError = useCallback((error: string) => {
    logger.error('Upload error', { message: error }, 'Documents');
  }, []);

  if (authLoading || isLoadingDocument) {
    return <Loading fullScreen message={editId ? 'Loading document...' : 'Loading...'} />;
  }

  if (!user) {
    return null;
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{loadError}</p>
          <button
            onClick={() => router.push(`${ROUTES.DASHBOARD.CAT}?tab=context`)}
            className="text-sm text-red-700 hover:text-red-800 underline"
          >
            Back to My Context
          </button>
        </div>
      </div>
    );
  }

  // For edit mode, use EntityForm directly with mode="edit"
  if (editId && initialValues) {
    return (
      <div className="container max-w-4xl py-8">
        <EntityForm
          config={documentFormConfig}
          initialValues={initialValues}
          mode="edit"
          entityId={editId}
        />
      </div>
    );
  }

  // Choose mode - show options for file upload or write from scratch
  if (mode === 'choose') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`${ROUTES.DASHBOARD.CAT}?tab=context`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to My Context
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Cat className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Add Context for My Cat</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Help My Cat understand you better by adding context about your goals, skills, and
            situation.
          </p>
        </div>

        {/* Info banner */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-indigo-900">The more context, the better advice</h3>
              <p className="text-sm text-indigo-700 mt-1">
                Share your goals, skills, financial situation, or business plans. My Cat uses this
                to give you personalized advice tailored to your unique situation.
              </p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload option */}
          <button
            onClick={() => setMode('upload')}
            className="group relative bg-white border-2 border-gray-200 rounded-2xl p-8 text-left hover:border-indigo-400 hover:shadow-lg transition-all duration-200"
          >
            <div className="absolute top-4 right-4 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
              Easiest
            </div>
            <div className="p-4 bg-indigo-100 rounded-xl w-fit mb-4 group-hover:bg-indigo-200 transition-colors">
              <Upload className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload a file</h3>
            <p className="text-gray-600 mb-4">
              Drop a .txt or .md file and we'll extract the content automatically.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600">
                .txt
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600">
                .md
              </span>
            </div>
          </button>

          {/* Write option */}
          <button
            onClick={() => {
              setInitialValues({
                title: '',
                content: '',
                document_type: 'notes',
                visibility: 'cat_visible',
                tags: [],
              });
              setMode('form');
            }}
            className="group bg-white border-2 border-gray-200 rounded-2xl p-8 text-left hover:border-indigo-400 hover:shadow-lg transition-all duration-200"
          >
            <div className="p-4 bg-purple-100 rounded-xl w-fit mb-4 group-hover:bg-purple-200 transition-colors">
              <PenLine className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Write from scratch</h3>
            <p className="text-gray-600 mb-4">Type or paste your content directly into the form.</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600">
                Goals
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600">
                Skills
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600">
                Plans
              </span>
            </div>
          </button>
        </div>

        {/* Quick tips */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <h4 className="font-medium text-gray-900 mb-3">Ideas for context to add:</h4>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span>Your 2026 goals and aspirations</span>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span>Your skills and expertise</span>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span>Your financial situation and budget</span>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span>Business ideas you're working on</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Upload mode - show file upload UI
  if (mode === 'upload') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setMode('choose')}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to options
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload a file</h1>
          <p className="text-gray-600">Upload a text file and we'll extract the content for you.</p>
        </div>

        {/* File upload */}
        <DocumentFileUpload
          onContentExtracted={handleContentExtracted}
          onError={handleUploadError}
        />

        {/* Alternative */}
        <div className="mt-6 text-center">
          <span className="text-gray-400 text-sm">or</span>
          <button
            onClick={() => {
              setInitialValues({
                title: '',
                content: '',
                document_type: 'notes',
                visibility: 'cat_visible',
                tags: [],
              });
              setMode('form');
            }}
            className="block mx-auto mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Write from scratch instead →
          </button>
        </div>
      </div>
    );
  }

  // Form mode - show the entity form
  return (
    <div className="container max-w-4xl py-8">
      {uploadedFileName && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <FileText className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-800">
            Content extracted from <strong>{uploadedFileName}</strong>. Review and save below.
          </span>
        </div>
      )}
      <EntityForm config={documentFormConfig} initialValues={initialValues} mode="create" />
    </div>
  );
}

export default function CreateDocumentPage() {
  return (
    <Suspense fallback={<Loading fullScreen message="Loading..." />}>
      <DocumentPageContent />
    </Suspense>
  );
}
