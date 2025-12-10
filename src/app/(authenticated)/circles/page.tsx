import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Organizations - OrangeCat',
  description: 'Organizations, teams, and circles for collaboration on OrangeCat.',
};

export default function CirclesPage() {
  // Redirect circles to organizations - circles are now part of organizations
  redirect('/organizations');
}
