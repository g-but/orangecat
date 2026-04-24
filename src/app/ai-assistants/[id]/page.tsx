import { Metadata } from 'next';
import { generateEntityMetadata } from '@/lib/seo/metadata';
import PublicEntityDetailPage, {
  fetchEntityForMetadata,
  type EntityDetailConfig,
} from '@/components/public/PublicEntityDetailPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/config/routes';

interface PageProps {
  params: Promise<{ id: string }>;
}

const config: EntityDetailConfig = {
  entityType: 'ai_assistant',
  ownerLabel: 'Created by',
  descriptionTitle: 'About this AI Assistant',
  metadataSelect: 'title, description, avatar_url',
  getViewRoute: id => ROUTES.AI_ASSISTANTS.VIEW(id),
  renderHeaderExtra: entity => {
    if (!entity.category) { return null; }
    return (
      <Badge variant="outline" className="capitalize">
        {entity.category}
      </Badge>
    );
  },
  renderDetails: entity => {
    const tags: string[] = Array.isArray(entity.tags) ? entity.tags : [];
    const traits: string[] = Array.isArray(entity.personality_traits) ? entity.personality_traits : [];
    const welcome = entity.welcome_message as string | null | undefined;

    return (
      <>
        {welcome && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Welcome Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 italic whitespace-pre-wrap">{welcome}</p>
            </CardContent>
          </Card>
        )}

        {(tags.length > 0 || traits.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {traits.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Personality</p>
                  <div className="flex flex-wrap gap-2">
                    {traits.map(trait => (
                      <Badge key={trait} variant="outline">{trait}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </>
    );
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const entity = await fetchEntityForMetadata('ai_assistant', id, 'title, description, avatar_url');
  if (!entity) { return { title: 'AI Assistant Not Found | OrangeCat' }; }
  return generateEntityMetadata({
    type: 'ai_assistant',
    id,
    title: entity.title,
    description: entity.description,
    imageUrl: entity.avatar_url,
  });
}

export default async function PublicAIAssistantPage({ params }: PageProps) {
  const { id } = await params;
  return <PublicEntityDetailPage id={id} config={config} />;
}
