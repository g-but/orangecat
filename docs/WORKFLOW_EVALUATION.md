# Critical Workflow Evaluation

**Date**: 2026-03-24
**Branch**: hardening/full-pass-2026-03-19
**Scope**: Every key user workflow assessed for design and engineering quality

---

## Workflow Summary

| #   | Workflow               | Design | Engineering | Overall | Verdict                                        |
| --- | ---------------------- | ------ | ----------- | ------- | ---------------------------------------------- |
| 1   | Auth & Onboarding      | 6/10   | 8/10        | 7/10    | Functional but missing profile completion step |
| 2   | Entity Creation        | 9/10   | 10/10       | 9.5/10  | Exemplary DRY architecture                     |
| 3   | Discovery & Search     | 8/10   | 9/10        | 8.5/10  | Solid multi-tier search, good SEO              |
| 4   | Payments & Wallets     | 7/10   | 8/10        | 7.5/10  | NWC excellent; on-chain status missing         |
| 5   | Cat (AI Agent)         | 7/10   | 7/10        | 7/10    | Chat works; action execution incomplete        |
| 6   | User-to-User Messaging | 8/10   | 7/10        | 7.5/10  | Real-time works; no encryption                 |
| 7   | Groups & Governance    | 9/10   | 9/10        | 9/10    | Flexible model, clean architecture             |

---

## 1. Authentication & Onboarding

### Flow

```
Landing → Auth Page (OAuth/Email) → Email Confirm → Callback → Dashboard (welcome modal)
```

### What Works Well

- OAuth smooth (Google, GitHub, Facebook, X)
- Lazy profile creation (auto-bootstrapped on first access)
- Lazy actor creation (on first entity)
- Welcome modal shows contextual next steps
- Protected route middleware redirects correctly

### What's Missing

- **No profile completion step** — Username auto-generated from email, never customized
- **No guided wallet setup** — Welcome says "Add wallet" but no walkthrough
- **No onboarding wizard** — User dropped into full dashboard immediately
- **Email confirmation has no landing page** — Just redirects silently

### Recommendation

Add a 3-step post-auth flow: **Profile setup** (name, username, avatar, bio) → **Wallet setup** (guided Lightning/on-chain) → **First entity** (template-based quick start). Gate dashboard access behind profile completion.

---

## 2. Entity Creation (Products, Services, Projects, etc.)

### Flow

```
Dashboard → Create Page → Template Selection → EntityForm (auto-save) → API Submit → Draft Entity
```

### What Works Well

- **Exemplary DRY**: One `EntityCreationWizard` + one `EntityForm` + one `createEntityPostHandler` for ALL 14 entity types
- **Configuration-driven**: Forms, validation, guidance, templates all from config files
- **Progressive disclosure**: Templates → basic fields → advanced (collapsible)
- **Safety**: Auto-save drafts to localStorage, dual validation (client + server), rate limiting
- **Guidance panel**: Every field has contextual tips + real examples
- **Adding a new entity type**: ~200 lines of config (no new components needed)

### What's Missing

- **Publish flow unclear** — Entity created as draft, but no obvious "Publish" button in the form
- **AI prefill not in wizard mode** — Only available in direct form mode
- **No creation success page** — Redirects to list; could show "What's next?" options

### Verdict

**Best-in-class architecture.** This is the gold standard for the codebase. Every entity type follows identical patterns with zero duplication. The factory pattern, config-driven UI, and generic API handler are textbook.

---

## 3. Discovery & Public Browsing

### Flow

```
Homepage → Discover Page (search + filters + tabs) → Entity Detail (SSR + SEO) → Payment/Contact
```

### What Works Well

- **Multi-tier search**: PostGIS RPC → Full-text search → ILIKE fallback
- **Geospatial filtering**: Haversine formula for accurate radius search
- **SEO**: generateMetadata(), JSON-LD structured data, OG tags on all public pages
- **URL sync**: Filter state bookmarkable/shareable
- **Performance**: Lazy-loaded homepage sections, 300ms search debounce, 5-min client cache

