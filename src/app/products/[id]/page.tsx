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
  entityType: 'product',
  ownerLabel: 'Seller',
  createdLabel: 'Listed',
  getViewRoute: id => ROUTES.PRODUCTS.VIEW(id),
  getJsonLdExtra: entity => ({
    ...(entity.price_btc && {
      offers: { '@type': 'Offer', priceCurrency: 'SATS', price: entity.price_btc },
    }),
  }),
  renderDetails: entity =>
    entity.price_btc ? (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Price</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-600">
            {Number(entity.price_btc)} BTC
          </p>
        </CardContent>
      </Card>
    ) : null,
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchEntityForMetadata('product', id);
  if (!product) {
    return {
      title: 'Product Not Found | OrangeCat',
      description: 'The product you are looking for does not exist.',
    };
  }
  return generateEntityMetadata({
    type: 'product',
    id,
    title: product.title,
    description: product.description,
  });
}

export default async function PublicProductPage({ params }: PageProps) {
  const { id } = await params;
  return <PublicEntityDetailPage id={id} config={config} />;
}
