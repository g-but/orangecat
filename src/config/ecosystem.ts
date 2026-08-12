import { SOLON_BASE_URL_DEFAULT } from './solon';

const DEFAULT_ORANGECAT_ORIGIN = 'https://www.orangecat.ch';

function publicUrl(name: string, fallback: string): URL {
  const value = process.env[name] ?? fallback;
  try {
    return new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute URL`);
  }
}

const orangeCatOrigin = publicUrl('NEXT_PUBLIC_ORANGECAT_URL', DEFAULT_ORANGECAT_ORIGIN);
const fleetCrownOrigin = publicUrl('NEXT_PUBLIC_FLEETCROWN_URL', 'https://fleetcrown.orangecat.ch');
const solonOrigin = publicUrl('NEXT_PUBLIC_SOLON_URL', SOLON_BASE_URL_DEFAULT);

function orangeCatPage(path: string): string {
  return new URL(path, orangeCatOrigin).toString();
}

/** Canonical public identities used by support and sibling-product surfaces. */
export const ECOSYSTEM = {
  owner: 'Mao Nakamoto',
  orangeCat: {
    title: 'OrangeCat',
    projectId:
      process.env.NEXT_PUBLIC_ORANGECAT_PROJECT_ID ?? 'cb093f00-8745-4579-98df-050ebfb37181',
    siteUrl: orangeCatOrigin.toString(),
    profileUrl: orangeCatPage('/profile/mao-nakamoto'),
  },
  fleetCrown: {
    title: 'FleetCrown',
    projectId:
      process.env.NEXT_PUBLIC_FLEETCROWN_ORANGECAT_PROJECT_ID ??
      '8130c927-114a-45b7-8cc2-99efd5224025',
    siteUrl: fleetCrownOrigin.toString(),
  },
  solon: {
    title: 'Solon',
    siteUrl: solonOrigin.toString(),
  },
  support: {
    lightningAddress:
      process.env.NEXT_PUBLIC_ECOSYSTEM_LIGHTNING_ADDRESS ?? 'orangecat@getalby.com',
    bitcoinAddress:
      process.env.NEXT_PUBLIC_ECOSYSTEM_BITCOIN_ADDRESS ??
      'bc1q3hh4yklcmwtpnqmxyksw36yedg7zyfy6tzzqwz',
  },
} as const;

export const ECOSYSTEM_LINKS = {
  mao: ECOSYSTEM.orangeCat.profileUrl,
  orangeCat: orangeCatPage(`/projects/${ECOSYSTEM.orangeCat.projectId}`),
  fleetCrown: orangeCatPage(`/projects/${ECOSYSTEM.fleetCrown.projectId}`),
} as const;

export const ORANGECAT_FLEETCROWN_INTEGRATION = {
  customer: ECOSYSTEM.fleetCrown.title,
  owner: ECOSYSTEM.owner,
  orangeCat: { title: ECOSYSTEM.orangeCat.title, id: ECOSYSTEM.orangeCat.projectId },
  fleetCrown: {
    title: ECOSYSTEM.fleetCrown.title,
    id: ECOSYSTEM.fleetCrown.projectId,
    site: ECOSYSTEM.fleetCrown.siteUrl,
  },
  wallet: {
    btc: ECOSYSTEM.support.bitcoinAddress,
    lightning: ECOSYSTEM.support.lightningAddress,
  },
  relation: 'FleetCrown is a customer of OrangeCat.',
  note: 'OrangeCat is the public funding layer; FleetCrown is the building layer.',
} as const;

/**
 * The three-pillar stack OrangeCat belongs to. Solon is the governance
 * pillar: OrangeCat's platform allocation policy changes only via a
 * Bitcoin-signed Solon vote whose decision document OrangeCat re-verifies
 * locally (src/services/solon/decision-verify.ts) — a Solon decision is
 * evidence, not authority.
 */
export const ECOSYSTEM_PILLARS = [
  {
    key: 'orangecat',
    title: ECOSYSTEM.orangeCat.title,
    role: 'Economy',
    siteUrl: ECOSYSTEM.orangeCat.siteUrl,
  },
  {
    key: 'fleetcrown',
    title: ECOSYSTEM.fleetCrown.title,
    role: 'Engineering',
    siteUrl: ECOSYSTEM.fleetCrown.siteUrl,
  },
  {
    key: 'solon',
    title: ECOSYSTEM.solon.title,
    role: 'Governance',
    siteUrl: ECOSYSTEM.solon.siteUrl,
  },
] as const;
