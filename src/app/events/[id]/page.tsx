import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar as CalendarIcon, ArrowLeft, MapPin, Users } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import { getTableName } from '@/config/entity-registry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { generateEntityMetadata } from '@/lib/seo/metadata';
import { generateEntityJsonLd, JsonLdScript } from '@/lib/seo/structured-data';
import EntityShare from '@/components/sharing/EntityShare';
import PublicEntityOwnerCard from '@/components/public/PublicEntityOwnerCard';
import PublicEntityTimestamps from '@/components/public/PublicEntityTimestamps';
import { PublicEntityPaymentSection } from '@/components/payment';
import { fetchEntityOwner } from '@/lib/entities/fetchEntityOwner';
import { ROUTES } from '@/config/routes';
import { format } from 'date-fns';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data } = await supabase
    .from(getTableName('event'))
    .select('title, description, start_date, location')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const event = data as any;
  if (!event) {
    return {
      title: 'Event Not Found | OrangeCat',
      description: 'The event you are looking for does not exist.',
    };
  }

  const dateStr = event.start_date
    ? ` on ${format(new Date(event.start_date), 'MMM d, yyyy')}`
    : '';
  const locationStr = event.location ? ` in ${event.location}` : '';
  const description =
    event.description ||
    `${event.title}${dateStr}${locationStr} - Bitcoin community event on OrangeCat.`;

  return generateEntityMetadata({
    type: 'event',
    id,
    title: event.title,
    description,
  });
}

export default async function PublicEventPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from(getTableName('event'))
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const event = data as any;
  if (error || !event) {
    notFound();
  }

  const organizer = await fetchEntityOwner(supabase, event);

  const jsonLd = generateEntityJsonLd({
    type: 'event',
    id,
    title: event.title,
    description: event.description,
    extra: {
      ...(event.start_date && { startDate: event.start_date }),
      ...(event.end_date && { endDate: event.end_date }),
      ...(event.location && {
        location: {
          '@type': 'Place',
          name: event.location,
        },
      }),
      ...(organizer && {
        organizer: {
          '@type': 'Person',
          name: organizer.name || organizer.username || 'Organizer',
        },
      }),
      ...(event.max_attendees && { maximumAttendeeCapacity: event.max_attendees }),
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    },
  });

  return (
    <>
      <JsonLdScript data={jsonLd} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-tiffany-50/30">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link
              href="/events"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Link>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{event.title}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="default" className="capitalize">
                      {event.status}
                    </Badge>
                    {event.start_date && (
                      <span className="text-gray-500 text-sm">
                        {format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}
                      </span>
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
              {event.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">About this Event</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {event.start_date && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <CalendarIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(event.start_date), 'h:mm a')}
                          {event.end_date && ` - ${format(new Date(event.end_date), 'h:mm a')}`}
                        </div>
                      </div>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{event.location}</div>
                      </div>
                    </div>
                  )}
                  {event.max_attendees && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Max {event.max_attendees} attendees</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {organizer && <PublicEntityOwnerCard owner={organizer} label="Organizer" />}

              <EntityShare
                entityType="event"
                entityId={id}
                title={event.title}
                description={event.description}
              />

              <PublicEntityPaymentSection
                entityType="event"
                entityId={id}
                entityTitle={event.title}
                priceSats={event.price_sats ? Number(event.price_sats) : undefined}
                sellerProfileId={organizer?.id ?? null}
                sellerUserId={organizer?.user_id ?? null}
                signInRedirect={ROUTES.EVENTS.VIEW(id)}
              />

              <PublicEntityTimestamps createdAt={event.created_at} updatedAt={event.updated_at} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
