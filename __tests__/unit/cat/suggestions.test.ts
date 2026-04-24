/**
 * Unit tests for generateSuggestionsFromContext and hasRichContext.
 * These are pure functions — no DB, no HTTP, no mocking needed.
 */

import {
  generateSuggestionsFromContext,
  hasRichContext,
  DEFAULT_SUGGESTIONS,
} from '@/services/ai/suggestions';
import type { FullUserContext } from '@/services/ai/document-context';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_STATS = {
  totalProducts: 0,
  totalServices: 0,
  totalProjects: 0,
  totalCauses: 0,
  totalEvents: 0,
  totalAssets: 0,
  totalLoans: 0,
  totalInvestments: 0,
  totalResearch: 0,
  totalWishlists: 0,
  totalTasks: 0,
  urgentTasks: 0,
  totalWallets: 0,
};

const EMPTY_PAYMENT: import('@/services/ai/document-context').PaymentCapabilities = {
  hasNwcWallet: false,
  lightningAddress: null,
};

function makeContext(overrides: Partial<FullUserContext> = {}): FullUserContext {
  return {
    profile: null,
    documents: [],
    entities: [],
    tasks: [],
    wallets: [],
    conversations: [],
    paymentCapabilities: EMPTY_PAYMENT,
    stats: { ...EMPTY_STATS },
    ...overrides,
  };
}

function makeEntity(
  type: string,
  title: string
): import('@/services/ai/document-context').EntitySummary {
  return { id: crypto.randomUUID(), type, title, status: 'active' };
}

function makeTask(title = 'Finish proposal'): import('@/services/ai/document-context').TaskSummary {
  return {
    id: crypto.randomUUID(),
    title,
    category: 'personal',
    priority: 'high',
    current_status: 'active',
    task_type: 'task',
  };
}

function makeWallet(): import('@/services/ai/document-context').WalletSummary {
  return {
    label: 'Savings',
    description: null,
    category: 'savings',
    behavior_type: 'goal',
    goal_amount: 0.01,
    goal_currency: 'BTC',
    goal_deadline: null,
    budget_amount: null,
    budget_period: null,
    is_primary: false,
    has_nwc: false,
    lightning_address: null,
  };
}

function makeDocument(
  title: string,
  document_type = 'goals',
  content = ''
): import('@/services/ai/document-context').DocumentContext {
  return {
    id: crypto.randomUUID(),
    title,
    content,
    document_type,
    visibility: 'cat_visible',
    created_at: new Date().toISOString(),
  };
}

// ─── hasRichContext ────────────────────────────────────────────────────────────

describe('hasRichContext', () => {
  it('returns false for completely empty context', () => {
    expect(hasRichContext(makeContext())).toBe(false);
  });

  it('returns true when profile has a name', () => {
    const ctx = makeContext({ profile: { name: 'Alice', username: 'alice' } });
    expect(hasRichContext(ctx)).toBe(true);
  });

  it('returns true when profile has a bio', () => {
    const ctx = makeContext({ profile: { bio: 'Builder', username: null } });
    expect(hasRichContext(ctx)).toBe(true);
  });

  it('returns true when profile has a background', () => {
    const ctx = makeContext({ profile: { background: 'Developer', username: null } });
    expect(hasRichContext(ctx)).toBe(true);
  });

  it('returns false when profile exists but is blank', () => {
    const ctx = makeContext({ profile: { username: 'alice', name: null, bio: null, background: null } });
    expect(hasRichContext(ctx)).toBe(false);
  });

  it('returns true when there is at least one entity', () => {
    const ctx = makeContext({ entities: [makeEntity('product', 'My Coffee')] });
    expect(hasRichContext(ctx)).toBe(true);
  });

  it('returns true when there is at least one document', () => {
    const ctx = makeContext({ documents: [makeDocument('My Goals')] });
    expect(hasRichContext(ctx)).toBe(true);
  });

  it('returns true when there is at least one task', () => {
    const ctx = makeContext({ tasks: [makeTask()] });
    expect(hasRichContext(ctx)).toBe(true);
  });

  it('returns true when there is at least one wallet', () => {
    const ctx = makeContext({ wallets: [makeWallet()] });
    expect(hasRichContext(ctx)).toBe(true);
  });
});

// ─── generateSuggestionsFromContext ───────────────────────────────────────────

