import { ZodError } from 'zod';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { API_ROUTES } from '@/config/api-routes';
import { entityEvents } from '@/lib/analytics';
import type { EntityConfig } from '../../types';

interface WizardMode {
  visibleFields: string[];
  onNext?: () => void;
}

interface EntityFormSubmitParams<T extends Record<string, unknown>> {
  config: EntityConfig<T>;
  formStateData: T;
  mode: 'create' | 'edit';
  entityId?: string;
  user: { id: string } | null;
  onSuccess?: (data: T & { id: string }) => void;
  onError?: (error: string) => void;
  clearDraft: () => void;
  setSubmitting: (v: boolean) => void;
  setErrors: (errors: Record<string, string>) => void;
  onEntityCreated: (entity: { id: string; title: string }) => void;
  router: { push: (url: string) => void };
  existingWalletLinkIdRef: { current: string | undefined };
  wizardMode?: WizardMode;
  /** Selected actor (null/undefined = personal). Merged into the create POST body. */
  actorId?: string | null;
}

export async function executeEntityFormSubmit<T extends Record<string, unknown>>({
  config,
  formStateData,
  mode,
  entityId,
  user,
  onSuccess,
  onError,
  clearDraft,
  setSubmitting,
  setErrors,
  onEntityCreated,
  router,
  existingWalletLinkIdRef,
  wizardMode,
  actorId,
}: EntityFormSubmitParams<T>): Promise<void> {
  // Wizard intermediate step: validate only visible fields, then advance without submitting.
  if (wizardMode?.onNext) {
    const dataToValidate = { ...config.defaultValues, ...formStateData };
    try {
      config.validationSchema.parse(dataToValidate);
      // Full schema passed — safe to advance
      setErrors({});
      wizardMode.onNext();
    } catch (error) {
      if (error instanceof ZodError) {
        const visibleErrors = error.issues.filter(err =>
          wizardMode.visibleFields.includes(err.path[0] as string)
        );
        if (visibleErrors.length > 0) {
          const fieldErrors: Record<string, string> = {};
          visibleErrors.forEach(err => {
            fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          return;
        }
        // No errors on visible fields — advance (errors on hidden fields caught at final submit)
        setErrors({});
        wizardMode.onNext();
      }
    }
    return;
  }

  try {
    setSubmitting(true);

    const dataToValidate = { ...config.defaultValues, ...formStateData };
    const validatedData = config.validationSchema.parse(dataToValidate);

    const url =
      mode === 'edit' && entityId ? `${config.apiEndpoint}/${entityId}` : config.apiEndpoint;

    // Merge actor_id only on create; edit mode never reassigns ownership.
    const requestBody =
      mode === 'create' && actorId
        ? { ...(validatedData as Record<string, unknown>), actor_id: actorId }
        : validatedData;

    const response = await fetch(url, {
      method: mode === 'edit' ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMessage = `Failed to ${mode} ${config.name.toLowerCase()}`;
      try {
        const errorData = await response.clone().json();
        logger.error('EntityForm: API error response', { errorData }, 'EntityForm');
        errorMessage =
          errorData.error?.message || errorData.message || errorData.error || errorMessage;
      } catch {
        try {
          const text = await response.clone().text();
          logger.error('EntityForm: API error (non-JSON)', { text }, 'EntityForm');
          errorMessage = text || errorMessage;
        } catch (textError) {
          logger.error('EntityForm: Could not read error response', { textError }, 'EntityForm');
        }
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();

    if (mode === 'create') {
      clearDraft();
      if (result.data?.id) {
        entityEvents.created(config.type, result.data.id, user?.id);
      }
    }

    const walletId = (formStateData as Record<string, unknown>)._wallet_id as string | undefined;
    if (walletId && result.data?.id) {
      (async () => {
        try {
          if (mode === 'edit' && existingWalletLinkIdRef.current) {
            await fetch(`${API_ROUTES.ENTITY_WALLETS}/${existingWalletLinkIdRef.current}`, {
              method: 'DELETE',
              credentials: 'include',
            });
          }
          await fetch(API_ROUTES.ENTITY_WALLETS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              entity_type: config.type,
              entity_id: result.data.id,
              wallet_id: walletId,
            }),
          });
        } catch (err) {
          logger.warn('Failed to link wallet to entity', { err }, 'EntityForm');
        }
      })();
    }

    const showSuccessToast = () =>
      toast.success(`${config.name} ${mode === 'create' ? 'created' : 'updated'} successfully!`, {
        description:
          mode === 'create'
            ? `Your ${config.name.toLowerCase()} "${result.data?.title || result.data?.name || ''}" has been created.`
            : 'Your changes have been saved.',
        duration: 4000,
      });

    if (onSuccess) {
      showSuccessToast();
      onSuccess(result.data);
    } else if (mode === 'create' && result.data?.id) {
      onEntityCreated({
        id: result.data.id,
        title: result.data.title || result.data.name || config.name,
      });
    } else {
      showSuccessToast();
      let redirectUrl = config.successUrl;
      if (result.data) {
        redirectUrl = redirectUrl.replace(/:(\w+)/g, (_, field) => result.data[field] || '');
        redirectUrl = redirectUrl.replace(/\[(\w+)\]/g, (_, field) => result.data[field] || '');
      }
      router.push(redirectUrl);
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.issues.forEach(err => {
        const path = err.path[0] as string;
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
    } else {
      const errorMsg =
        error instanceof Error ? error.message : `Failed to ${mode} ${config.name.toLowerCase()}`;
      setErrors({ general: errorMsg });
      toast.error(`Failed to ${mode} ${config.name.toLowerCase()}`, {
        description: errorMsg,
        duration: 5000,
      });
      if (onError) {
        onError(errorMsg);
      }
    }
  } finally {
    setSubmitting(false);
  }
}
