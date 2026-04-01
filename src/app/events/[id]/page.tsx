import { Metadata } from 'next';
import { generateEntityMetadata } from '@/lib/seo/metadata';
import PublicEntityDetailPage, {
  fetchEntityForMetadata,
  type EntityDetailConfig,
} from '@/components/public/PublicEntityDetailPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ROUTES } from '@/config/routes';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Users } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

const config: EntityDetailConfig = {
  entityType: 'event',
  ownerLabel: 'Organizer',
  descriptionTitle: 'About this Event',
  backText: 'Back to Events',
  backHref: '/events',
  metadataSelect: 'title, description, start_date, location',
  getViewRoute: id => ROUTES.EVENTS.VIEW(id),
  getJsonLdExtra: entity => ({
    ...(entity.start_date && { startDate: entity.start_date }),
    ...(entity.end_date && { endDate: entity.end_date }),
    ...(entity.location && { location: { '@type': 'Place', name: entity.location } }),
    ...(entity.max_attendees && { maximumAttendeeCapacity: entity.max_attendees }),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  }),
  renderHeaderExtra: entity =>
    entity.start_date ? (
      <span className="text-gray-500 text-sm">
        {format(new Date(entity.start_date as string), 'EEEE, MMMM d, yyyy')}
      </span>
    ) : null,
  renderDetails: entity => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Event Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entity.start_date && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">
                {format(new Date(entity.start_date as string), 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="text-sm text-gray-500">
                {format(new Date(entity.start_date as string), 'h:mm a')}
                {entity.end_date && ` - ${format(new Date(entity.end_date as string), 'h:mm a')}`}
              </div>
            </div>
          </div>
        )}
        {entity.location && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">{entity.location as string}</div>
            </div>
          </div>
        )}
        {entity.max_attendees && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">Max {entity.max_attendees as number} attendees</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  ),
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchEntityForMetadata(
    'event',
    id,
    'title, description, start_date, location'
  );
  if (!event) {
    return {
      title: 'Event Not Found | OrangeCat',
      description: 'The event you are looking for does not exist.',
    };
  }
  const dateStr = event.start_date
    ? ` on ${format(new Date(event.start_date as string), 'MMM d, yyyy')}`
    : '';
  const locationStr = event.location ? ` in ${event.location}` : '';
  const description =
    event.description ||
    `${event.title}${dateStr}${locationStr} - Bitcoin community event on OrangeCat.`;
  return generateEntityMetadata({ type: 'event', id, title: event.title, description });
}

export default async function PublicEventPage({ params }: PageProps) {
  const { id } = await params;
  return <PublicEntityDetailPage id={id} config={config} />;
}
