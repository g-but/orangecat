import { notFound } from 'next/navigation'
import { getInitiative } from '@/data/initiatives'
import DemoPage from '@/components/pages/DemoPage'

interface DemoPageProps {
  params: {
    initiative: string
  }
}

export default function Demo({ params }: DemoPageProps) {
  const initiative = getInitiative(params.initiative)
  
  if (!initiative) {
    notFound()
  }

  return <DemoPage initiative={initiative} />
}

export async function generateStaticParams() {
  return [
    { initiative: 'organizations' },
    { initiative: 'events' },
    { initiative: 'projects' },
    { initiative: 'people' },
    { initiative: 'assets' },
    { initiative: 'fundraising' }
  ]
} 