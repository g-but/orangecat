import { redirect } from 'next/navigation';

export default function GroupsPage() {
  redirect('/discover?type=groups');
}
