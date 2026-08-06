'use client';

import { Suspense } from 'react';
import { ResetPasswordForm } from './ResetPasswordForm';

/**
 * The form lives in its own module and this page is only its Suspense boundary.
 *
 * `useSearchParams` needs one, and until now the root layout supplied a single
 * boundary for every page at once. That blanket boundary meant the response
 * started streaming before any page could run an existence check, so every
 * notFound() in the app resolved to HTTP 200 — a mistyped pay link answered
 * "200 OK". Pages that need a boundary now carry their own.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
