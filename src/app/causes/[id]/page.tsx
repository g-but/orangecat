import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Heart, ArrowLeft, HandHeart } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import { getTableName } from '@/config/entity-registry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
    .from(getTableName('cause'))
    .select('title, description')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cause = data as any;
  if (!cause) {
    return {
      title: 'Cause Not Found | OrangeCat',
      description: 'The cause you are looking for does not exist.',
    };
  }

  return generateEntityMetadata({
    type: 'cause',
    id,
    title: cause.title,
    description: cause.description,
  });
}

export default async function PublicCausePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from(getTableName('cause'))
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cause = data as any;
  if (error || !cause) {
    notFound();
  }

  const owner = await fetchEntityOwner(supabase, cause);

  const progress =
    cause.goal_amount && cause.raised_amount
      ? Math.round((Number(cause.raised_amount) / Number(cause.goal_amount)) * 100)
      : 0;

  const jsonLd = generateEntityJsonLd({
    type: 'cause',
    id,
    title: cause.title,
    description: cause.description,
    extra: {
      ...(cause.goal_amount && {
        funding: {
          '@type': 'MonetaryGrant',
          amount: {
            '@type': 'MonetaryAmount',
            value: cause.goal_amount,
            currency: 'SATS',
          },
        },
      }),
    },
  });

  return (
    <>
      <JsonLdScript data={jsonLd} />
      <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-white to-tiffany-50/30">
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
                <div className="w-16 h-16 bg-rose-100 rounded-xl flex items-center justify-center">
                  <Heart className="w-8 h-8 text-rose-600" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{cause.title}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="default" className="capitalize">
                      {cause.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {cause.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">About this Cause</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{cause.description}</p>
                  </CardContent>
                </Card>
              )}

              {cause.goal_amount && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Funding Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {Number(cause.raised_amount || 0).toLocaleString()} sats raised
                      </span>
                      <span className="font-bold text-lg text-rose-600">
                        {Number(cause.goal_amount).toLocaleString()} sats goal
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-gray-500">{progress}% funded</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {owner && <PublicEntityOwnerCard owner={owner} label="Organized By" />}

              <EntityShare
                entityType="cause"
                entityId={id}
                title={cause.title}
                description={cause.description}
              />

              <PublicEntityCTA
                href={`${ROUTES.AUTH}?mode=login&from=${ROUTES.CAUSES.VIEW(id)}`}
                icon={HandHeart}
                label="Back this Cause"
                description="Sign in to support this cause with Bitcoin"
              />

              <PublicEntityTimestamps createdAt={cause.created_at} updatedAt={cause.updated_at} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
