/**
 * Template model-seed guard (SSOT).
 *
 * Assistant templates once seeded `model_preference: 'gpt-4'` — an id that was
 * never in the model registry, so every template-created assistant silently
 * fell back at runtime. Templates now omit `model_preference` entirely and
 * inherit the config default (`'any'` → registry-backed auto-routing).
 *
 * This test pins the class shut: if a template ever seeds a model again, it
 * must be a live registry id or a routing sentinel ('any' / 'local' — the same
 * sentinels ai-assistant-config.ts offers in its dropdown). A dead literal can
 * never ship again.
 */

import { AI_ASSISTANT_TEMPLATES } from '@/components/create/templates/ai-assistant-templates';
import { getModelMetadata } from '@/config/ai-models';

// Routing sentinels accepted by selectModel() / the config dropdown — not models.
const ROUTING_SENTINELS = ['any', 'local'];

describe('AI assistant template model seeds', () => {
  it('every seeded model_preference resolves in the model registry (or is a routing sentinel)', () => {
    const stale = AI_ASSISTANT_TEMPLATES.filter(t => {
      const pref = t.defaults.model_preference;
      if (pref === undefined) {
        return false; // no seed → inherits config default 'any' (the intended state)
      }
      return !ROUTING_SENTINELS.includes(pref) && !getModelMetadata(pref);
    }).map(t => ({ id: t.id, model_preference: t.defaults.model_preference }));

    expect(stale).toEqual([]);
  });
});
