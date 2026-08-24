/**
 * People-first payee resolution.
 *
 * Why this exists: "send money to my mother" on a free-pool model (Nemotron /
 * GPT-OSS) reliably opens with "give me her Lightning address + amount" even
 * when the system prompt and few-shots say otherwise. Prompting alone is not a
 * control for weak models — same lesson as reply-language.ts.
 *
 * Defence in depth:
 *   1. matchUnresolvedRolePayment — detect role-only pay/message intents
 *   2. buildPeopleFirstDirective — short imperative at the prompt TAIL
 *   3. buildPeopleFirstReply — deterministic reply used as a short-circuit so
 *      the bad address-collection opener never reaches the user
 *
 * Created: 2026-08-14
 * Last Modified: 2026-08-14
 * Last Modified Summary: Initial people-first detector, directive, and canned reply.
 */

import { detectReplyLanguage, type ReplyLanguage } from '@/services/cat/reply-language';
import { ROUTES } from '@/config/routes';

/** Canonical deep links for people-first replies (keep in sync with routes.ts). */
const LINK = {
  people: ROUTES.DASHBOARD.PEOPLE,
  discoverPeople: `${ROUTES.DISCOVER}?type=profiles`,
  send: ROUTES.SEND,
  receive: ROUTES.RECEIVE,
  requests: ROUTES.REQUESTS,
  wallets: ROUTES.DASHBOARD.WALLETS,
  permissions: ROUTES.DASHBOARD.CAT_PERMISSIONS,
} as const;

/** Kinship / role tokens we treat as "named by role, not by handle". */
const ROLE_PATTERN =
  /\b(?:my\s+|meine?\s+|mein\s+)?(?<role>mother|mom|mum|mutter|mama|father|dad|vater|papa|sister|schwester|brother|bruder|landlord|vermieter|wife|husband|partner|frau|mann|parents|eltern|friend|freundin|freund)\b/i;

const PAY_OR_REACH =
  /\b(send|pay|transfer|tip|donate|message|invite|schicken|zahlen|überweisen|ueberweisen|senden|geld)\b/i;

export interface RolePayeeMatch {
  /** Canonical English role key for memory checks and templates. */
  roleKey: string;
  /** Surface form as the user wrote it (lowercased). */
  roleSurface: string;
}

const ROLE_CANON: Record<string, string> = {
  mother: 'mother',
  mom: 'mother',
  mum: 'mother',
  mutter: 'mother',
  mama: 'mother',
  father: 'father',
  dad: 'father',
  vater: 'father',
  papa: 'father',
  sister: 'sister',
  schwester: 'sister',
  brother: 'brother',
  bruder: 'brother',
  landlord: 'landlord',
  vermieter: 'landlord',
  wife: 'partner',
  husband: 'partner',
  partner: 'partner',
  frau: 'partner',
  mann: 'partner',
  parents: 'parents',
  eltern: 'parents',
  friend: 'friend',
  freundin: 'friend',
  freund: 'friend',
};

/** True when the message already names a concrete rail or @handle. */
export function hasConcreteRecipient(message: string): boolean {
  if (/@[a-zA-Z0-9_]{2,30}\b/.test(message)) {
    return true;
  }
  // Lightning / email-style address
  if (/\b[\w.+-]+@[\w.-]+\.\w{2,}\b/.test(message)) {
    return true;
  }
  // Common on-chain prefixes (bech32 / legacy) — coarse, enough to skip short-circuit
  if (/\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{20,}\b/i.test(message)) {
    return true;
  }
  return false;
}

/**
 * Detect "pay/message someone I only named by role" with no @handle/address yet.
 * Returns null when the LLM should handle the turn normally.
 */
