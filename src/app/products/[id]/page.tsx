import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Package, ArrowLeft, Tag, MessageSquare } from 'lucide-react';
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
    .from(getTableName('product'))
    .select('title, description, price_sats')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = data as any;
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
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from(getTableName('product'))
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = data as any;
  if (error || !product) {
    notFound();
  }

  const seller = await fetchEntityOwner(supabase, product);

  const jsonLd = generateEntityJsonLd({
    type: 'product',
    id,
    title: product.title,
    description: product.description,
    extra: {
      ...(product.price_sats && {
        offers: {
          '@type': 'Offer',
          priceCurrency: 'SATS',
          price: product.price_sats,
        },
      }),
    },
  });

  return (
    <>
      <JsonLdScript data={jsonLd} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-tiffany-50/30">
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
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{product.title}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="default" className="capitalize">
                      {product.status}
                    </Badge>
                    {product.category && (
                      <Badge variant="secondary">
                        <Tag className="w-3 h-3 mr-1" />
                        {product.category}
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
              {product.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
                  </CardContent>
                </Card>
              )}

              {product.price_sats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Price</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">
                      {Number(product.price_sats).toLocaleString()} sats
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {seller && <PublicEntityOwnerCard owner={seller} label="Seller" />}

              <EntityShare
                entityType="product"
                entityId={id}
                title={product.title}
                description={product.description}
              />

              <PublicEntityCTA
                href={`${ROUTES.AUTH}?mode=login&from=${ROUTES.PRODUCTS.VIEW(id)}`}
                icon={MessageSquare}
                label="Contact Seller"
                description="Sign in to contact the seller or make a purchase"
              />

              <PublicEntityTimestamps
                createdAt={product.created_at}
                updatedAt={product.updated_at}
                createdLabel="Listed"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