### What's Missing

- **No relevance ranking** — Only sorts by recency, no popularity/trending
- **No featured/trending section** — Stats shown but no curated content
- **No saved items or favorites** — Can't bookmark entities from public pages
- **Profiles tab ignores location filters**
- **Only 2 sort options** (relevance, recent)

### Recommendation

Add popularity-based ranking (view count, contribution count). Add "Featured" carousel on discover page. Enable saving/favoriting from public views.

---

## 4. Payments & Wallets

### Flow

```
Wallet Setup (manual) → Entity Purchase → Wallet Resolution → Invoice Generation → QR Code → Poll → Confirm
```

### What Works Well

- **NWC implementation excellent** — Proper NIP-47 protocol, encrypted URI storage (AES-256-GCM), per-user isolation
- **Three payment methods**: NWC > Lightning Address > On-chain (priority-based resolution)
- **Adaptive polling**: 3s (NWC), 5s (Lightning), 30s (on-chain)
- **UX touches**: Countdown timer, "Open in Wallet" deep links, copy-to-clipboard
- **Security**: Address validation (all types), encrypted NWC URIs, rate limiting

### Critical Gaps

- **On-chain status detection missing** — No Mempool/Blockstream API integration; on-chain payments can't be verified server-side
- **Lightning Address verification incomplete** — Relies on buyer honesty (`buyer_confirmed` has no proof)
- **Group wallet resolution broken** — `walletResolutionService` doesn't handle group actor case
- **No refund flow** — Orders created but no reversal mechanism
- **No invoice refresh** — Expired invoice requires closing and reopening dialog

### Recommendation

Implement on-chain status checking (Mempool API). Add invoice regeneration on expiry. Fix group wallet resolution. Long-term: add refund workflow.

---

## 5. Cat (AI Agent)

### Flow

```
/dashboard/cat → Chat Tab (streaming SSE) → Context Tab (knowledge summary) → Settings (model selection)
```

### What Works Well

- **Streaming responses** via SSE with graceful degradation
- **Dual provider**: Groq (free) + OpenRouter (BYOK paid models)
- **Rich context**: Builds system prompt from user's entities, documents, profile, stats
- **Context tab**: Shows what the Cat knows + completeness score + smart suggestions
- **Action suggestions**: Cat can suggest entity creation with prefill params
- **Cost-aware**: Tracks token usage, daily free limits, BYOK override

### Critical Gaps

- **Action execution incomplete** — Cat can suggest creating entities but cannot execute high-risk actions (send message, send payment, manage group)
- **23 actions defined in registry but only entity creation works** — Rest are stubs
- **Tool use limited** — Only platform search via Groq; OpenRouter has no tools
- **Response parser fragile** — Regex-based markdown extraction for action blocks
- **No conversation branching** — Linear chat only, no threads

### Recommendation

Complete action execution for medium-risk actions (post to timeline, send message). Add confirmation UI workflow. Expand tool use beyond search (look up profiles, check prices). Replace regex parser with structured output.

---

## 6. User-to-User Messaging

### Flow

```
Open MessagePanel → Select/Create Conversation → Send Message → Real-time Updates (Supabase)
```

### What Works Well

- **Complete CRUD**: Create, read, edit, delete conversations and messages
- **Real-time**: Supabase Postgres changes via websocket with debounced callbacks
- **Cursor-based pagination**: Efficient infinite scroll for long conversations
- **Rich features**: Typing indicators, read receipts, unread badges, file uploads
- **Soft deletes**: Audit trail preserved, messages recoverable
- **Bulk operations**: Multi-select conversations for deletion

### Critical Gaps

- **No encryption** — Messages stored in plaintext; sensitive data (Bitcoin addresses, payment details) exposed
- **Admin client bypasses RLS** — `fetchUserConversations` uses admin client for performance
- **No message search** — Can't search across conversations
- **No threading** — Flat message list only
- **No reactions** — Placeholder in context menu but not implemented

