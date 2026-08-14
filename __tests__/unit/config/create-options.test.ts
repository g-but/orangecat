import { CREATE_OPTIONS, CREATE_PAGE } from '@/config/create-options';
import { getEntitiesForCreateMenu } from '@/config/entity-registry';
import { PROGRAM_BLUEPRINTS } from '@/config/program-blueprints';
import { ROUTES } from '@/config/routes';

describe('CREATE_OPTIONS', () => {
  it('starts with a post, then every registry create path, then every program', () => {
    expect(CREATE_OPTIONS[0]?.href).toBe('/timeline?compose=true');
    const hrefs = CREATE_OPTIONS.slice(1).map(option => option.href);
    expect(hrefs).toEqual([
      ...getEntitiesForCreateMenu().map(entity => entity.createPath),
      ...PROGRAM_BLUEPRINTS.map(blueprint => ROUTES.DASHBOARD.PROGRAM_VIEW(blueprint.id)),
    ]);
  });

  it('does not collapse the chooser into project-create only', () => {
    expect(CREATE_PAGE.title).toMatch(/create/i);
    expect(CREATE_OPTIONS.some(option => option.href.includes('/store/create'))).toBe(true);
    expect(CREATE_OPTIONS.filter(option => option.href.includes('/projects/create'))).toHaveLength(
      1
    );
  });
});
