/**
 * Contract Types Configuration (SSOT)
 *
 * Defines all contract types and their term schemas.
 * Adding a new type = adding entry here.
 */

export const CONTRACT_TYPES = {
  employment: {
    id: 'employment',
    name: 'Employment',
    description: 'Employment relationship',
    default_terms: {
      job_title: '',
      employment_type: 'full_time', // 'full_time' | 'part_time' | 'contractor' | 'temporary'
      salary: 0,
      payment_frequency: 'monthly', // 'monthly' | 'weekly' | 'one_time'
      start_date: null,
      end_date: null,
    },
    term_fields: [
      { name: 'job_title', type: 'text', required: true },
      { name: 'employment_type', type: 'select', options: ['full_time', 'part_time', 'contractor', 'temporary'] },
      { name: 'salary', type: 'number', required: true },
      { name: 'payment_frequency', type: 'select', options: ['monthly', 'weekly', 'one_time'] },
      { name: 'start_date', type: 'date' },
      { name: 'end_date', type: 'date' },
    ],
  },
  service: {
    id: 'service',
    name: 'Service',
    description: 'Service provision',
    default_terms: {
      service_type: '',
      compensation: 0,
      payment_type: 'one_time', // 'one_time' | 'recurring' | 'milestone'
      deliverables: [],
      timeline: null,
    },
    term_fields: [
      { name: 'service_type', type: 'text', required: true },
      { name: 'compensation', type: 'number', required: true },
      { name: 'payment_type', type: 'select', options: ['one_time', 'recurring', 'milestone'] },
      { name: 'deliverables', type: 'array' },
      { name: 'timeline', type: 'text' },
    ],
  },
  rental: {
    id: 'rental',
    name: 'Rental',
    description: 'Rental agreement',
    default_terms: {
      rental_unit: '',
      monthly_rent: 0,
      rent_period_months: 12,
      deposit: 0,
      utilities_included: false,
    },
    term_fields: [
      { name: 'rental_unit', type: 'text', required: true },
      { name: 'monthly_rent', type: 'number', required: true },
      { name: 'rent_period_months', type: 'number', required: true },
      { name: 'deposit', type: 'number' },
      { name: 'utilities_included', type: 'boolean' },
    ],
  },
  partnership: {
    id: 'partnership',
    name: 'Partnership',
    description: 'Partnership agreement',
    default_terms: {
      partnership_type: '',
      terms: '',
      duration: null,
    },
    term_fields: [
      { name: 'partnership_type', type: 'text', required: true },
      { name: 'terms', type: 'textarea', required: true },
      { name: 'duration', type: 'text' },
    ],
  },
} as const;

export type ContractType = keyof typeof CONTRACT_TYPES;

export function getContractTypeConfig(type: ContractType) {
  return CONTRACT_TYPES[type];
}

export function getAllContractTypes() {
  return Object.values(CONTRACT_TYPES);
}

