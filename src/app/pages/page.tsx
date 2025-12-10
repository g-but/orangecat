import { redirect } from 'next/navigation'

export default function PagesRedirectPage() {
  redirect('/dashboard/projects')
}
