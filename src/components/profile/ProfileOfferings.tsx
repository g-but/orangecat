/**
 * ProfileOfferings — "What I can offer" on the public maker profile.
 *
 * The Cat extracts a person's latent economic value (skills, assets, what
 * people come to them for) into user_economic_profile, but until now it lived
 * only in Cat's private context and never surfaced. This renders the
 * offer-oriented signals on the profile — the "what I do / can do" answer a
 * visitor (or a potential client) actually wants — and gives the owner a
 * one-click path from a skill to the matching monetizable entity.
 *
 * Only the offer-facing fields are shown (skills, asked-for, assets). Private
 * signals (constraints, motivation) are deliberately omitted.
 */

import Link from 'next/link';
import { Sparkles, Plus } from 'lucide-react';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { suggestedEntityForSkill, type EconomicProfile } from '@/services/cat/economic-profile';

interface ProfileOfferingsProps {
  economicProfile?: EconomicProfile | null;
  isOwnProfile?: boolean;
}

export default function ProfileOfferings({ economicProfile, isOwnProfile }: ProfileOfferingsProps) {
  if (!economicProfile) {
    return null;
  }
  const skills = economicProfile.skills ?? [];
  const askedFor = economicProfile.askedFor ?? [];
  const assets = economicProfile.assets ?? [];
  if (skills.length === 0 && askedFor.length === 0 && assets.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 rounded-md border border-subtle bg-surface-raised/40 p-4 sm:mb-4">
      <div className="mb-3 flex items-center gap-1.5">
        <Sparkles className="h-4 w-4 text-fg-secondary" />
        <h2 className="text-sm font-semibold text-fg-primary">What I can offer</h2>
      </div>

      {skills.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-fg-tertiary">
            Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => {
              const type = suggestedEntityForSkill(skill.name);
              const meta = ENTITY_REGISTRY[type];
              const label = skill.years ? `${skill.name} · ${skill.years}y` : skill.name;
              // Owner: skill is a shortcut to the matching create form, seeded so
              // the AI-fill box (see AIPrefillBar) can generate the entity.
              if (isOwnProfile && meta) {
                const href = `${meta.createPath}?description=${encodeURIComponent(
                  `I offer ${skill.name}${skill.years ? ` (${skill.years} years of experience)` : ''}.`
                )}`;
                return (
                  <Link
                    key={skill.name}
                    href={href}
                    className="inline-flex items-center gap-1 rounded-full border border-default bg-surface-base px-2.5 py-0.5 text-xs font-medium text-fg-primary transition-colors hover:border-strong"
                  >
                    <Plus className="h-3 w-3" />
                    {label}
                  </Link>
                );
              }
              return (
                <span
                  key={skill.name}
                  className="inline-flex items-center rounded-full border border-default bg-surface-base px-2.5 py-0.5 text-xs font-medium text-fg-primary"
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {askedFor.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-fg-tertiary">
            People come to me for
          </p>
          <div className="flex flex-wrap gap-2">
            {askedFor.map(item => (
              <span
                key={item}
                className="inline-flex items-center rounded-full border border-default bg-surface-base px-2.5 py-0.5 text-xs text-fg-secondary"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {assets.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-fg-tertiary">
            Assets
          </p>
          <div className="flex flex-wrap gap-2">
            {assets.map(asset => (
              <span
                key={asset.name}
                className="inline-flex items-center rounded-full border border-default bg-surface-base px-2.5 py-0.5 text-xs text-fg-secondary"
              >
                {asset.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {isOwnProfile && skills.length > 0 && (
        <p className="mt-3 text-xs text-fg-tertiary">
          Tap a skill to turn it into a listing. Only you see these create shortcuts.
        </p>
      )}
    </div>
  );
}
