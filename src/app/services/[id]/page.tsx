import { Metadata } from 'next';
import { generateEntityMetadata } from '@/lib/seo/metadata';
import PublicEntityDetailPage, {
  fetchEntityForMetadata,
  type EntityDetailConfig,
} from '@/components/public/PublicEntityDetailPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ROUTES } from '@/config/routes';

interface PageProps {
  params: Promise<{ id: string }>;
}

const config: EntityDetailConfig = {
  entityType: 'service',
  ownerLabel: 'Provider',
  createdLabel: 'Listed',
  descriptionTitle: 'About this Service',
  getViewRoute: id => ROUTES.SERVICES.VIEW(id),
  getJsonLdExtra: entity => ({
    ...(entity.price_btc && {
      offers: { '@type': 'Offer', priceCurrency: 'BTC', price: entity.price_btc },
    }),
    ...(entity.duration_minutes && { duration: `PT${entity.duration_minutes}M` }),
  }),
  renderDetails: entity => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entity.price_btc && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Price</span>
            <span className="text-xl font-bold text-tiffany-600">
              {Number(entity.price_btc)} BTC
            </span>
          </div>
        )}
        {entity.duration_minutes && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Duration</span>
            <span className="font-medium">{entity.duration_minutes} minutes</span>
          </div>
        )}
      </CardContent>
    </Card>
  ),
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const service = await fetchEntityForMetadata('service', id);
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
  return <PublicEntityDetailPage id={id} config={config} />;
}
