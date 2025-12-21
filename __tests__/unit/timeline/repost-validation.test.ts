import { timelineService } from '@/services/timeline';

// Access private validation helper for targeted checks
const validate = (timelineService as any).validateEventRequest.bind(timelineService);

describe('timelineService repost validation', () => {
  it('allows status updates that are reposts without a title', () => {
    const result = validate({
      eventType: 'status_update',
      subjectType: 'profile',
      title: '',
      description: 'quoted text',
      metadata: { is_repost: true },
    });

    expect(result).toEqual({ valid: true });
  });

  it('still requires a title for non-repost events that need one', () => {
    const result = validate({
      eventType: 'project_created',
      subjectType: 'project',
      subjectId: 'project-123',
      title: '',
    });

    expect(result).toEqual({ valid: false, error: 'Title is required' });
  });
});





























