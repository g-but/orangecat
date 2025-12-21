import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import EntityDetailLayout from '@/components/entity/EntityDetailLayout'
import Link from 'next/link'
import Button from '@/components/ui/Button'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) redirect('/auth?mode=login&from=/dashboard/services')

  const { data: service, error } = await supabase
    .from('user_services')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !service) notFound()

  const headerActions = (
    <Link href={`/dashboard/services/create?edit=${service.id}`}>
      <Button>Edit</Button>
    </Link>
  )

  const priceLabel = [
    service.hourly_rate_sats ? `${service.hourly_rate_sats} sats/hour` : null,
    service.fixed_price_sats ? `${service.fixed_price_sats} sats` : null,
  ].filter(Boolean).join(' or ')

  return (
    <EntityDetailLayout
      title={service.title}
      subtitle={service.description || ''}
      headerActions={headerActions}
      left={
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-gray-500">Status</div>
            <div className="font-medium">{service.status}</div>
            <div className="text-gray-500">Category</div>
            <div className="font-medium">{service.category}</div>
            <div className="text-gray-500">Pricing</div>
            <div className="font-medium">{priceLabel || 'Contact for pricing'}</div>
            <div className="text-gray-500">Location</div>
            <div className="font-medium">{service.service_location_type}</div>
            {service.duration_minutes && (
              <>
                <div className="text-gray-500">Duration</div>
                <div className="font-medium">{service.duration_minutes} minutes</div>
              </>
            )}
          </div>
        </div>
      }
      right={
        <div className="space-y-3 text-sm">
          <div className="text-gray-500">Created</div>
          <div className="font-medium">{new Date(service.created_at).toLocaleString()}</div>
          <div className="text-gray-500">Updated</div>
          <div className="font-medium">{new Date(service.updated_at).toLocaleString()}</div>
        </div>
      }
    />
  )
}

