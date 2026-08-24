'use client';

import { useEffect, useState } from 'react';
import { fetchDiscoverGenericData } from './discoverGenericFetcher';
import type { DiscoverTabType } from '@/components/discover/DiscoverTabs';
import type { GenericPublicEntity } from '@/components/entity/variants/GenericPublicCard';

const GENERIC_TABS: DiscoverTabType[] = [
  'causes',
  'events',
  'products',
  'services',
  'organizations',
  'circles',
  'wishlists',
  'research',
  'ai_assistants',
  'all',
];

interface DiscoverGenericData {
  causes: GenericPublicEntity[];
  events: GenericPublicEntity[];
  products: GenericPublicEntity[];
  services: GenericPublicEntity[];
  groups: GenericPublicEntity[];
  circles: GenericPublicEntity[];
  wishlists: GenericPublicEntity[];
  research: GenericPublicEntity[];
  aiAssistants: GenericPublicEntity[];
  genericLoading: boolean;
}

export function useDiscoverGenericData(
  activeTab: DiscoverTabType,
  searchTerm: string
): DiscoverGenericData {
  const [causes, setCauses] = useState<GenericPublicEntity[]>([]);
  const [events, setEvents] = useState<GenericPublicEntity[]>([]);
  const [products, setProducts] = useState<GenericPublicEntity[]>([]);
  const [services, setServices] = useState<GenericPublicEntity[]>([]);
  const [groups, setGroups] = useState<GenericPublicEntity[]>([]);
  const [circles, setCircles] = useState<GenericPublicEntity[]>([]);
  const [wishlists, setWishlists] = useState<GenericPublicEntity[]>([]);
  const [research, setResearch] = useState<GenericPublicEntity[]>([]);
  const [aiAssistants, setAiAssistants] = useState<GenericPublicEntity[]>([]);
  const [genericLoading, setGenericLoading] = useState(false);

  useEffect(() => {
    if (!GENERIC_TABS.includes(activeTab)) {
      return;
    }
    fetchDiscoverGenericData(activeTab, searchTerm, {
      setGenericLoading,
      setCauses,
      setEvents,
      setProducts,
      setServices,
      setGroups,
      setCircles,
      setWishlists,
      setResearch,
      setAiAssistants,
    });
  }, [activeTab, searchTerm]);

  return {
    causes,
    events,
    products,
    services,
    groups,
    circles,
    wishlists,
    research,
    aiAssistants,
    genericLoading,
  };
}
