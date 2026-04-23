import { Metadata } from 'next';
import { generateEntityMetadata } from '@/lib/seo/metadata';
import PublicEntityDetailPage, {
  fetchEntityForMetadata,
  type EntityDetailConfig,
} from '@/components/public/PublicEntityDetailPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/config/routes';
import { displayBTC } from '@/services/currency';

interface PageProps {
  params: Promise<{ id: string }>;
}

const INVESTMENT_TYPE_LABELS: Record<string, string> = {
  equity: 'Equity',
  revenue_share: 'Revenue Share',
  profit_share: 'Profit Share',
  token: 'Token',
  other: 'Other',
};

const RISK_LEVEL_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

const config: EntityDetailConfig = {
  entityType: 'investment',
  ownerLabel: 'Offered By',
  descriptionTitle: 'About this Investment',
  metadataSelect: 'title, description',
  getViewRoute: id => ROUTES.INVESTMENTS.VIEW(id),
  getJsonLdExtra: entity => ({
    ...(entity.target_amount && {
      funding: {
        '@type': 'MonetaryGrant',
        amount: { '@type': 'MonetaryAmount', value: entity.target_amount, currency: 'BTC' },
      },
    }),
  }),
  renderDetails: entity => {
    const progress =
      entity.target_amount && entity.total_raised
        ? Math.min(Math.round((Number(entity.total_raised) / Number(entity.target_amount)) * 100), 100)
        : 0;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funding Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {displayBTC(entity.total_raised ?? 0)} raised
              </span>
              <span className="font-bold text-lg text-tiffany-dark">
                {displayBTC(entity.target_amount)} goal
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-500">{progress}% funded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {entity.investment_type && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Type</span>
                <Badge variant="secondary">
                  {INVESTMENT_TYPE_LABELS[entity.investment_type as string] ?? entity.investment_type}
                </Badge>
              </div>
            )}
            {entity.risk_level && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Risk Level</span>
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    RISK_LEVEL_COLORS[entity.risk_level as string] ?? 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {String(entity.risk_level).charAt(0).toUpperCase() + String(entity.risk_level).slice(1)}
                </span>
              </div>
            )}
            {entity.expected_return_rate != null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Expected Return</span>
                <span className="font-semibold">{Number(entity.expected_return_rate).toFixed(1)}%</span>
              </div>
            )}
            {entity.term_months != null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Term</span>
                <span className="font-semibold">{entity.term_months} months</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Minimum Investment</span>
              <span className="font-semibold">{displayBTC(entity.minimum_investment)}</span>
            </div>
            {entity.maximum_investment != null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Maximum Investment</span>
                <span className="font-semibold">{displayBTC(entity.maximum_investment)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {entity.terms && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{entity.terms as string}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const investment = await fetchEntityForMetadata('investment', id, 'title, description');
  if (!investment) {
    return {
      title: 'Investment Not Found | OrangeCat',
      description: 'The investment you are looking for does not exist.',
    };
  }
  return generateEntityMetadata({
    type: 'investment',
    id,
    title: investment.title,
    description: investment.description,
  });
}

export default async function PublicInvestmentPage({ params }: PageProps) {
  const { id } = await params;
  return <PublicEntityDetailPage id={id} config={config} />;
}
