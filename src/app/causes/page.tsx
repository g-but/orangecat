import { redirect } from 'next/navigation';

export default function CausesPage() {
  redirect('/discover?type=causes');
}
