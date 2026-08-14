/**
 * Blueprint: matched computers + unlimited AI
 *
 * The shape of the program, in one paragraph:
 *
 *   N machines go to one place. Half of the seats are sold at double cost to
 *   families who can pay — each of those purchases buys the buyer's machine AND
 *   a matched machine for a kid whose family cannot. The other half are covered
 *   by the cause, which exists so the free seats are funded even if no sponsor
 *   shows up. Every recipient — paying or not — gets the same AI assistant with
 *   no per-message charge, because the point is that the tutor is not the thing
 *   being rationed. The machines are itemised on a wishlist so a supporter can
 *   fund one specific machine rather than "the fund". The handover is an event.
 *   The rules are a document, so the Cat can answer questions about who
 *   qualifies without a human in the loop.
 *
 * Defaults describe the founding run: 10 computers to India, 5 sponsored seats,
 * 5 funded seats. Every one of those numbers is a parameter — a user running
 * this for 30 machines in Nairobi changes the inputs, not the code.
 *
 * Created: 2026-08-14
 */

import { Laptop } from 'lucide-react';
import { ENTITY_STATUS } from '@/config/database-constants';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import {
  numberParam,
  textParam,
  type BlueprintParamValues,
  type BlueprintStep,
  type ProgramBlueprint,
} from './types';

const DEFAULTS = {
  destination: 'India',
  sponsoredSeats: 5,
  fundedSeats: 5,
  seatCost: 450,
  seatCostBtc: 0.005,
  timezone: 'Asia/Kolkata',
} as const;

/** Days out for the handover event — far enough to actually ship hardware. */
const HANDOVER_DAYS_AHEAD = 45;
const HANDOVER_HOURS = 4;

/** One machine's line on the wishlist. `index` is 1-based. */
function machineItem(
  index: number,
  isSponsored: boolean,
  destination: string,
  seatCostBtc: number
): Record<string, unknown> {
  const label = isSponsored ? 'sponsored seat' : 'funded seat';
  return {
    title: `Machine ${String(index).padStart(2, '0')} — ${label}`,
    description: isSponsored
      ? 'Covered when a sponsor buys a seat. Listed so the manifest shows all machines, funded or not.'
      : `Not yet paid for. Funding this line buys one machine for one kid in ${destination}, with setup and the first year of connectivity.`,
    target_amount_btc: seatCostBtc,
    currency: 'BTC',
    quantity_wanted: 1,
    // Unfunded seats float to the top of the list — that is where help is needed.
    priority: isSponsored ? 10 : 90,
    allow_partial_funding: true,
    use_dedicated_wallet: false,
  };
}

