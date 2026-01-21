/**
 * Create/Edit Document Page
 *
 * Page for creating a new document or editing an existing one.
 * Documents provide context for My Cat AI assistant.
 *
 * Created: 2026-01-20
 * Last Modified: 2026-01-20
 * Last Modified Summary: Added edit mode support
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { CreateEntityWorkflow } from '@/components/create/CreateEntityWorkflow';
import { EntityForm } from '@/components/create/EntityForm';
import { documentFormConfig } from '@/config/entity-configs/document-form-config';
import type { DocumentFormData } from '@/lib/validation';

function DocumentPageContent() {
  const { user, isLoading: authLoading, hydrated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit') || null;

  const [initialValues, setInitialValues] = useState<Partial<DocumentFormData> | undefined>(
    undefined
  );
  const [isLoadingDocument, setIsLoadingDocument] = useState(!!editId);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (hydrated && !authLoading && !user) {
      router.push('/auth?from=documents/create');
    }
  }, [user, hydrated, authLoading, router]);

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
        }
      } catch (error) {
        console.error('Error fetching document:', error);
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

  if (!hydrated || authLoading || isLoadingDocument) {
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
            onClick={() => router.push('/dashboard/documents')}
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

  // For create mode, use CreateEntityWorkflow with templates
  return (
    <CreateEntityWorkflow
      config={documentFormConfig}
      initialValues={initialValues}
      showTemplatesByDefault={true}
    />
  );
}

export default function CreateDocumentPage() {
  return (
    <Suspense fallback={<Loading fullScreen message="Loading..." />}>
      <DocumentPageContent />
    </Suspense>
  );
}
