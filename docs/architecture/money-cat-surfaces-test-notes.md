# Money & Cat control surfaces — test notes

created_date: 2026-08-14  
last_modified_date: 2026-08-14  
last_modified_summary: Audit notes from production page pass + fixes for permissions banner, Discover featured strip, people-first deep links, and Cat payment-permission context.

## Pages under test

| URL                          | Auth   | Role                                                 |
| ---------------------------- | ------ | ---------------------------------------------------- |
| `/receive`                   | yes    | Get paid (QR / request amount)                       |
| `/send`                      | yes    | Pay @handle or invoice                               |
| `/requests`                  | yes    | Ask someone for BTC                                  |
| `/discover`                  | public | Find people & listings (`?type=profiles` for people) |
| `/dashboard/cat/permissions` | yes    | What Cat may do                                      |
| `/dashboard/wallets`         | yes    | Connect / manage wallets                             |
| `/settings/ai`               | yes    | Models, memory, keys                                 |

MoneyTabs binds Receive · Send · Request as one surface.

## Issues found & fixed (2026-08-14)

1. **Permissions banner lied** — Context can enable high-risk `publish_interest` while Payments is 0/7; banner still said “send Bitcoin”. Copy is now specific to Bitcoin vs public actions. Added **Payments off** callout with [Open Send] + [Wallets].
2. **Discover featured strip** — “Recently published” (causes/products) stayed visible on People/other tabs. Now only on **All**.
3. **Cat offered NWC send with Payments off** — Payment Capabilities context now includes `catMaySendPayment`; when false, Cat must link `/send` / permissions, not emit `send_payment`.
4. **People-first deep links** — Use `/dashboard/people`, `/discover?type=profiles`, `/send` (not `/discover?section=people`). Shortcuts for “Open Send” / “Find her here”.

## Manual retest (logged in)

1. Permissions with Payments 0/7 → see “Cat cannot send Bitcoin” + Open Send.
2. Enable a high-risk non-payment action only → banner must not claim Bitcoin.
3. `/discover?type=profiles` → no “Recently published” causes above results.
4. Cat: `send money to my mother` → people-first chips + `/send` link; provenance `people-first`.
5. Tap **Open Send** → short reply with `/send` link (no address form).