function buildSteps(values: BlueprintParamValues): BlueprintStep[] {
  const destination = textParam(values, 'destination', DEFAULTS.destination);
  const sponsoredSeats = Math.max(
    0,
    Math.round(numberParam(values, 'sponsoredSeats', DEFAULTS.sponsoredSeats))
  );
  const fundedSeats = Math.max(
    0,
    Math.round(numberParam(values, 'fundedSeats', DEFAULTS.fundedSeats))
  );
  const seatCost = numberParam(values, 'seatCost', DEFAULTS.seatCost);
  const seatCostBtc = numberParam(values, 'seatCostBtc', DEFAULTS.seatCostBtc);
  const timezone = textParam(values, 'timezone', DEFAULTS.timezone);

  const totalSeats = sponsoredSeats + fundedSeats;
  /** A sponsor pays for two machines: theirs and a matched one. */
  const sponsorPrice = Math.round(seatCost * 2);
  const programName = `${totalSeats} Computers to ${destination}`;

  const start = new Date(Date.now() + HANDOVER_DAYS_AHEAD * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + HANDOVER_HOURS * 60 * 60 * 1000);

  const machines = Array.from({ length: totalSeats }, (_, i) =>
    machineItem(i + 1, i < sponsoredSeats, destination, seatCostBtc)
  );

  return [
    {
      key: 'group',
      entityType: 'group',
      role: 'Public home and shared treasury for the program.',
      payload: {
        name: programName,
        description:
          `The organisation behind ${programName}. It holds the shared wallet both funding streams pay into, ` +
          `publishes where every machine went, and decides — in the open — which applicants get the funded seats.`,
        label: 'nonprofit',
        governance_preset: 'democratic',
        is_public: true,
        visibility: 'public',
      },
    },
    {
      key: 'project',
      entityType: 'project',
      role: 'The initiative itself — funding goal, milestones, public accounting.',
      payload: {
        title: programName,
        description:
          `${totalSeats} computers to ${destination}: ${sponsoredSeats} bought by families who can pay, ` +
          `${fundedSeats} given to kids whose families cannot, and unlimited AI for all ${totalSeats}.\n\n` +
          `Every sponsored seat is priced at two machines — one for the buyer's kid, one for a matched kid. ` +
          `The cause covers any funded seat a sponsor did not. Machines are listed one by one on the wishlist, ` +
          `so a supporter can pay for a specific machine and see it handed over.\n\n` +
          `Milestones: hardware bought → shipped and cleared → handover day → 90-day check-in with each recipient.`,
        goal_amount: Math.round(totalSeats * seatCost),
        currency: PLATFORM_DEFAULT_CURRENCY,
        funding_purpose:
          `${totalSeats} refurbished laptops with chargers (${Math.round(totalSeats * seatCost * 0.7)}), ` +
          `shipping, customs and local transport (${Math.round(totalSeats * seatCost * 0.15)}), ` +
          `first year of connectivity per recipient (${Math.round(totalSeats * seatCost * 0.1)}), ` +
          `spares and repairs (${Math.round(totalSeats * seatCost * 0.05)}).`,
        category: 'Education',
        tags: ['education', 'hardware', 'access'],
      },
    },
    {
      key: 'product',
      entityType: 'product',
      role: `Sponsored seat — ${sponsoredSeats} for sale. Each sale funds a matched seat.`,
      payload: {
        title: `Sponsored seat — ${destination}`,
        description:
          `One computer for your kid, one for a kid whose family cannot pay. The price is two machines, ` +
          `because that is exactly what it buys: yours ships with the batch, and the matched machine goes to ` +
          `a recipient chosen against the published eligibility rules. You get the handover photo and the ` +
          `serial number of both.`,
        price: sponsorPrice,
        currency: PLATFORM_DEFAULT_CURRENCY,
        product_type: 'physical',
        inventory_count: sponsoredSeats,
        fulfillment_type: 'manual',
        category: 'Education',
        tags: ['sponsored-seat', 'matched'],
        status: ENTITY_STATUS.DRAFT,
      },
    },
    {
      key: 'cause',
      entityType: 'cause',
      role: `Backstop fund for the ${fundedSeats} free seats — no strings, no repayment.`,
      payload: {
        title: `Funded seats — ${destination}`,
        description:
          `${fundedSeats} computers for kids whose families cannot pay, plus setup and a year of connectivity. ` +
          `Sponsored seats cover most of this; this fund exists so a free seat is never contingent on a sponsor ` +
          `turning up. Anything raised beyond the goal buys the next batch of machines, not overhead.`,
        cause_category: 'Technology Access',
        goal_amount: Math.round(fundedSeats * seatCost),
        currency: PLATFORM_DEFAULT_CURRENCY,
        status: ENTITY_STATUS.DRAFT,
      },
    },
    {
      key: 'wishlist',
      entityType: 'wishlist',
      role: `The manifest — one line per machine, so supporters can fund a specific one.`,
      payload: {
        title: `${totalSeats} machines — ${destination}`,
        description:
          `Every machine in this batch, itemised. Sponsored seats are already spoken for; funded seats are ` +
          `open. Fund a line and you are buying one identifiable computer for one identifiable kid.`,
        type: 'charity',
        visibility: 'private',
        is_active: false,
      },
      children: {
        pathSuffix: '/items',
        label: 'machines',
        payloads: machines,
      },
    },
    {
      key: 'ai_assistant',
      entityType: 'ai_assistant',
      role: 'Unlimited AI tutor — free for every recipient, sponsored or funded.',
      payload: {
        title: `Study tutor — ${destination}`,
        description:
          `The tutor that ships with every machine in this program. Free, unmetered, and identical for ` +
          `sponsored and funded recipients — the hardware is what differs by who paid, the help is not.`,
        category: 'Education',
        system_prompt:
          `You are a patient study tutor for a school-age student who has just received their first computer. ` +
          `Assume nothing about prior computer experience and never make the student feel behind. Explain in ` +
          `short steps, one idea at a time, and check understanding before moving on. Prefer worked examples ` +
          `over definitions. When a student asks for an answer to homework, walk them to it instead of ` +
          `handing it over. Answer in the language the student writes in. If a question is about the machine ` +
          `itself — setup, updates, something broken — help with that first; a student who cannot use the ` +
          `laptop cannot study on it.`,
        welcome_message:
          `Hi! I am your tutor. Ask me anything — schoolwork, a word you do not know, or how to make this ` +
          `computer do something. There is no limit and nothing to pay.`,
        pricing_model: 'free',
        price_per_message: 0,
        temperature: 0.6,
        status: ENTITY_STATUS.DRAFT,
        is_public: false,
      },
    },
    {
      key: 'event',
      entityType: 'event',
      role: 'Handover day — machines given out and set up with their owners.',
      payload: {
        title: `Handover day — ${destination}`,
        description:
          `All ${totalSeats} machines handed to their recipients, unboxed and set up in the room: accounts ` +
          `created, connectivity tested, tutor opened and used once before anyone goes home. Guardians ` +
          `welcome. Sponsors are invited but recipients are not identified by who paid for their machine.`,
        event_type: 'workshop',
        category: 'Education',
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        timezone,
        is_all_day: false,
        is_online: false,
        venue_country: destination,
        max_attendees: totalSeats * 3,
        requires_rsvp: true,
        is_free: true,
        status: ENTITY_STATUS.DRAFT,
      },
    },
    {
      key: 'document',
      entityType: 'document',
      role: 'The rules, in writing, where your Cat can read them.',
      payload: {
        title: `${programName} — program rules`,
        content:
          `# ${programName}\n\n` +
          `## Seats\n` +
          `- ${sponsoredSeats} sponsored seats, sold at ${sponsorPrice} ${PLATFORM_DEFAULT_CURRENCY} (two machines).\n` +
          `- ${fundedSeats} funded seats, given at no cost.\n` +
          `- Machine cost basis: ${seatCost} ${PLATFORM_DEFAULT_CURRENCY} (~${seatCostBtc} BTC) including shipping, setup and one year of connectivity.\n\n` +
          `## Matching rule\n` +
          `One sponsored seat funds exactly one funded seat. If sponsored seats sell out and funded seats are ` +
          `still unfunded, the cause covers the remainder. Surplus rolls into the next batch — never into overhead.\n\n` +
          `## Eligibility for a funded seat\n` +
          `- School-age, currently enrolled.\n` +
          `- No working computer in the household.\n` +
          `- Household income below the local threshold published with this program.\n` +
          `- One machine per household.\n` +
          `Selection is made in the open by the group, against these criteria only.\n\n` +
          `## What every recipient gets\n` +
          `Identical hardware, identical setup, and the same unlimited AI tutor. Sponsored and funded ` +
          `recipients are not distinguished at handover or afterwards.\n\n` +
          `## Reporting\n` +
          `- Serial number and destination published per machine.\n` +
          `- Handover photos, with consent, per machine.\n` +
          `- 90-day check-in with every recipient, results published.\n` +
          `- Any machine that fails inside a year is replaced from the spares budget.\n`,
        document_type: 'notes',
        visibility: 'cat_visible',
        tags: ['program', 'education', 'rules'],
      },
    },
  ];
}

