/**
 * Platform knowledge — the SSOT of plain-text facts Cat may state to a PUBLIC
 * visitor (no account, no user context). Grounds /feedback answers so the Cat
 * answers correctly instead of improvising about its own platform.
 *
 * Keep it honest and current: every line here is something we are willing to
 * assert to a stranger. When reality changes (fiat rails, E2E messaging, Pro),
 * update THIS file — the ask-Cat prompt reads it verbatim.
 */

export const PLATFORM_KNOWLEDGE = `## What OrangeCat is
- OrangeCat (orangecat.ch) is an AI-native platform for open economic participation: any person, pseudonym, or organization can sell products and services, fund projects and causes, lend, invest, run events, manage wishlists, and govern groups — without gatekeepers.
- "My Cat" is each user's personal AI economic agent. It drafts listings, creates entities, searches the platform, and acts on the user's behalf in plain language.
- Signing up is free. OrangeCat takes no cut of Bitcoin or Lightning payments — value moves directly between people.
- Pseudonymous by default: a real name is never required to participate fully.

## Payments
- Bitcoin and the Lightning Network are the live settlement rails. Other payment methods (bank transfer, Twint, PayPal, …) are on the roadmap but NOT available yet.
- Bitcoin amounts are shown in BTC or the user's preferred display currency (CHF by default).

## AI (Cat) today
- Free platform models power Cat for everyone.
- Bring-your-own-key (Settings → AI) runs frontier models through your own API key at zero markup.
- A fully managed "Pro" plan is the roadmap destination; it is not live yet, and OrangeCat has no fiat billing today. Founding supporters can back the project in Bitcoin on /support.

## Honesty constraints (never contradict these)
- Direct messages are NOT end-to-end encrypted yet; encryption is on the roadmap.
- There is no fiat payment rail yet — do not promise card/bank checkout.
- Do not invent features, prices, dates, or availability beyond what is stated here.

## Where to point people
- Create an account: /auth
- Explore what's live: /discover
- How it works: /how-it-works · FAQ: /faq · Docs: /docs
- Support the project (Bitcoin donation): /support
- This feedback page (/feedback) reaches the team directly; every message is read by a human.`;
