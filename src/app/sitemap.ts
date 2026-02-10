import { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

const BASE_URL = 'https://orangecat.ch';

interface SitemapProfile {
  username: string | null;
  updated_at: string | null;
}

interface SitemapEntity {
  id: string;
  updated_at: string | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    {
      url: `${BASE_URL}/discover`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/auth`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  let dynamicPages: MetadataRoute.Sitemap = [];

  try {
    const supabase = createAdminClient();

    // Public profile pages
    const { data: profiles } = (await supabase
      .from('profiles' as const)
      .select('username, updated_at')
      .not('username', 'is', null)) as { data: SitemapProfile[] | null };

    if (profiles) {
      const profilePages: MetadataRoute.Sitemap = profiles
        .filter((p): p is SitemapProfile & { username: string } => p.username !== null)
        .map(profile => ({
          url: `${BASE_URL}/profile/${profile.username}`,
          lastModified: profile.updated_at ? new Date(profile.updated_at) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }));
      dynamicPages = [...dynamicPages, ...profilePages];
    }

    // Public entity pages (active projects, products, services, etc.)
    const entityTables = [
      { table: 'user_projects', pathPrefix: 'project' },
      { table: 'user_products', pathPrefix: 'product' },
      { table: 'user_services', pathPrefix: 'service' },
      { table: 'user_causes', pathPrefix: 'cause' },
    ] as const;

    for (const { table, pathPrefix } of entityTables) {
      const { data: entities } = (await supabase
        .from(table)
        .select('id, updated_at')
        .eq('status', 'active')) as { data: SitemapEntity[] | null };

      if (entities) {
        const entityPages: MetadataRoute.Sitemap = entities.map(entity => ({
          url: `${BASE_URL}/${pathPrefix}/${entity.id}`,
          lastModified: entity.updated_at ? new Date(entity.updated_at) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }));
        dynamicPages = [...dynamicPages, ...entityPages];
      }
    }
  } catch {
    // If DB query fails, return static pages only — sitemap should never break the build
  }

  return [...staticPages, ...dynamicPages];
}