export function matchUnresolvedRolePayment(message: string): RolePayeeMatch | null {
  const trimmed = message.trim();
  if (trimmed.length < 8) {
    return null;
  }
  if (!PAY_OR_REACH.test(trimmed)) {
    return null;
  }
  if (hasConcreteRecipient(trimmed)) {
    return null;
  }
  const m = trimmed.match(ROLE_PATTERN);
  if (!m?.groups?.role) {
    return null;
  }
  const surface = m.groups.role.toLowerCase();
  const roleKey = ROLE_CANON[surface];
  if (!roleKey) {
    return null;
  }
  return { roleKey, roleSurface: surface };
}

/** Memory already identifies this role with a handle or address — let the model use it. */
export function rolePayeeKnownInMemories(
  roleKey: string,
  memoryContents: readonly string[]
): boolean {
  if (memoryContents.length === 0) {
    return false;
  }
  const aliases = Object.entries(ROLE_CANON)
    .filter(([, key]) => key === roleKey)
    .map(([alias]) => alias);
  const roleRe = new RegExp(`\\b(${aliases.join('|')})\\b`, 'i');
  return memoryContents.some(content => {
    if (!roleRe.test(content)) {
      return false;
    }
    return (
      /@[a-zA-Z0-9_]{2,30}\b/.test(content) ||
      /\b[\w.+-]+@[\w.-]+\.\w{2,}\b/.test(content) ||
      /\bis\b.+/i.test(content)
    );
  });
}

/**
 * Whether this turn should short-circuit to the canned people-first reply.
 */
export function shouldShortCircuitPeopleFirst(
  message: string,
  memoryContents: readonly string[]
): RolePayeeMatch | null {
  const match = matchUnresolvedRolePayment(message);
  if (!match) {
    return null;
  }
  if (rolePayeeKnownInMemories(match.roleKey, memoryContents)) {
    return null;
  }
  return match;
}

/** English display noun for templates. */
function roleNounEn(roleKey: string): string {
  switch (roleKey) {
    case 'mother':
      return 'mother';
    case 'father':
      return 'father';
    case 'sister':
      return 'sister';
    case 'brother':
      return 'brother';
    case 'landlord':
      return 'landlord';
    case 'parents':
      return 'parents';
    case 'partner':
      return 'partner';
    case 'friend':
      return 'friend';
    default:
      return 'person';
  }
}

/** Swiss High German display noun (no ß). */
function roleNounDe(roleKey: string): string {
  switch (roleKey) {
    case 'mother':
      return 'Mutter';
    case 'father':
      return 'Vater';
    case 'sister':
      return 'Schwester';
    case 'brother':
      return 'Bruder';
    case 'landlord':
      return 'Vermieter';
    case 'parents':
      return 'Eltern';
    case 'partner':
      return 'Partner';
    case 'friend':
      return 'Freund';
    default:
      return 'Person';
  }
}

function pronounEn(roleKey: string): { they: string; their: string; them: string } {
  if (roleKey === 'mother' || roleKey === 'sister') {
    return { they: 'she', their: 'her', them: 'her' };
  }
  if (roleKey === 'father' || roleKey === 'brother') {
    return { they: 'he', their: 'his', them: 'him' };
  }
  if (roleKey === 'parents') {
    return { they: 'they', their: 'their', them: 'them' };
  }
  return { they: 'they', their: 'their', them: 'them' };
}

function isKinship(roleKey: string): boolean {
  return ['mother', 'father', 'sister', 'brother', 'parents', 'partner'].includes(roleKey);
}

/**
 * Tail-of-prompt imperative. Only emitted when short-circuit is NOT used
 * (e.g. local /prepare path, or known-in-memory turns that still need coaching).
 */
export function buildPeopleFirstDirective(match: RolePayeeMatch): string {
  const noun = roleNounEn(match.roleKey);
  return `\n\n## THIS TURN — People first (obey exactly)
The user wants to pay or reach their ${noun} but gave no @handle or Lightning/Bitcoin address. Do NOT ask for an address or amount first. In ≤3 short sentences: you can send once they are on OrangeCat; offer Find them / ${isKinship(match.roleKey) ? 'Start a Family' : 'Start a circle'} / I have @handle / Lightning address as quick_replies. Prefer a Family group for kinship. Deep links (use markdown): [People](${LINK.people}), [Discover people](${LINK.discoverPeople}), [Send](${LINK.send}), [Cat Permissions](${LINK.permissions}). Manual send is ${LINK.send} — do not invent a payment form in chat when Payments permissions are off.`;
}

