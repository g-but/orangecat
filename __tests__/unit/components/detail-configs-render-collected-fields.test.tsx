/**
 * A field a user fills in must appear on the page that shows the entity.
 *
 * Both regressions pinned here shipped and stayed invisible for the same reason:
 * the section rendered SOME of what the form collected, so it looked complete.
 *
 *   - Loans: the refinance form asks for the current rate and the desired rate —
 *     the two numbers that define a refinance — and the public loan page showed
 *     neither, while showing `monthly_payment` from that same form section. A
 *     lender could not see the spread they were being asked to beat.
 *   - Events: the form collects a full postal address, and the page rendered
 *     only the free-text `location`, so attendees could not find the venue. The
 *     online join link had the same fate.
 *
 * The class is gated by scripts/check-dead-fields.mjs; these are the instances.
 */

import { render, screen } from '@testing-library/react';
import { loanDetailConfig } from '@/components/public/detail-configs/loan';
import { eventDetailConfig } from '@/components/public/detail-configs/event';

describe('loan detail config', () => {
  const refinance = {
    id: 'loan-1',
    created_at: '2026-08-01T00:00:00Z',
    currency: 'CHF',
    original_amount: 10000,
    remaining_balance: 8000,
    loan_type: 'existing_refinance',
    current_lender: 'Zürcher Kantonalbank',
    current_interest_rate: 8.5,
    desired_rate: 5,
    monthly_payment: 500,
  };

  it('shows the current and desired rates a refinance is asking for', () => {
    render(<div>{loanDetailConfig.renderDetails?.(refinance)}</div>);

    expect(screen.getByText('Current Rate')).toBeInTheDocument();
    expect(screen.getByText('8.5% APR')).toBeInTheDocument();
    expect(screen.getByText('Desired Rate')).toBeInTheDocument();
    expect(screen.getByText('5% APR')).toBeInTheDocument();
    expect(screen.getByText(/3\.5 percentage point reduction/)).toBeInTheDocument();
  });

  it('reads the lender from the column the create form actually writes', () => {
    render(<div>{loanDetailConfig.renderDetails?.(refinance)}</div>);
    expect(screen.getByText(/Zürcher Kantonalbank/)).toBeInTheDocument();
  });

  it('falls back to lender_name, which lender-created obligations write instead', () => {
    render(
      <div>
        {loanDetailConfig.renderDetails?.({
          ...refinance,
          current_lender: null,
          lender_name: 'Private Lender',
        })}
      </div>
    );
    expect(screen.getByText(/Private Lender/)).toBeInTheDocument();
  });

  it('still shows the refinance terms when loan_type was never set', () => {
    render(
      <div>{loanDetailConfig.renderDetails?.({ ...refinance, loan_type: null })}</div>
    );
    expect(screen.getByText('8.5% APR')).toBeInTheDocument();
  });

  it('omits the refinance block entirely for a plain new-loan request', () => {
    render(
      <div>
        {loanDetailConfig.renderDetails?.({
          ...refinance,
          loan_type: 'new_request',
          current_interest_rate: null,
          desired_rate: null,
        })}
      </div>
    );
    expect(screen.queryByText('Refinancing')).not.toBeInTheDocument();
  });
});

describe('event detail config', () => {
  const event = {
    id: 'event-1',
    start_date: '2026-09-01T18:00:00Z',
    location: 'Community Center',
    venue_name: 'Community Center',
    venue_address: 'Bahnhofstrasse 1',
    venue_city: 'Zurich',
    venue_postal_code: '8001',
    venue_country: 'Switzerland',
    rsvp_deadline: '2026-08-28T18:00:00Z',
  };

  it('shows the postal address, not just the free-text location', () => {
    render(<div>{eventDetailConfig.renderDetails?.(event)}</div>);

    expect(screen.getByText('Bahnhofstrasse 1')).toBeInTheDocument();
    expect(screen.getByText('8001 Zurich')).toBeInTheDocument();
    expect(screen.getByText('Switzerland')).toBeInTheDocument();
  });

  it('shows the RSVP deadline the form asks for', () => {
    render(<div>{eventDetailConfig.renderDetails?.(event)}</div>);
    expect(screen.getByText(/RSVP by August 28, 2026/)).toBeInTheDocument();
  });

  it('links an online event to its join URL', () => {
    render(
      <div>
        {eventDetailConfig.renderDetails?.({
          ...event,
          online_url: 'https://meet.jit.si/BitcoinZurich',
        })}
      </div>
    );
    expect(screen.getByRole('link', { name: 'Join online' })).toHaveAttribute(
      'href',
      'https://meet.jit.si/BitcoinZurich'
    );
  });

  it('drops a join URL carrying a script scheme instead of linking it', () => {
    render(
      <div>
        {eventDetailConfig.renderDetails?.({
          ...event,
          // eslint-disable-next-line no-script-url
          online_url: 'javascript:alert(1)',
        })}
      </div>
    );
    expect(screen.queryByRole('link', { name: 'Join online' })).not.toBeInTheDocument();
  });
});