describe('generateSuggestionsFromContext', () => {
  it('returns DEFAULT_SUGGESTIONS for completely empty context', () => {
    expect(generateSuggestionsFromContext(makeContext())).toEqual(DEFAULT_SUGGESTIONS);
  });

  it('returns at most 4 suggestions', () => {
    // Rich context with everything — should still cap at 4
    const ctx = makeContext({
      profile: { name: 'Alice', username: 'alice' },
      entities: [
        makeEntity('product', 'Coffee Beans'),
        makeEntity('service', 'Design Work'),
        makeEntity('project', 'School Fund'),
        makeEntity('cause', 'Clean Water'),
      ],
      documents: [makeDocument('2026 Goals')],
      tasks: [makeTask()],
      wallets: [makeWallet()],
      stats: { ...EMPTY_STATS, totalProducts: 1, totalServices: 1, totalProjects: 1, totalCauses: 1 },
    });
    expect(generateSuggestionsFromContext(ctx).length).toBeLessThanOrEqual(4);
  });

  it('generates named-entity suggestion for first product', () => {
    const ctx = makeContext({
      entities: [makeEntity('product', 'Handmade Candles')],
      stats: { ...EMPTY_STATS, totalProducts: 1 },
    });
    const suggestions = generateSuggestionsFromContext(ctx);
    expect(suggestions.some(s => s.includes('Handmade Candles'))).toBe(true);
  });

  it('generates named-entity suggestion for first service', () => {
    const ctx = makeContext({
      entities: [makeEntity('service', 'Logo Design')],
      stats: { ...EMPTY_STATS, totalServices: 1 },
    });
    const suggestions = generateSuggestionsFromContext(ctx);
    expect(suggestions.some(s => s.includes('Logo Design'))).toBe(true);
  });

  it('generates named-entity suggestion for first project', () => {
    const ctx = makeContext({
      entities: [makeEntity('project', 'Solar Panel Build')],
      stats: { ...EMPTY_STATS, totalProjects: 1 },
    });
    const suggestions = generateSuggestionsFromContext(ctx);
    expect(suggestions.some(s => s.includes('Solar Panel Build'))).toBe(true);
  });

  it('generates named-entity suggestion for first cause', () => {
    const ctx = makeContext({
      entities: [makeEntity('cause', 'Ocean Clean-Up')],
      stats: { ...EMPTY_STATS, totalCauses: 1 },
    });
    const suggestions = generateSuggestionsFromContext(ctx);
    expect(suggestions.some(s => s.includes('Ocean Clean-Up'))).toBe(true);
  });

  it('includes gap suggestion when user has products but no project or cause', () => {
    const ctx = makeContext({
      entities: [makeEntity('product', 'Merch')],
      stats: { ...EMPTY_STATS, totalProducts: 1 },
    });
    const suggestions = generateSuggestionsFromContext(ctx);
    expect(suggestions.some(s => s.toLowerCase().includes('project'))).toBe(true);
  });

  it('includes gap suggestion when user has services but no products', () => {
    const ctx = makeContext({
      entities: [makeEntity('service', 'Consulting')],
      stats: { ...EMPTY_STATS, totalServices: 1 },
    });
    const suggestions = generateSuggestionsFromContext(ctx);
    expect(suggestions.some(s => s.toLowerCase().includes('product'))).toBe(true);
  });

  it('includes task nudge when user has tasks', () => {
    const ctx = makeContext({
      tasks: [makeTask('Write report')],
      stats: { ...EMPTY_STATS, totalTasks: 1 },
      profile: { name: 'Alice', username: 'alice' },
    });
    const suggestions = generateSuggestionsFromContext(ctx);
    expect(suggestions.some(s => s.toLowerCase().includes('task'))).toBe(true);
  });

  it('includes wallet nudge when user has wallets', () => {
    const ctx = makeContext({
      wallets: [makeWallet()],
      stats: { ...EMPTY_STATS, totalWallets: 1 },
      profile: { name: 'Alice', username: 'alice' },
    });
    const suggestions = generateSuggestionsFromContext(ctx);
    expect(suggestions.some(s => s.toLowerCase().includes('saving') || s.toLowerCase().includes('goal'))).toBe(true);
  });

  it('returns document-based suggestions when only documents are present', () => {
    const ctx = makeContext({
      documents: [makeDocument('Learn Python', 'goals', 'I want to learn programming')],
    });
    const suggestions = generateSuggestionsFromContext(ctx);
    // Should get at least one suggestion referencing the doc title
    expect(suggestions.some(s => s.includes('Learn Python'))).toBe(true);
  });

  it('does not return duplicate suggestions', () => {
    const ctx = makeContext({
      entities: [
        makeEntity('product', 'Widget A'),
        makeEntity('product', 'Widget B'), // second product — no additional suggestion for same type
      ],
      stats: { ...EMPTY_STATS, totalProducts: 2 },
    });
    const suggestions = generateSuggestionsFromContext(ctx);
    const unique = new Set(suggestions);
    expect(unique.size).toBe(suggestions.length);
  });

  it('falls back to generic suggestions when context exists but produces no specific matches', () => {
    // Profile with a name but no entities/tasks/wallets/docs
    const ctx = makeContext({
      profile: { name: 'Alice', username: 'alice' },
    });
    const suggestions = generateSuggestionsFromContext(ctx);
    // Should still return something (gap nudge or generic)
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions).not.toEqual(DEFAULT_SUGGESTIONS);
  });
});
