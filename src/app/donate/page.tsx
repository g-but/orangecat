import { redirect } from 'next/navigation'

export default function DonateRedirect() {
  // Centralize donation UX on project pages for clarity.
  redirect('/discover')
}
