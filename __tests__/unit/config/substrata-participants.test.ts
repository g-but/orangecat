/**
 * The participant directory is only research because of its last column.
 *
 * A list of everyone in a supply chain is a phone book. The scarcity grade is
 * what turns it into a claim — and the claim is only meaningful if the grades
 * are actually discriminating. A directory on which everything is a chokepoint
 * has graded nothing, and that failure mode is invisible by inspection once the
 * list is a hundred rows long. These tests are what notice it.
 */

import {
  CHAIN_LAYERS,
  PARTICIPANTS,
  SCARCITY_DETAIL,
  SCARCITY_LABEL,
  bindingParticipants,
  participantProgress,
  participantsInLayer,
} from '@/config/substrata-participants';
import { MANDATE_CURVES } from '@/config/substrata';
import { HOSTED_SITE_FALLBACKS } from '@/config/hosted-site';
import { sitePageAt, sitePagesFor } from '@/config/site-content';

const site = HOSTED_SITE_FALLBACKS.substrata;
const page = sitePageAt(sitePagesFor(site, null), 'participants');

describe('the directory is well formed', () => {
  it('gives every participant a layer that exists and a curve behind it', () => {
    const layerIds = CHAIN_LAYERS.map(layer => layer.id);
    const curveIds = MANDATE_CURVES.map(curve => curve.id);
    for (const item of PARTICIPANTS) {
      expect(layerIds).toContain(item.layer);
      expect(item.role.length).toBeGreaterThan(0);
      expect(item.why.length).toBeGreaterThan(0);
      expect(item.jurisdictions.length).toBeGreaterThan(0);
      for (const code of item.jurisdictions) {
        expect(code).toMatch(/^[A-Z]{2}$/);
      }
    }
    for (const layer of CHAIN_LAYERS) {
      expect(curveIds).toContain(layer.curve);
    }
  });

  it('claims nothing it has not sourced — no revenue, capacity or share field', () => {
    const allowed = ['jurisdictions', 'layer', 'name', 'role', 'scarcity', 'source', 'why'].sort();
    for (const item of PARTICIPANTS) {
      expect(Object.keys(item).sort()).toEqual(allowed);
    }
  });

  it('leaves no layer of the chain empty', () => {
    for (const layer of CHAIN_LAYERS) {
      expect(participantsInLayer(layer.id).length).toBeGreaterThan(0);
    }
  });

  it('does not list the same participant twice in one layer', () => {
    for (const layer of CHAIN_LAYERS) {
      const names = participantsInLayer(layer.id).map(item => item.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});

describe('the grades actually discriminate', () => {
  it('uses all three grades, or it has graded nothing', () => {
    const progress = participantProgress();
    expect(progress.chokepoints).toBeGreaterThan(0);
    expect(progress.concentrated).toBeGreaterThan(0);
    // The one people skip. Naming participants that are NOT constraints is
    // what gives "chokepoint" its meaning; without it the map is flattery.
    expect(progress.competitive).toBeGreaterThan(0);
  });

  it('keeps chokepoints a minority — a chain where everything binds binds nowhere', () => {
    const progress = participantProgress();
    expect(progress.chokepoints).toBeLessThan(progress.total / 2);
  });

  it('adds up: every participant carries exactly one of the three grades', () => {
    const progress = participantProgress();
    expect(progress.chokepoints + progress.concentrated + progress.competitive).toBe(
      progress.total
    );
    expect(bindingParticipants().length).toBe(progress.chokepoints);
  });

  it('gives every grade a label and an explanation the site can print', () => {
    for (const grade of ['chokepoint', 'concentrated', 'competitive'] as const) {
      expect(SCARCITY_LABEL[grade]).toBeTruthy();
      expect(SCARCITY_DETAIL[grade].length).toBeGreaterThan(0);
    }
  });
});

describe('the site renders the whole directory', () => {
  const text = JSON.stringify(page);

  it('publishes every participant', () => {
    expect(page).not.toBeNull();
    for (const item of PARTICIPANTS) {
      expect(text).toContain(item.name);
    }
  });

  it('spells out why each binding participant binds', () => {
    for (const item of bindingParticipants()) {
      expect(text).toContain(item.why);
    }
  });

  it('offers a layer index whose every anchor lands on a real table', () => {
    const anchors = new Set(
      page!.sections.flatMap(section =>
        section.kind === 'table' && section.anchor ? [section.anchor] : []
      )
    );
    const index = page!.sections.find(section => section.kind === 'index');
    expect(index).toBeDefined();
    const entries = index!.kind === 'index' ? index.entries : [];
    expect(entries.length).toBe(CHAIN_LAYERS.length);
    for (const entry of entries) {
      expect(anchors.has(entry.anchor)).toBe(true);
    }
  });
});
