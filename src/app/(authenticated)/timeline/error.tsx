'use client';

import { RouteError } from '@/components/ui/RouteError';

export default function TimelineError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} context="Timeline" />;
}
