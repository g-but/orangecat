'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import MessagePanel from '@/components/messaging/MessagePanel';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { API_ROUTES } from '@/config/api-routes';
import { ROUTES } from '@/config/routes';

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idFromUrl = searchParams?.get('id') || searchParams?.get('c') || undefined;
  const toUserId = searchParams?.get('to') || undefined;
  const [openedId, setOpenedId] = useState<string | undefined>(undefined);
  const { isLoading, isAuthenticated } = useRequireAuth();

  useEffect(() => {
    if (!isAuthenticated || !toUserId || idFromUrl) {
      return;
    }
    let cancelled = false;
    fetch(API_ROUTES.MESSAGES.OPEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ participantIds: [toUserId] }),
    })
      .then(async res => {
        const json = await res.json().catch(() => ({}));
        const conversationId = json?.data?.conversationId as string | undefined;
        if (!cancelled && conversationId) {
          setOpenedId(conversationId);
          router.replace(ROUTES.MESSAGES_WITH_CONVERSATION(conversationId));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, toUserId, idFromUrl, router]);

  const id = idFromUrl || openedId;

  // Show loading while auth is being checked
  if (isLoading) {
    return <Loading fullScreen contextual message="Loading messages..." />;
  }

  // useRequireAuth will redirect if not authenticated
  if (!isAuthenticated) {
    return <Loading fullScreen contextual message="Redirecting to login..." />;
  }

  return <MessagePanel isOpen fullPage initialConversationId={id} onClose={() => {}} />;
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<Loading fullScreen contextual message="Loading messages..." />}>
      <MessagesContent />
    </Suspense>
  );
}