export const COMPUTERS_TO_KIDS: ProgramBlueprint = {
  id: 'computers-to-kids',
  name: 'Computers to kids, matched',
  tagline: 'Half the seats sold at double price. Half given away. Same AI for all of them.',
  summary:
    'Families who can pay buy a seat at the cost of two machines — theirs and a matched one for a kid ' +
    'whose family cannot. A cause covers any matched seat a sponsor did not, so a free seat never depends ' +
    'on a sponsor showing up. Every recipient gets the same unmetered AI tutor, and every machine is ' +
    'listed individually so a supporter can fund one specific computer.',
  icon: Laptop,
  params: [
    {
      key: 'destination',
      label: 'Where the machines go',
      type: 'text',
      defaultValue: DEFAULTS.destination,
      help: 'Country or city. Used in the public titles and as the handover venue country.',
    },
    {
      key: 'sponsoredSeats',
      label: 'Sponsored seats',
      type: 'number',
      defaultValue: DEFAULTS.sponsoredSeats,
      min: 0,
      max: 500,
      suffix: 'seats',
      help: 'Sold to families who can pay. Each sale funds one matched seat.',
    },
    {
      key: 'fundedSeats',
      label: 'Funded seats',
      type: 'number',
      defaultValue: DEFAULTS.fundedSeats,
      min: 0,
      max: 500,
      suffix: 'seats',
      help: 'Given at no cost to kids whose families cannot pay.',
    },
    {
      key: 'seatCost',
      label: 'Cost of one machine',
      type: 'number',
      defaultValue: DEFAULTS.seatCost,
      min: 1,
      suffix: PLATFORM_DEFAULT_CURRENCY,
      help: 'Hardware, shipping, setup and the first year of connectivity. Sponsors pay twice this.',
    },
    {
      key: 'seatCostBtc',
      label: 'Cost of one machine in BTC',
      type: 'number',
      defaultValue: DEFAULTS.seatCostBtc,
      min: 0.00000001,
      suffix: 'BTC',
      help: 'The same cost, in BTC. Wishlist lines are denominated in BTC.',
    },
    {
      key: 'timezone',
      label: 'Handover timezone',
      type: 'text',
      defaultValue: DEFAULTS.timezone,
      help: 'IANA name, e.g. Asia/Kolkata. The handover event is scheduled in this zone.',
    },
  ],
  buildSteps,
};
