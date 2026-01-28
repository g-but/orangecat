/**
 * USE ENTITY PREFILL HOOK
 * Builds prefill data for entity creation from chat context
 */

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { STORAGE_KEYS } from '@/config/storage-keys';
import type { ChatMessage, EntitySuggestion } from '../types';

export function useEntityPrefill(messages: ChatMessage[]) {
  const router = useRouter();

  const buildServicePrefill = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const description = lastUser?.content || '';
    let title = 'New Service';
    if (description) {
      const firstSentence = description.split(/\.|\n|\r/)[0]?.trim();
      title =
        firstSentence && firstSentence.length > 0 ? firstSentence.slice(0, 60) : 'New Service';
    }
    return {
      title,
      description,
      category: 'Other',
      service_location_type: 'remote',
    } as Record<string, unknown>;
  }, [messages]);

  const buildProductPrefill = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const description = lastUser?.content || '';
    let title = 'New Product';
    if (description) {
      const firstSentence = description.split(/[\.\n\r]/)[0]?.trim();
      title =
        firstSentence && firstSentence.length > 0 ? firstSentence.slice(0, 60) : 'New Product';
    }
    return {
      title,
      description,
      category: '',
      price: null,
      currency: undefined,
    } as Record<string, unknown>;
  }, [messages]);

  const buildProjectPrefill = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const description = lastUser?.content || '';
    let title = 'New Project';
    if (description) {
      const firstSentence = description.split(/[\.\n\r]/)[0]?.trim();
      title =
        firstSentence && firstSentence.length > 0 ? firstSentence.slice(0, 60) : 'New Project';
    }
    return {
      title,
      description,
      funding_goal: null,
      currency: undefined,
    } as Record<string, unknown>;
  }, [messages]);

  const handleCreateService = useCallback(() => {
    const prefill = buildServicePrefill();
    try {
      localStorage.setItem(STORAGE_KEYS.ENTITY_PREFILL('service'), JSON.stringify(prefill));
    } catch {}
    router.push(`${ENTITY_REGISTRY.service.createPath}?prefill=1`);
  }, [buildServicePrefill, router]);

  const handleCreateProduct = useCallback(() => {
    const prefill = buildProductPrefill();
    try {
      localStorage.setItem(STORAGE_KEYS.ENTITY_PREFILL('product'), JSON.stringify(prefill));
    } catch {}
    router.push(`${ENTITY_REGISTRY.product.createPath}?prefill=1`);
  }, [buildProductPrefill, router]);

  const handleCreateProject = useCallback(() => {
    const prefill = buildProjectPrefill();
    try {
      localStorage.setItem(STORAGE_KEYS.ENTITY_PREFILL('project'), JSON.stringify(prefill));
    } catch {}
    router.push(`${ENTITY_REGISTRY.project.createPath}?prefill=1`);
  }, [buildProjectPrefill, router]);

  // Naive intent detection for entity suggestions
  const suggestEntities = useMemo((): EntitySuggestion[] => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const text = (lastUser?.content || '').toLowerCase();
    const suggestions: EntitySuggestion[] = [];
    if (!text) {
      return suggestions;
    }

    if (/(offer|consult|service|hire|teach|coach|design|develop)/.test(text)) {
      suggestions.push({ type: 'service', label: 'Service', action: handleCreateService });
    }
    if (/(sell|buy|product|item|store|price)/.test(text)) {
      suggestions.push({ type: 'product', label: 'Product', action: handleCreateProduct });
    }
    if (/(raise|fund|project|campaign|goal|donat)/.test(text)) {
      suggestions.push({ type: 'project', label: 'Project', action: handleCreateProject });
    }
    return suggestions;
  }, [messages, handleCreateService, handleCreateProduct, handleCreateProject]);

  return {
    handleCreateService,
    handleCreateProduct,
    handleCreateProject,
    suggestEntities,
  };
}
