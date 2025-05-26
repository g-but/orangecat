import { getInitiative } from '@/data/initiatives'
import DemoPage from '@/components/pages/DemoPage'

export default function FundraisingDemoPage() {
  const initiative = getInitiative('fundraising')
  
  if (!initiative) {
    return <div>Demo not found</div>
  }

  return <DemoPage initiative={initiative} />
} 