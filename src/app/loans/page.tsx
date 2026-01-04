/**
 * Loans Browse Page
 *
 * Redirects to the discover page with loans tab selected.
 *
 * Created: 2025-12-31
 */

import { redirect } from 'next/navigation';

export default function LoansPage() {
  redirect('/discover?type=loans');
}
