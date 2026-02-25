'use client';

import EntityDashboardPage from '@/components/entity/EntityDashboardPage';
import { eventEntityConfig, type Event } from '@/config/entities/events';

/**
 * Events Dashboard Page
 *
 * Manage your events - in-person gatherings and meetups with Bitcoin-powered ticketing.
 *
 * Created: 2025-01-30
 * Last Modified: 2026-02-24
 * Last Modified Summary: Migrated to EntityDashboardPage for consistent UX
 */
export default function EventsDashboardPage() {
  return (
    <EntityDashboardPage<Event>
      config={eventEntityConfig}
      title="My Events"
      description="Organize in-person gatherings and meetups with Bitcoin-powered ticketing"
      createButtonLabel="Create Event"
    />
  );
}
