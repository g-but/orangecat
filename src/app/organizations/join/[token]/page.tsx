'use client';

/**
 * Accept an organization invitation via token link.
 *
 * Created: 2026-08-20
 * Last Modified: 2026-08-20
 * Last Modified Summary: Join page for /organizations/join/[token]
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';

interface InvitationPreview {
  id: string;
  group_id: string;
  group_name: string;
  group_slug: string;
  group_description?: string;
  group_member_count: number;
  role: string;
  inviter_name?: string;
  expires_at: string;
  is_expired: boolean;
}

export default function OrganizationJoinPage() {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : '';
  const router = useRouter();
  const { user, hydrated, isLoading: authLoading } = useAuth();

  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoadError('Missing invitation token');
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/invitations/by-token/${encodeURIComponent(token)}`);
        const body = (await res.json()) as {
          success?: boolean;
          data?: { invitation?: InvitationPreview };
          error?: string;
        };
        if (cancelled) {
          return;
        }
        if (!res.ok || !body.data?.invitation) {
          setLoadError(body.error ?? 'Invitation not found');
          setLoading(false);
          return;
        }
        setInvitation(body.data.invitation);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setLoadError('Could not load invitation');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const accept = useCallback(async () => {
    if (!token || !invitation) {
      return;
    }
    setAccepting(true);
    setAcceptError(null);
    try {
      const res = await fetch(`/api/invitations/by-token/${encodeURIComponent(token)}`, {
        method: 'POST',
      });
      const body = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !body.success) {
        setAcceptError(body.error ?? 'Could not accept invitation');
        setAccepting(false);
        return;
      }
      router.push(ROUTES.GROUPS.VIEW(invitation.group_slug));
    } catch {
      setAcceptError('Could not accept invitation');
      setAccepting(false);
    }
  }, [token, invitation, router]);

  if (loading || !hydrated || authLoading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center text-fg-secondary">
        Loading invitation…
      </main>
    );
  }

  if (loadError || !invitation) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-fg-primary mb-3">Invitation unavailable</h1>
        <p className="text-fg-secondary mb-6">{loadError ?? 'This link is invalid or expired.'}</p>
        <Button href={ROUTES.DISCOVER_TYPE('organizations')}>Browse organizations</Button>
      </main>
    );
  }

  if (invitation.is_expired) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-fg-primary mb-3">Invitation expired</h1>
        <p className="text-fg-secondary mb-6">
          Ask {invitation.inviter_name ?? 'the organizer'} for a new invite to{' '}
          <strong>{invitation.group_name}</strong>.
        </p>
        <Button href={ROUTES.GROUPS.VIEW(invitation.group_slug)}>View organization</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <p className="text-sm text-fg-tertiary mb-2">Organization invitation</p>
      <h1 className="text-3xl font-semibold text-fg-primary mb-3">{invitation.group_name}</h1>
      {invitation.group_description ? (
        <p className="text-fg-secondary mb-4 leading-relaxed">{invitation.group_description}</p>
      ) : null}
      <p className="text-sm text-fg-tertiary mb-8">
        {invitation.inviter_name ? `${invitation.inviter_name} invited you` : 'You were invited'} as{' '}
        <span className="text-fg-secondary">{invitation.role}</span>
        {invitation.group_member_count > 0
          ? ` · ${invitation.group_member_count} member${invitation.group_member_count === 1 ? '' : 's'}`
          : null}
      </p>

      {!user ? (
        <div className="space-y-3">
          <p className="text-fg-secondary">Sign in to join this organization.</p>
          <Button
            href={`/auth?mode=login&next=${encodeURIComponent(`/organizations/join/${token}`)}`}
          >
            Sign in to accept
          </Button>
          <p className="text-sm text-fg-tertiary">
            Or{' '}
            <Link
              href={`/auth?mode=register&next=${encodeURIComponent(`/organizations/join/${token}`)}`}
              className="underline"
            >
              create an account
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {acceptError ? <p className="text-sm text-status-negative">{acceptError}</p> : null}
          <Button onClick={accept} isLoading={accepting}>
            Join {invitation.group_name}
          </Button>
        </div>
      )}
    </main>
  );
}
