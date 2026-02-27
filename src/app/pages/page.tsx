import { redirect } from 'next/navigation';
import { ROUTES } from '@/config/routes';

export default function PagesRedirectPage() {
  redirect(ROUTES.DASHBOARD.PROJECTS);
}
