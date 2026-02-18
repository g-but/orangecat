/**
 * Wishlist CRUD API Routes
 *
 * Adds detail/update/delete workflows for individual wishlists.
 * Uses generic entity CRUD handlers and registry metadata.
 */

import { wishlistSchema } from '@/lib/validation';
import { createEntityCrudHandlers } from '@/lib/api/entityCrudHandler';
import {
  createUpdatePayloadBuilder,
  commonFieldMappings,
  entityTransforms,
} from '@/lib/api/buildUpdatePayload';

const buildWishlistUpdatePayload = createUpdatePayloadBuilder([
  { from: 'title' },
  { from: 'description', transform: entityTransforms.emptyStringToNull },
  { from: 'type', default: 'general' },
  { from: 'visibility', default: 'public' },
  commonFieldMappings.dateField('event_date'),
  commonFieldMappings.urlField('cover_image_url'),
  { from: 'is_active', default: true },
]);

const { GET, PUT, DELETE } = createEntityCrudHandlers({
  entityType: 'wishlist',
  schema: wishlistSchema,
  buildUpdatePayload: buildWishlistUpdatePayload,
  requireAuthForGet: true,
  requireActiveStatus: false,
  ownershipField: 'actor_id',
  useActorOwnership: true,
});

export { GET, PUT, DELETE };
