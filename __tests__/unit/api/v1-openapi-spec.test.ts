/**
 * The v1 spec must still BUILD.
 *
 * `/api/v1/openapi.json` is the machine-readable contract integrators generate
 * clients from, and it is assembled at request time from every `.openapi()`
 * annotation in registerV1Routes. A bad annotation — a duplicate component
 * name, an unsupported Zod construct — throws there and nowhere else, so
 * without this the first thing to notice would be a 500 on the contract
 * endpoint in production.
 */
import { getOpenApiSpec } from '@/lib/openapi/generator';
import { PUBLIC_API_BASE } from '@/config/public-api';

describe('v1 OpenAPI document', () => {
  const spec = getOpenApiSpec() as {
    paths: Record<string, Record<string, unknown>>;
  };

  it('generates without throwing', () => {
    expect(spec.paths).toBeDefined();
  });

  it('documents both identity resolvers', () => {
    expect(spec.paths[`${PUBLIC_API_BASE}/profiles`]).toHaveProperty('get');
    expect(spec.paths[`${PUBLIC_API_BASE}/profiles/{idOrHandle}`]).toHaveProperty('get');
  });

  it('leaves the resolvers unauthenticated, like the other public reads', () => {
    // A scope on data an anonymous visitor already reads off the profile page
    // would be friction that gets routed around with a scraper.
    const batch = spec.paths[`${PUBLIC_API_BASE}/profiles`].get as { security?: unknown };
    expect(batch.security).toBeUndefined();
  });
});
