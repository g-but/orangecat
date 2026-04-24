import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, ExternalLink, Gift } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import { getOrCreateUserActor } from '@/services/actors/getOrCreateUserActor';
import { DATABASE_TABLES } from '@/config/database-tables';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import EntityDetailLayout from '@/components/entity/EntityDetailLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface WishlistWithStats {
  id: string;
  actor_id: string;
  title: string;
  description: string | null;
  type: string;
  visibility: string;
  is_active: boolean;
  event_date: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  item_count: number;
  funded_item_count: number;
  fulfilled_item_count: number;
  total_target_btc: number;
  total_funded_btc: number;
}

interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  target_amount_btc: number;
  funded_amount_btc: number;
  is_fully_funded: boolean;
  is_fulfilled: boolean;
  external_url: string | null;
  priority: number;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  birthday: 'Birthday',
  wedding: 'Wedding',
  baby_shower: 'Baby Shower',
  graduation: 'Graduation',
  holiday: 'Holiday',
  general: 'General',
  personal: 'Personal',
};

export default async function WishlistDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  if (!user) {
    redirect(`/auth?mode=login&from=/dashboard/wishlists/${id}`);
  }

  const actor = await getOrCreateUserActor(user.id);

  // Fetch wishlist with stats (the view already includes totals)
  const { data: wishlistData, error } = await (supabase.from(DATABASE_TABLES.WISHLIST_WITH_STATS) as ReturnType<typeof supabase.from>)
    .select('*')
    .eq('id', id)
    .eq('actor_id', actor.id)
    .single();

  if (error || !wishlistData) {
    notFound();
  }

  const wishlist = wishlistData as unknown as WishlistWithStats;

  // Fetch items
  const { data: itemsData } = await (supabase.from(DATABASE_TABLES.WISHLIST_ITEMS) as ReturnType<typeof supabase.from>)
    .select('id, title, description, image_url, target_amount_btc, funded_amount_btc, is_fully_funded, is_fulfilled, external_url, priority, created_at')
    .eq('wishlist_id', id)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  const items = (itemsData || []) as unknown as WishlistItem[];

  const overallProgress =
    wishlist.total_target_btc > 0
      ? Math.round((wishlist.total_funded_btc / wishlist.total_target_btc) * 100)
      : 0;

  const wishlistBasePath = ENTITY_REGISTRY['wishlist'].basePath;
  const wishlistCreatePath = ENTITY_REGISTRY['wishlist'].createPath;

  const headerActions = (
    <div className="flex items-center gap-2">
      {(wishlist.visibility === 'public' || wishlist.visibility === 'unlisted') && (
        <Link href={`/wishlists/${id}`} target="_blank">
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-1" />
            View Public Page
          </Button>
        </Link>
      )}
      <Link href={`${wishlistCreatePath}?edit=${id}`}>
        <Button size="sm">Edit Wishlist</Button>
      </Link>
    </div>
  );

  const breadcrumbItems = [
    { label: 'Wishlists', href: wishlistBasePath },
    { label: wishlist.title },
  ];

  const leftContent = (
    <div className="space-y-6">
      {/* Overall progress */}
      {wishlist.total_target_btc > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funding Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{Number(wishlist.total_funded_btc).toFixed(8)} BTC funded</span>
              <span>{Number(wishlist.total_target_btc).toFixed(8)} BTC total</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{overallProgress}% of goal</span>
              <span>
                {wishlist.funded_item_count}/{wishlist.item_count} items funded
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            Items {wishlist.item_count > 0 && `(${wishlist.item_count})`}
          </h2>
          <Link href={`${wishlistBasePath}/items/new?wishlist_id=${id}`}>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
            <Gift className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500 mb-3">No items yet</p>
            <Link href={`${wishlistBasePath}/items/new?wishlist_id=${id}`}>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add First Item
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const itemProgress =
                item.target_amount_btc > 0
                  ? Math.round((item.funded_amount_btc / item.target_amount_btc) * 100)
                  : 0;
              return (
                <Link
                  key={item.id}
                  href={`${wishlistBasePath}/items/${item.id}`}
                  className="block"
                >
                  <Card className={`hover:shadow-md transition-shadow ${item.is_fulfilled ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Gift className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-gray-900">{item.title}</span>
                            <div className="flex gap-1 flex-shrink-0">
                              {item.is_fulfilled && (
                                <Badge variant="secondary" className="text-xs">Fulfilled</Badge>
                              )}
                              {item.is_fully_funded && !item.is_fulfilled && (
                                <Badge className="bg-green-500 text-xs">Funded</Badge>
                              )}
                            </div>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                          {item.external_url && (
                            <span className="text-xs text-tiffany-600">External link →</span>
                          )}
                          {item.target_amount_btc > 0 && (
                            <div className="mt-2 space-y-1">
                              <Progress value={itemProgress} className="h-1" />
                              <p className="text-xs text-gray-500">
                                {Number(item.funded_amount_btc).toFixed(8)} / {Number(item.target_amount_btc).toFixed(8)} BTC
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const rightContent = (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <div className="text-gray-500">Type</div>
            <div className="font-medium capitalize">{TYPE_LABELS[wishlist.type] || wishlist.type}</div>
          </div>
          <div>
            <div className="text-gray-500">Visibility</div>
            <div className="font-medium capitalize">{wishlist.visibility}</div>
          </div>
          <div>
            <div className="text-gray-500">Status</div>
            <div className="font-medium">{wishlist.is_active ? 'Active' : 'Inactive'}</div>
          </div>
          {wishlist.event_date && (
            <div>
              <div className="text-gray-500">Event Date</div>
              <div className="font-medium">
                {new Date(wishlist.event_date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          )}
          <div>
            <div className="text-gray-500">Created</div>
            <div className="font-medium">{new Date(wishlist.created_at).toLocaleDateString()}</div>
          </div>
          {wishlist.fulfilled_item_count > 0 && (
            <div>
              <div className="text-gray-500">Fulfilled Items</div>
              <div className="font-medium">
                {wishlist.fulfilled_item_count} of {wishlist.item_count}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {wishlist.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{wishlist.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <EntityDetailLayout
      title={wishlist.title}
      headerActions={headerActions}
      breadcrumbItems={breadcrumbItems}
      left={leftContent}
      right={rightContent}
    />
  );
}
