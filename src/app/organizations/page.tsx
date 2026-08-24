import { redirect } from 'next/navigation';
import { ROUTES } from '@/config/routes';

export default function GroupsPage() {
  redirect(ROUTES.DISCOVER_TYPE('organizations'));
}
