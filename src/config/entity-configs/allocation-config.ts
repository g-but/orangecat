/**
 * ALLOCATION ENTITY CONFIGURATION (FORM)
 *
 * Creating a directive and building its split are two steps, and deliberately
 * so. This form takes the frame — what is being split, over what period, and
 * why — and lands the directive as a DRAFT. The split itself is built on the
 * directive's own page, where a person can see the running total and the tiers
 * side by side.
 *
 * That is not a limitation worked around: the split is the part that takes
 * thought, and the database will not let a directive leave draft until its
 * shares total 100%. Asking for percentages in the middle of a create form,
 * before the person has chosen who is even on the list, would produce a form
 * that cannot be submitted for a reason nobody caused.
 */

import { Scale } from 'lucide-react';
import { allocationSchema, type AllocationFormData } from '@/lib/validation';
import type { FieldGroup } from '@/components/create/types';
import { createEntityConfig } from './base-config-factory';
import {
  ALLOCATION_BASES,
  ALLOCATION_BASIS_META,
  ALLOCATION_CADENCES,
  ALLOCATION_CADENCE_LABELS,
} from '@/config/civic-allocation';
import { currencySelectOptions, PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';

const fieldGroups: FieldGroup[] = [
  {
    id: 'frame',
    title: 'What you are splitting',
    description: 'The money this directive covers, and how often it moves',
    fields: [
      {
        name: 'title',
        label: 'Name this directive',
        type: 'text',
        placeholder: 'e.g., My 2026 tax allocation',
        required: true,
        colSpan: 2,
        hint: 'People will see this next to your split. Say what it covers.',
      },
      {
        name: 'basis',
        label: 'What this covers',
        type: 'radio',
        required: true,
        colSpan: 2,
        options: ALLOCATION_BASES.map(basis => ({
          value: basis,
          label: ALLOCATION_BASIS_META[basis].label,
          description: ALLOCATION_BASIS_META[basis].description,
        })),
      },
      {
        name: 'cadence',
        label: 'How often',
        type: 'select',
        required: true,
        colSpan: 1,
        options: ALLOCATION_CADENCES.map(cadence => ({
          value: cadence,
          label: ALLOCATION_CADENCE_LABELS[cadence],
        })),
      },
      {
        name: 'currency',
        label: 'Currency',
        type: 'select',
        colSpan: 1,
        options: currencySelectOptions,
      },
      {
        name: 'period_start',
        label: 'Period starts',
        type: 'date',
        colSpan: 1,
      },
      {
        name: 'period_end',
        label: 'Period ends',
        type: 'date',
        colSpan: 1,
      },
      {
        name: 'reference_amount',
        label: 'Amount this splits (optional)',
        type: 'currency',
        colSpan: 2,
        hint: 'Leave blank if you would rather not publish what you pay — the split still says what it says.',
      },
    ],
  },
  {
    id: 'argument',
    title: 'Why',
    description: 'The case for your split — the part other people can weigh',
    fields: [
      {
        name: 'rationale',
        label: 'Your reasoning',
        type: 'textarea',
        rows: 8,
        colSpan: 2,
        placeholder:
          'Which tier is doing the work you actually see? What would change if it had more? What are you willing to give up for it?',
        hint: 'A split with a stated reason is an argument. A split without one is a preference.',
      },
      {
        name: 'description',
        label: 'Short summary',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        placeholder: 'One or two lines, shown in listings.',
      },
    ],
  },
  {
    id: 'publishing',
    title: 'Who can see it',
    description: 'A directive is only a signal if someone can count it',
    fields: [
      {
        name: 'visibility',
        label: 'Visibility',
        type: 'radio',
        required: true,
        colSpan: 2,
        options: [
          {
            value: 'public',
            label: 'Public',
            description:
              'Counted in what each government body shows as declared support. This is what turns your split into evidence.',
          },
          {
            value: 'unlisted',
            label: 'Unlisted',
            description: 'Reachable by link, not listed or counted.',
          },
          {
            value: 'private',
            label: 'Private',
            description: 'Only you. Useful for working out a position before taking it.',
          },
        ],
      },
      {
        name: 'show_on_profile',
        label: 'Show on my profile',
        type: 'boolean',
        colSpan: 2,
      },
      {
        name: 'tags',
        label: 'Tags',
        type: 'tags',
        placeholder: 'Add tags (press Enter after each)',
        colSpan: 2,
      },
    ],
  },
];

export const allocationConfig = createEntityConfig<AllocationFormData>({
  entityType: 'allocation',
  icon: Scale,
  pageTitle: 'Direct where your taxes go',
  pageDescription:
    'State what share of your taxes and contributions should reach each tier of government — and anything else you would rather fund directly.',
  formTitle: 'The frame',
  formDescription: 'Next you will build the split itself, line by line.',
  fieldGroups,
  validationSchema: allocationSchema,
  defaultValues: {
    title: '',
    description: '',
    basis: 'tax',
    cadence: 'annual',
    period_start: '',
    period_end: '',
    reference_amount: null,
    currency: PLATFORM_DEFAULT_CURRENCY,
    residency_jurisdiction_id: null,
    rationale: '',
    // Always draft. The directive cannot be published until its shares total
    // 100%, and at this point it has no shares at all.
    status: 'draft',
    visibility: 'public',
    show_on_profile: true,
    tags: [],
    lines: [],
  },
  guidanceContent: {
    basis: {
      title: 'Taxes and contributions are the same act',
      description:
        'The only difference between the money you owe and the money you give is who decided where it goes. Naming both in one directive is the point.',
      icon: null,
      tips: [],
    },
    rationale: {
      title: 'Say what you would trade',
      description:
        'The arguments that move anything are the ones that name a cost. "More to the city" persuades nobody; "more to the city, and I accept slower federal transfers" is a position.',
      icon: null,
      tips: [],
    },
    visibility: {
      title: 'Counted, not just stored',
      description:
        'Every public directive adds to what each government body shows as declared support — how many people have said what share it should get. That aggregate is what a governance vote can act on.',
      icon: null,
      tips: [],
    },
  },
  defaultGuidance: {
    title: 'A right that has to be exercised to exist',
    description:
      'Nobody is asked what share of their taxes should stay local. This is where you answer anyway — in public, in a form that can be counted.',
    features: [
      { icon: '🏛️', text: 'Split across your municipality, region and federation' },
      { icon: '🤝', text: 'Add a cause or project directly, beside the government lines' },
      { icon: '✍️', text: 'Say why — the reasoning is the part that travels' },
      { icon: '📊', text: 'Public splits are counted on each body’s page' },
    ],
  },
  successMessage: 'Directive created as a draft. Now build the split.',
});
