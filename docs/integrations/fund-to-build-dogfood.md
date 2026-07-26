# OrangeCat ↔ FleetCrown founder dogfood

This is the first complete release slice. It is intentionally Bitcoin-only and
human-approved.

## Production prerequisites

1. Apply `20260723000000_public_bitcoin_support.sql` to OrangeCat.
2. Apply FleetCrown migration `075_orangecat_entity_links.sql`.
3. Set the same 32+ character `FLEETCROWN_BUILD_INTENT_SECRET` on both apps.
4. Set the same `ORANGECAT_WEBHOOK_SECRET` on both apps.
5. Confirm FleetCrown's OrangeCat OIDC client and callback are configured.
6. Confirm the canonical OrangeCat project IDs in each app's environment.

## Acceptance flow

1. Open a published OrangeCat project in a private browser window.
2. Share its canonical URL and confirm the link preview has its title,
   description, and image.
3. Choose a small BTC amount under **Support with Bitcoin**.
4. Pay the generated request without creating or signing into an account.
5. Confirm:
   - NWC and LUD-21 capable Lightning Address payments settle automatically;
   - on-chain support appears only after confirmation;
   - a Lightning Address without LUD-21 waits for payer acknowledgement and
     then appears in the owner's **Confirm received payments** list;
   - the public funding total changes only after confirmed settlement.
6. As the project owner, choose **Build it with FleetCrown**.
7. Sign in to FleetCrown with the same OrangeCat identity.
8. Review the entity context and Loki's proposed plan. Confirm that no agent has
   been dispatched.
9. Create a new FleetCrown project or link an existing one.
10. Confirm the FleetCrown project links back to OrangeCat and shows the
    read-only confirmed BTC summary.
11. Fund the OrangeCat entity again and confirm a deduplicated funding event
    reaches the linked FleetCrown project's activity stream.

## Club example

Create a normal OrangeCat **Group** for the club. Do not add a special Club
entity. The signed FleetCrown handoff should suggest:

- mission and membership model;
- business plan and conservative financials;
- location, permit, supplier, and staffing research;
- website and outreach material;
- an owner-approved launch plan.

Loki may research and prepare work. It must not sign a lease, contact a
counterparty, spend money, or dispatch agents without the owner's explicit
approval.

## Explicit non-goals

- Twint, cards, bank transfers, or other fiat settlement;
- Monero, Zcash, Pirate Chain, or other privacy-coin settlement;
- smart-contract escrow or milestone release;
- automatic agent dispatch after funding;
- a merged OrangeCat/FleetCrown frontend or a special club workflow.
