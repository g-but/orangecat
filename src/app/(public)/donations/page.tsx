import { redirect } from 'next/navigation';
import { ROUTES } from '@/config/routes';

export default function DonationsRedirectPage() {
  // Anonymous visitors land here from old links — send them to the public
  // support page, never into an auth-gated dashboard route.
  redirect(ROUTES.SUPPORT);
}
