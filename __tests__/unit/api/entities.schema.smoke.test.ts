import {
  projectSchema,
  userProductSchema,
  userServiceSchema,
  userCauseSchema,
  assetSchema,
  loanSchema,
  eventSchema,
  wishlistSchema,
  aiAssistantSchema,
  documentSchema,
} from '@/lib/validation';

describe('Entity schema smoke validation', () => {
  it('accepts valid project payload', () => {
    const result = projectSchema.safeParse({
      title: 'Test Project',
      description: 'A project for schema smoke tests',
      category: 'technology',
      goal_amount_sats: 100000,
      min_funding_sats: 1000,
      funding_type: 'all_or_nothing',
      deadline: new Date(Date.now() + 86400000).toISOString(),
      currency: 'SATS',
      transparency_mode: 'public',
      status: 'draft',
    });

    expect(result.success).toBe(true);
  });

  it('accepts valid product payload', () => {
    const result = userProductSchema.safeParse({
      title: 'Smoke Product',
      description: 'desc',
      category: 'test',
      price: 1500,
      currency: 'SATS',
      product_type: 'physical',
      images: [],
    });

    expect(result.success).toBe(true);
  });

  it('accepts valid service payload', () => {
    const result = userServiceSchema.safeParse({
      title: 'Smoke Service',
      description: 'desc',
      category: 'consulting',
      fixed_price: 5000,
      currency: 'SATS',
      service_location_type: 'remote',
    });

    expect(result.success).toBe(true);
  });

  it('accepts valid cause payload', () => {
    const result = userCauseSchema.safeParse({
      title: 'Smoke Cause',
      description: 'desc',
      cause_category: 'charity',
      goal_amount: 20000,
      currency: 'SATS',
      lightning_address: '',
      beneficiaries: [],
    });

    expect(result.success).toBe(true);
  });

  it('accepts valid asset payload', () => {
    const result = assetSchema.safeParse({
      title: 'Smoke Asset',
      type: 'real_estate',
      description: 'Asset description',
      estimated_value: 1000000,
      currency: 'SATS',
      documents: [],
    });

    expect(result.success).toBe(true);
  });

  it('accepts valid loan payload', () => {
    const result = loanSchema.safeParse({
      title: 'Smoke Loan',
      description: 'Loan description long enough',
      loan_type: 'new_request',
      original_amount: 100000,
      remaining_balance: 100000,
      interest_rate: 5,
      lightning_address: '',
      collateral: [],
    });

    expect(result.success).toBe(true);
  });

  it('accepts valid event payload', () => {
    const result = eventSchema.safeParse({
      title: 'Smoke Event',
      description: 'desc',
      start_date: new Date(Date.now() + 86400000).toISOString(),
      end_date: new Date(Date.now() + 2 * 86400000).toISOString(),
      event_type: 'workshop',
      is_online: true,
      online_url: 'https://example.com/meet',
      ticket_price: 1000,
      currency: 'SATS',
      lightning_address: '',
    });

    expect(result.success).toBe(true);
  });

  it('accepts valid wishlist payload', () => {
    const result = wishlistSchema.safeParse({
      title: 'Smoke Wishlist',
      description: 'desc',
      category: 'general',
      visibility: 'public',
    });

    expect(result.success).toBe(true);
  });

  it('accepts valid ai assistant payload', () => {
    const result = aiAssistantSchema.safeParse({
      title: 'Smoke Assistant',
      description: 'desc',
      system_prompt: 'You are a helpful assistant for testing.',
      category: 'general',
      model_preference: 'gpt-4o-mini',
      pricing_model: 'per_message',
      price_per_message: 10,
      lightning_address: '',
    });

    expect(result.success).toBe(true);
  });

  it('accepts valid document payload', () => {
    const result = documentSchema.safeParse({
      title: 'Smoke Document',
      content: 'content',
      category: 'notes',
      visibility: 'private',
    });

    expect(result.success).toBe(true);
  });
});
