import { notFound } from 'next/navigation'
import { getInitiative } from '@/data/initiatives'
import DemoPage from '@/components/pages/DemoPage'

interface DemoPageProps {
  params: Promise<{
    initiative: string
  }>
}

export default async function Demo({ params }: DemoPageProps) {
  const { initiative } = await params
  const initiativeData = getInitiative(initiative)
  
  if (!initiativeData) {
    notFound()
  }

  return <DemoPage initiative={initiativeData} />
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