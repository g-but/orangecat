'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/utils/logger';

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    params
      .then(({ conversationId }) => {
        if (!active) {
          return;
        }
        router.replace(`/messages?id=${encodeURIComponent(conversationId)}`);
      })
      .catch((err: unknown) => { logger.warn('Legacy conversationId redirect failed', { err }, 'messages/[conversationId]'); });
    return () => {
      active = false;
    };
  }, [params, router]);
  return null;
}