### Recommendation

Implement E2E encryption (libsodium). Refactor to use RLS properly. Add full-text search on messages. Consider threading for group conversations.

---

## 7. Groups & Governance

### Flow

```
Create Group (label-based wizard) → Invite Members → Enable Features → Proposals → Voting → Execute
```

### What Works Well

- **Label-based creation**: 8 group types (Circle, DAO, Company, etc.) with smart defaults, but labels don't lock capabilities
- **Flexible governance**: Consensus (100%), Democratic (51%), Hierarchical (founder decides)
- **Feature system**: Treasury, proposals, voting, events, marketplace — all opt-in per group
- **Context switching**: Seamless individual ↔ group toggle in sidebar
- **Database security**: RLS on all group tables, proper role hierarchy (founder > admin > member)
- **Bitcoin-native treasury**: Group wallets with multi-sig support (schema ready)
- **Clean SSOT**: Labels in config, presets in config, features in config

### Gaps

- **No email notifications** — Invitations created but not delivered
- **Proposal execution not automated** — Passes but doesn't auto-execute (treasury transfers, membership changes)
- **No vote delegation or weighted voting** — Schema supports `voting_power` but not exposed
- **No group discovery** — Can't browse/search public groups
- **Activity stream placeholder** — "Coming soon" in UI

### Verdict

**Production-ready governance.** The architecture is clean and extensible. The label/feature/preset system is well-designed. Main gap is execution automation — proposals pass but require manual follow-through.

---

## Cross-Workflow Issues

### 1. Publish Flow Gap (Affects: Entity Creation, Discovery)

Entities are created as `draft` (correct safety default), but there's no clear "Publish" button in the creation flow. Users must navigate to their entity list and find the status toggle. **Fix**: Add explicit "Save as Draft" vs "Publish Now" choice on creation form, or show a post-creation CTA.

### 2. Wallet Dependency (Affects: Payments, Entity Creation, Groups)

Wallets are manually created with no guided setup. Many features (payments, entity monetization, group treasury) require a wallet but don't guide the user to create one. **Fix**: Inline wallet creation from any context that needs one.

### 3. Actor System Invisible (Affects: All Workflows)

The actor abstraction (users and groups share ownership model) is powerful but completely hidden from users. When context-switching between individual and group, the underlying actor swap is opaque. **Fix**: Not necessarily a UX issue — the abstraction should remain invisible. But error messages should never mention "actor_id".

### 4. Sats vs BTC Display (Affects: Payments, Entity Creation, Templates)

Templates and forms use sats (e.g., `price: 25000`), but CLAUDE.md mandates BTC as canonical unit. This creates inconsistency between the documented architecture and the actual user experience. **Fix**: Strategic migration (P2 item from audit).

### 5. No Notification System (Affects: Messaging, Groups, Payments)

No email or push notifications. Payment received? No notification. Group invite? No email. New message? Only visible when checking the app. **Fix**: Implement email notification service for critical events (payment received, group invite, new message).

---

## Priority Matrix

### Must Fix Before Launch

1. **On-chain payment status detection** — Payments can't be verified
2. **Publish flow clarity** — Users don't know how to make entities public
3. **Profile completion step** — Auto-generated usernames are a bad first impression
4. **Group wallet resolution** — Group payments broken

### Should Fix Soon After Launch

5. **Email notifications** — Critical for engagement (payments, messages, invites)
6. **Cat action execution** — The AI agent's core value prop is incomplete
7. **Message encryption** — Privacy principle unfulfilled
8. **Invoice refresh on expiry** — Payment UX breaks after timeout

### Nice to Have

9. **Search ranking/trending** — Currently recency-only
10. **Onboarding wizard** — Guided first-time experience
11. **Vote delegation** — Advanced governance feature
12. **Message threading** — For complex group discussions
