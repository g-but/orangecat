import { listEntityPage, createEntity } from '@/domain/base/entityService';
import { PROJECT_STATUS } from '@/config/project-statuses';
import { STATUS } from '@/config/database-constants';
import type { ProjectData } from '@/lib/validation';

export async function listProjectsPage(limit: number, offset: number, userId?: string) {
  const result = await listEntityPage('project', {
    limit,
    offset,
    userId,
    includeOwnDrafts: !!userId,
    publicStatuses: [PROJECT_STATUS.ACTIVE],
    select: '*, profiles:user_id(id, username, name, avatar_url, email)',
  });

  // Ensure raised_amount defaults to 0
  const items = result.items.map((project: Record<string, unknown>) => ({
    ...project,
    raised_amount: project.raised_amount ?? 0,
  }));

  return { items, total: result.total };
}

export async function createProject(userId: string, payload: ProjectData) {
  return createEntity('project', userId, {
    user_id: userId,
    title: payload.title,
    description: payload.description,
    goal_amount: payload.goal_amount ?? null,
    currency: payload.currency ?? 'SATS',
    funding_purpose: payload.funding_purpose ?? null,
    bitcoin_address: payload.bitcoin_address ?? null,
    lightning_address: payload.lightning_address ?? null,
    website_url: payload.website_url ?? null,
    category: payload.category ?? null,
    tags: payload.tags ?? [],
    status: STATUS.PROJECTS.DRAFT,
  });
}
