import { redirect } from 'next/navigation';

export default function ResearchPage() {
  redirect('/discover?type=research');
}
