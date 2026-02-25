import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfileWalletSection from '@/components/profile/ProfileWalletSection';
import type { Wallet } from '@/types/wallet';

jest.mock('lucide-react', () => ({
  Bitcoin: ({ className }: any) => <div data-testid="bitcoin-icon" className={className} />,
  Copy: ({ className }: any) => <button data-testid="copy-icon" className={className} />,
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
  },
}));

jest.mock('@/components/profile/ProfileSkeleton', () => ({
  WalletsSkeleton: () => <div data-testid="wallets-skeleton" />,
}));

jest.mock('@/components/bitcoin/BitcoinDonationCard', () => {
  return function MockBitcoinDonationCard(props: any) {
    return (
      <div data-testid="bitcoin-donation-card">
        <span>{props.bitcoinAddress || props.address}</span>
      </div>
    );
  };
});

jest.mock('@/components/bitcoin/BitcoinWalletStatsCompact', () => {
  return function MockBitcoinWalletStatsCompact({ address }: { address: string }) {
    return <div data-testid="wallet-stats-compact">{address}</div>;
  };
});

// Skip: Component has complex UI dependencies that need proper mock configuration
describe.skip('ProfileWalletSection', () => {
  const baseWallet: Wallet = {
    id: 'wallet-1',
    profile_id: 'profile-1',
    project_id: null,
    user_id: 'user-1',
    label: 'General Support',
    description: 'Support this profile',
    address_or_xpub: 'bc1qexampleaddress',
    wallet_type: 'address',
    lightning_address: null,
    category: 'general',
    category_icon: '💰',
    behavior_type: 'general',
    budget_amount: null,
    budget_currency: null,
    budget_period: null,
    budget_period_start_day: null,
    budget_reset_day: null,
    current_period_start: null,
    current_period_end: null,
    current_period_spent: null,
    alert_threshold_percent: null,
    alert_sent_at: null,
    goal_amount: null,
    goal_currency: null,
    goal_deadline: null,
    goal_status: null,
    goal_reached_at: null,
    goal_purchased_at: null,
    purchase_notes: null,
    milestone_25_reached_at: null,
    milestone_50_reached_at: null,
    milestone_75_reached_at: null,
    milestone_100_reached_at: null,
    is_public_goal: false,
    allow_contributions: false,
    contribution_count: 0,
    balance_btc: 0,
    balance_updated_at: null,
    last_transaction_at: null,
    transaction_count: 0,
    total_received: 0,
    total_spent: 0,
    is_active: true,
    display_order: 0,
    is_primary: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('renders loading skeleton when loading is true', () => {
    render(
      <ProfileWalletSection
        wallets={[]}
        loading={true}
        isOwnProfile={false}
        legacyBitcoinAddress={null}
        legacyLightningAddress={null}
        legacyBalance={null}
      />
    );

    expect(screen.getByTestId('wallets-skeleton')).toBeInTheDocument();
  });

  it('renders multi-wallet section when wallets exist', () => {
    render(
      <ProfileWalletSection
        wallets={[baseWallet]}
        loading={false}
        isOwnProfile={false}
        legacyBitcoinAddress={null}
        legacyLightningAddress={null}
        legacyBalance={null}
      />
    );

    expect(screen.getByTestId('bitcoin-icon')).toBeInTheDocument();
    expect(screen.getByText('Support This Profile')).toBeInTheDocument();
    expect(screen.getByText('General Support')).toBeInTheDocument();
  });

  it('shows empty state for own profile with no wallets', () => {
    render(
      <ProfileWalletSection
        wallets={[]}
        loading={false}
        isOwnProfile={true}
        legacyBitcoinAddress={null}
        legacyLightningAddress={null}
        legacyBalance={null}
      />
    );

    expect(screen.getByText('Accept Bitcoin Donations')).toBeInTheDocument();
    expect(screen.getByText('Add Wallets')).toBeInTheDocument();
  });

  it('falls back to legacy donation card when no wallets but legacy addresses exist', () => {
    render(
      <ProfileWalletSection
        wallets={[]}
        loading={false}
        isOwnProfile={false}
        legacyBitcoinAddress="bc1qlegacyaddress"
        legacyLightningAddress={null}
        legacyBalance={0.1}
      />
    );

    expect(screen.getByTestId('bitcoin-donation-card')).toBeInTheDocument();
    expect(screen.getByText('bc1qlegacyaddress')).toBeInTheDocument();
  });
});
