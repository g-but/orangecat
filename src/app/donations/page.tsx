import { redirect } from 'next/navigation'

export default function DonationsRedirectPage() {
  redirect('/dashboard/analytics')
}
