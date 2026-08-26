/**
 * JURISDICTION ENTITY CONFIGURATION (FORM)
 *
 * Adding a government body to the civic directory.
 *
 * What this form cannot do is as important as what it can: it cannot set
 * verification status, and it cannot attach payment rails that anyone will
 * trust. Every row lands `unclaimed`. That is what makes an open directory
 * safe — anyone may list "Stadt Zürich", nobody may claim to BE it, and money
 * moves only after the body itself proves control and the evidence is reviewed
 * server-side.
 */

import { Landmark } from 'lucide-react';
import { jurisdictionSchema, type JurisdictionFormData } from '@/lib/validation';
import type { FieldGroup } from '@/components/create/types';
import { createEntityConfig } from './base-config-factory';
import { JURISDICTION_LEVELS_BY_RANK, JURISDICTION_LEVEL_META } from '@/config/jurisdictions';
import { currencySelectOptions, PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';

const fieldGroups: FieldGroup[] = [
  {
    id: 'identity',
    title: 'Which body',
    description: 'Its name, and where it sits in the chain above a resident',
    fields: [
      {
        name: 'title',
        label: 'Official name',
        type: 'text',
        placeholder: 'e.g., Stadt Zürich',
        required: true,
        colSpan: 2,
        hint: 'Use the name the body uses for itself, in its own language.',
      },
      {
        name: 'level',
        label: 'Tier',
        type: 'radio',
        required: true,
        colSpan: 2,
        options: JURISDICTION_LEVELS_BY_RANK.map(level => ({
          value: level,
          label: `${JURISDICTION_LEVEL_META[level].label} — ${JURISDICTION_LEVEL_META[level].localNames.slice(0, 3).join(', ')}`,
          description: JURISDICTION_LEVEL_META[level].description,
        })),
      },
      {
        name: 'description',
        label: 'What it is responsible for',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        placeholder: 'Schools, transit, utilities, social services…',
        hint: 'A person deciding a split needs to know what each tier actually does.',
      },
    ],
  },
  {
    id: 'place',
    title: 'Where',
    description: 'So a resident’s chain can be resolved from their location',
    fields: [
      {
        name: 'country_code',
        label: 'Country code',
        type: 'text',
        placeholder: 'CH',
        colSpan: 1,
        hint: 'Two letters, ISO 3166-1 (CH, DE, US).',
      },
      {
        name: 'region_code',
        label: 'Region code',
        type: 'text',
        placeholder: 'CH-ZH',
        colSpan: 1,
        hint: 'ISO 3166-2, where one exists.',
      },
      {
        name: 'locality',
        label: 'Locality',
        type: 'text',
        placeholder: 'Zürich',
        colSpan: 1,
      },
      {
        name: 'population',
        label: 'Population',
        type: 'number',
        min: 0,
        colSpan: 1,
      },
      {
        name: 'official_url',
        label: 'Official website',
        type: 'url',
        placeholder: 'https://www.stadt-zuerich.ch',
        colSpan: 2,
        hint: 'The body’s own domain. This is what a claim is later checked against.',
      },
    ],
  },
  {
    id: 'budget',
    title: 'Published budget',
    description: 'The denominator a share is a share of',
    fields: [
      {
        name: 'annual_budget',
        label: 'Annual budget',
        type: 'currency',
        colSpan: 1,
      },
      {
        name: 'budget_year',
        label: 'Budget year',
        type: 'number',
        colSpan: 1,
      },
      {
        name: 'currency',
        label: 'Currency',
        type: 'select',
        colSpan: 1,
        options: currencySelectOptions,
      },
      {
        name: 'budget_url',
        label: 'Link to the published budget',
        type: 'url',
        colSpan: 2,
        hint: 'A number without a source is a rumour. Link where it came from.',
      },
      {
        name: 'tags',
        label: 'Tags',
        type: 'tags',
        colSpan: 2,
      },
    ],
  },
];

export const jurisdictionConfig = createEntityConfig<JurisdictionFormData>({
  entityType: 'jurisdiction',
  icon: Landmark,
  pageTitle: 'Add a government body',
  pageDescription:
    'List a municipality, region or federation so people can direct money toward it. Listing is not claiming — the body itself claims its page later.',
  formTitle: 'Directory entry',
  formDescription: 'Public facts only. Nothing here routes money.',
  fieldGroups,
  validationSchema: jurisdictionSchema,
  defaultValues: {
    title: '',
    description: '',
    level: 'local',
    parent_id: null,
    country_code: '',
    region_code: '',
    locality: '',
    population: null,
    official_url: '',
    currency: PLATFORM_DEFAULT_CURRENCY,
    annual_budget: null,
    budget_year: null,
    budget_url: '',
    status: 'active',
    tags: [],
    avatar_url: '',
    cover_image_url: '',
  },
  guidanceContent: {
    level: {
      title: 'The chain, not the label',
      description:
        '"Local, state, federal" is one country’s vocabulary. What matters is containment: each tier sits inside the next, and a person belongs to one of each.',
      icon: null,
      tips: [],
    },
    official_url: {
      title: 'The domain is the evidence',
      description:
        'When the body later claims this page, control of this domain is what it proves. Getting it right now is what makes the claim possible at all.',
      icon: null,
      tips: [],
    },
  },
  defaultGuidance: {
    title: 'An open directory, honestly labelled',
    description:
      'Anyone can list a government body. Nobody can claim to be one. Every entry starts unclaimed and says so plainly, and money moves only after the body proves the page is theirs.',
    features: [
      { icon: '🏛️', text: 'Municipality, district, region, federation, or union' },
      { icon: '🔗', text: 'Sits under a parent — the chain a resident belongs to' },
      { icon: '📄', text: 'Published budget, with a link to the source' },
      { icon: '🔒', text: 'Unclaimed until proved — an allocation to it records intent' },
    ],
  },
  successMessage: 'Added to the directory.',
});
