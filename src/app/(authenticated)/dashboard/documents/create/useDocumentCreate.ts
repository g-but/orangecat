import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import type { DocumentFormData } from '@/lib/validation';
import { useCreatePrefill } from '@/hooks/useCreatePrefill';

type CreateMode = 'choose' | 'upload' | 'form';

export interface ExtractedContent {
  title: string;
  content: string;
  fileType: string;
  fileName: string;
}

const BASE_FORM_VALUES: Partial<DocumentFormData> = {
  title: '',
  content: '',
  document_type: 'notes',
  visibility: 'cat_visible',
  tags: [],
};

export function useDocumentCreate() {
  const { user, isLoading: authLoading, hydrated } = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit') || null;

  const { initialData: prefillData } = useCreatePrefill<DocumentFormData>({
    entityType: 'document',
    enabled: !editId,
  });

  const hasPrefill = !!(prefillData?.title || prefillData?.content);
  const [mode, setMode] = useState<CreateMode>('choose');
  const [initialValues, setInitialValues] = useState<Partial<DocumentFormData> | undefined>(
    undefined
  );
  const [isLoadingDocument, setIsLoadingDocument] = useState(!!editId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  useEffect(() => {
    if (hasPrefill && mode === 'choose' && !editId) {
      setInitialValues({
        ...BASE_FORM_VALUES,
        title: prefillData?.title ?? '',
        content: ((prefillData as Record<string, unknown>)?.content as string) ?? '',
        ...prefillData,
      });
      setMode('form');
    }
  }, [hasPrefill, mode, editId, prefillData]);

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
          setLoadError(response.status === 404 ? 'Document not found' : 'Failed to load document');
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
      ...BASE_FORM_VALUES,
      title: extracted.title,
      content: extracted.content,
    });
    setUploadedFileName(extracted.fileName);
    setMode('form');
  }, []);

  const handleUploadError = useCallback((error: string) => {
    logger.error('Upload error', { message: error }, 'Documents');
  }, []);

  const enterFormMode = useCallback(() => {
    setInitialValues({ ...BASE_FORM_VALUES, ...prefillData });
    setMode('form');
  }, [prefillData]);

  return {
    user,
    authLoading,
    hydrated,
    router,
    editId,
    prefillData,
    mode,
    setMode,
    initialValues,
    isLoadingDocument,
    loadError,
    uploadedFileName,
    handleContentExtracted,
    handleUploadError,
    enterFormMode,
  };
}
