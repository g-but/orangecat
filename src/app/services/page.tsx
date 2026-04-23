import { redirect } from 'next/navigation';

export default function ServicesPage() {
  redirect('/discover?type=services');
}
