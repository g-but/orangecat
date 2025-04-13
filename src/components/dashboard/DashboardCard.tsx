import { DashboardCard as DashboardCardType } from '@/types/dashboard'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

interface DashboardCardProps {
  card: DashboardCardType
}

export const DashboardCard = ({ card }: DashboardCardProps) => {
  const router = useRouter()

  return (
    <Card
      title={card.title}
      subtitle={card.subtitle}
    >
      <p className="text-gray-600 mb-4">{card.description}</p>
      <Button 
        variant={card.action.variant}
        onClick={() => router.push(card.action.href)}
        aria-label={`${card.action.label} - ${card.subtitle}`}
      >
        {card.action.label}
      </Button>
    </Card>
  )
} 