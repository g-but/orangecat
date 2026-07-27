import { createHmac, randomUUID } from 'node:crypto';
import type { EntityType } from '@/config/entity-registry';

export interface FleetCrownBuildIntent {
  iss: 'orangecat';
  aud: 'fleetcrown';
  sub: string;
  jti: string;
  iat: number;
  exp: number;
  entity: {
    type: EntityType;
    id: string;
    title: string;
    description: string | null;
    publicUrl: string;
  };
  suggestedHandoff: string[];
}

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function signFleetCrownBuildIntent(
  input: Omit<FleetCrownBuildIntent, 'iss' | 'aud' | 'jti' | 'iat' | 'exp'>
): string {
  const secret = process.env.FLEETCROWN_BUILD_INTENT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('FleetCrown build handoff is not configured');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: FleetCrownBuildIntent = {
    ...input,
    iss: 'orangecat',
    aud: 'fleetcrown',
    jti: randomUUID(),
    iat: now,
    exp: now + 10 * 60,
  };
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const body = encode(payload);
  const signature = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function suggestedHandoffFor(type: EntityType, title: string): string[] {
  if (type === 'group' || type === 'circle') {
    return [
      `Clarify the mission, membership model, and launch criteria for ${title}.`,
      'Draft a business plan and conservative financial model.',
      'Research locations, permits, suppliers, and staffing without making commitments.',
      'Prepare the website, outreach material, and an owner-approved launch plan.',
    ];
  }
  if (type === 'product' || type === 'service' || type === 'ai_assistant') {
    return [
      'Define the customer, promise, scope, and evidence of completion.',
      'Turn the public description into a build brief and milestone plan.',
      'Prepare the implementation, launch page, and promotion assets.',
    ];
  }
  return [
    'Turn the public entity into a concrete build brief.',
    'Propose milestones, risks, dependencies, and a first owner decision.',
    'Prepare work for supervised agents; do not dispatch without approval.',
  ];
}
