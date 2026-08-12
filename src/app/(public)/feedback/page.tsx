import { FeedbackClient } from '@/components/feedback/FeedbackClient';

export const metadata = {
  title: 'Feedback & questions',
  description:
    'Ask the Cat anything about OrangeCat, or tell us what could be better. No account needed — the Cat answers right away, and a human reads every message.',
};

/**
 * /feedback — the one public place to talk TO the platform. One box, no
 * account: questions get an immediate Cat answer, feedback gets acknowledged,
 * and every exchange is stored so the Cat learns from real customer
 * interactions (see src/services/cat/platform-feedback.ts).
 */
export default function FeedbackPage() {
  return <FeedbackClient />;
}
