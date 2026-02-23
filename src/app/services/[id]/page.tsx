import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, ArrowLeft, Tag, MessageSquare } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import { getTableName } from '@/config/entity-registry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { generateEntityMetadata } from '@/lib/seo/metadata';
import { generateEntityJsonLd, JsonLdScript } from '@/lib/seo/structured-data';
import EntityShare from '@/components/sharing/EntityShare';
import PublicEntityOwnerCard from '@/components/public/PublicEntityOwnerCard';
import PublicEntityTimestamps from '@/components/public/PublicEntityTimestamps';
import PublicEntityCTA from '@/components/public/PublicEntityCTA';
import { fetchEntityOwner } from '@/lib/entities/fetchEntityOwner';
import { ROUTES } from '@/config/routes';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data } = await supabase
    .from(getTableName('service'))
    .select('title, description, price_sats')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = data as any;
  if (!service) {
    return {
      title: 'Service Not Found | OrangeCat',
      description: 'The service you are looking for does not exist.',
    };
  }

  return generateEntityMetadata({
    type: 'service',
    id,
    title: service.title,
    description: service.description,
  });
}

export default async function PublicServicePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from(getTableName('service'))
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = data as any;
  if (error || !service) {
    notFound();
  }

  const provider = await fetchEntityOwner(supabase, service);

  const jsonLd = generateEntityJsonLd({
    type: 'service',
    id,
    title: service.title,
    description: service.description,
    extra: {
      ...(service.price_sats && {
        offers: {
          '@type': 'Offer',
          priceCurrency: 'SATS',
          price: service.price_sats,
        },
      }),
      ...(service.duration_minutes && {
        duration: `PT${service.duration_minutes}M`,
      }),
    },
  });

  return (
    <>
      <JsonLdScript data={jsonLd} />
      <div className="min-h-screen bg-gradient-to-br from-tiffany-50/50 via-white to-blue-50/30">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link
              href={ROUTES.DISCOVER}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Discover
            </Link>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-tiffany-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-tiffany-600" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{service.title}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="default" className="capitalize">
                      {service.status}
                    </Badge>
                    {service.category && (
                      <Badge variant="secondary">
                        <Tag className="w-3 h-3 mr-1" />
                        {service.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {service.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">About this Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{service.description}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {service.price_sats && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Price</span>
                      <span className="text-xl font-bold text-tiffany-600">
                        {Number(service.price_sats).toLocaleString()} sats
                      </span>
                    </div>
                  )}
                  {service.duration_minutes && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Duration</span>
                      <span className="font-medium">{service.duration_minutes} minutes</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {provider && <PublicEntityOwnerCard owner={provider} label="Provider" />}

              <EntityShare
                entityType="service"
                entityId={id}
                title={service.title}
                description={service.description}
              />

              <PublicEntityCTA
                href={`${ROUTES.AUTH}?mode=login&from=${ROUTES.SERVICES.VIEW(id)}`}
                icon={MessageSquare}
                label="Contact Provider"
                description="Sign in to contact the provider or book this service"
              />

              <PublicEntityTimestamps
                createdAt={service.created_at}
                updatedAt={service.updated_at}
                createdLabel="Listed"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