/**
 * Deterministic reply — the product guarantee when free models ignore the brief.
 */
export function buildPeopleFirstReply(
  match: RolePayeeMatch,
  lang: ReplyLanguage = detectReplyLanguage('')
): string {
  const resolvedLang: ReplyLanguage = lang === 'unknown' ? 'en' : lang;

  if (resolvedLang === 'de') {
    const noun = roleNounDe(match.roleKey);
    const familyChip = isKinship(match.roleKey) ? 'Family starten' : 'Circle starten';
    return `Ich kann das senden — ich weiss nur noch nicht, wer deine ${noun} auf OrangeCat ist. Sobald ein @handle da ist (oder ihr in einer Family seid), ist Zahlen ein Tipp.

${noun} suchen, ${isKinship(match.roleKey) ? 'eine private Family starten' : 'einen Circle starten'}, oder hast du schon @handle? Manuell geht's auch über [Senden](${LINK.send}).

\`\`\`quick_replies
["Hier suchen", "${familyChip}", "Ich habe das @handle", "Senden öffnen"]
\`\`\``;
  }

  const noun = roleNounEn(match.roleKey);
  const p = pronounEn(match.roleKey);
  const familyChip = isKinship(match.roleKey) ? 'Start a Family' : 'Start a circle';
  const unite = isKinship(match.roleKey)
    ? `start a private Family to invite ${p.them} into`
    : 'start a circle to connect';
  const findChip =
    p.them === 'her' ? 'Find her here' : p.them === 'him' ? 'Find him here' : 'Find them here';

  return `I can send that — I don't know who your ${noun} is on OrangeCat yet. Once ${p.they} ${p.they === 'they' ? 'have' : 'has'} an @handle (or you share a Family), paying is one tap.

Find ${p.them} on [People](${LINK.people}) or [Discover](${LINK.discoverPeople}), ${unite}, or open [Send](${LINK.send}) when you have ${p.their} @handle.

\`\`\`quick_replies
["${findChip}", "${familyChip}", "I have their @handle", "Open Send"]
\`\`\``;
}

/**
 * Quick-reply follow-ups from the people-first card — navigate, don't lecture.
 */
export function matchMoneySurfaceShortcut(message: string): string | null {
  const t = message.trim().toLowerCase();
  if (/^(open send|senden öffnen)$/i.test(t)) {
    return `Here is [Send](${LINK.send}) — pay an @handle or paste a Lightning invoice. Wallet setup lives under [Wallets](${LINK.wallets}).`;
  }
  if (/^(find (her|him|them) here|hier suchen)$/i.test(t)) {
    return `Try [People](${LINK.people}) (people you already follow) or [Discover → People](${LINK.discoverPeople}). When you find them, open [Send](${LINK.send}) with their @handle.`;
  }
  if (/^(start a family|family starten)$/i.test(t)) {
    return null; // let the model emit create_entity group label family
  }
  return null;
}

/**
 * True when a model reply still did the forbidden opener — used as a
 * post-hoc rewrite safety net if short-circuit was skipped.
 * Offering Lightning as one optional path is fine; opening with a payment
 * setup form (address + amount) is not.
 */
export function looksLikeAddressCollectionOpener(reply: string): boolean {
  const r = reply.toLowerCase();
  return (
    /to set up the payment/.test(r) ||
    /i need a few details/.test(r) ||
    /recipient address\s*:/.test(r) ||
    /what'?s your .{0,20}lightning address/.test(r) ||
    /mother'?s lightning address/.test(r) ||
    /(?:need|provide|enter).{0,30}lightning address/.test(r)
  );
}
