import { Metadata } from 'next';
import { generateEntityMetadata } from '@/lib/seo/metadata';
import PublicEntityDetailPage, {
  fetchEntityForMetadata,
  type EntityDetailConfig,
} from '@/components/public/PublicEntityDetailPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/progress';
import { ROUTES } from '@/config/routes';

interface PageProps {
  params: Promise<{ id: string }>;
}

const config: EntityDetailConfig = {
  entityType: 'cause',
  ownerLabel: 'Organized By',
  descriptionTitle: 'About this Cause',
  metadataSelect: 'title, description',
  getViewRoute: id => ROUTES.CAUSES.VIEW(id),
  getJsonLdExtra: entity => ({
    ...(entity.goal_amount && {
      funding: {
        '@type': 'MonetaryGrant',
        amount: { '@type': 'MonetaryAmount', value: entity.goal_amount, currency: 'BTC' },
      },
    }),
  }),
  renderDetails: entity => {
    if (!entity.goal_amount) {
      return null;
    }
    const progress =
      entity.goal_amount && entity.raised_amount
        ? Math.round((Number(entity.raised_amount) / Number(entity.goal_amount)) * 100)
        : 0;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Funding Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {Number(entity.raised_amount || 0)} BTC raised
            </span>
            <span className="font-bold text-lg text-rose-600">
              {Number(entity.goal_amount)} BTC goal
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-500">{progress}% funded</p>
        </CardContent>
      </Card>
    );
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const cause = await fetchEntityForMetadata('cause', id, 'title, description');
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
  return <PublicEntityDetailPage id={id} config={config} />;
}
