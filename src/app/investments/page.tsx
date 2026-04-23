/**
 * Public Investments Browse Page
 *
 * Redirects to the discover page with investments tab selected.
 * Investments are discoverable alongside loans in the finance section of Discover.
 */

import { redirect } from 'next/navigation';

export default function InvestmentsPage() {
  redirect('/discover?type=investments');
}
