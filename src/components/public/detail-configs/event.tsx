import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { EntityDetailConfig } from '@/components/public/PublicEntityDetailPage';
import { ROUTES } from '@/config/routes';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Users, Video, Clock } from 'lucide-react';
import { safeHref } from '@/lib/security/safeHref';

/** The structured venue fields, in postal order, as display lines. */
const addressLines = (entity: Record<string, unknown>): string[] => {
  const cityLine = [entity.venue_postal_code, entity.venue_city]
    .filter(part => typeof part === 'string' && part.trim())
    .join(' ');
  return [entity.venue_name, entity.venue_address, cityLine, entity.venue_country]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map(part => part.trim());
};

/** SSOT for the event detail page — shared by the public + owner dashboard routes. */
export const eventDetailConfig: EntityDetailConfig = {
  entityType: 'event',
  ownerLabel: 'Organizer',
  descriptionTitle: 'About this Event',
  backText: 'Back to Events',
  backHref: '/events',
  metadataSelect: 'title, description, start_date, location',
  getViewRoute: id => ROUTES.EVENTS.VIEW(id),
  getCoverImages: entity => {
    const images = Array.isArray(entity.images) ? (entity.images as string[]) : [];
    return [entity.banner_url as string, entity.thumbnail_url as string, ...images].filter(Boolean);
  },
  getJsonLdExtra: entity => ({
    ...(entity.start_date && { startDate: entity.start_date }),
    ...(entity.end_date && { endDate: entity.end_date }),
    ...(entity.location && { location: { '@type': 'Place', name: entity.location } }),
    ...(entity.max_attendees && { maximumAttendeeCapacity: entity.max_attendees }),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  }),
  renderHeaderExtra: entity =>
    entity.start_date ? (
      <span className="text-fg-secondary text-sm">
        {format(new Date(entity.start_date as string), 'EEEE, MMMM d, yyyy')}
      </span>
    ) : null,
  renderDetails: entity => {
    const address = addressLines(entity);
    const joinUrl = safeHref(entity.online_url);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {entity.start_date && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface-raised/40">
                <CalendarIcon className="h-5 w-5 text-fg-primary" />
              </div>
              <div>
                <div className="font-medium">
                  {format(new Date(entity.start_date as string), 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="text-sm text-fg-secondary">
                  {entity.is_all_day
                    ? 'All day'
                    : `${format(new Date(entity.start_date as string), 'h:mm a')}${
                        entity.end_date
                          ? ` - ${format(new Date(entity.end_date as string), 'h:mm a')}`
                          : ''
                      }`}
                </div>
              </div>
            </div>
          )}
          {(entity.location || address.length > 0) && (
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface-raised/40">
                <MapPin className="h-5 w-5 text-fg-primary" />
              </div>
              <div className="min-w-0">
                {entity.location ? (
                  <div className="break-words font-medium">{entity.location as string}</div>
                ) : (
                  <div className="break-words font-medium">{address[0]}</div>
                )}
                {/* The form collects a full postal address; showing only
                    `location` left attendees unable to find the venue. */}
                {(entity.location ? address : address.slice(1)).map(line => (
                  <div key={line} className="break-words text-sm text-fg-secondary">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
          {joinUrl && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface-raised/40">
                <Video className="h-5 w-5 text-fg-primary" />
              </div>
              <div className="min-w-0">
                <a
                  href={joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all font-medium underline underline-offset-4"
                >
                  Join online
                </a>
              </div>
            </div>
          )}
          {entity.max_attendees && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface-raised/40">
                <Users className="h-5 w-5 text-fg-primary" />
              </div>
              <div>
                <div className="font-medium">Max {entity.max_attendees as number} attendees</div>
              </div>
            </div>
          )}
          {entity.rsvp_deadline && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface-raised/40">
                <Clock className="h-5 w-5 text-fg-primary" />
              </div>
              <div>
                <div className="font-medium">
                  RSVP by {format(new Date(entity.rsvp_deadline as string), 'MMMM d, yyyy')}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
};
