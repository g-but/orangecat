# ADR-0006: Cat Acts Inside the Turn

Date: 2026-09-07
Status: Proposed

## Context

The ask: make Cat much smarter and much more powerful.

The instinct is to add actions. That is not the constraint. Measured today:

|                                               |                                                                      |
| --------------------------------------------- | -------------------------------------------------------------------- |
| Actions in `CAT_ACTIONS`                      | **49**, every one `enabled`, every one handler-backed                |
| Categories                                    | entities 15, context 16, communication 8, payments 7, organization 3 |
| Function-calling tools (a _separate_ surface) | **8**                                                                |
| Static system prompt budget                   | **54,600** chars, of which the action catalog is only **5,303**      |
| Context budget                                | 28,000 chars across 20 sections                                      |
| Default permissions for a new user            | `context` only — everything else **off**                             |

Cat can already do a great deal. What it cannot do is **think**: it never sees
the result of anything it does, and the two things it can do — look something up
and change something — live in different mechanisms that cannot be combined.

### The shape of the ceiling

`chat-orchestrator.ts` runs a turn in this order:

```
tool phase (≤3 steps, read-only)  →  model writes the whole reply  →
parseActionsFromResponse(fullContent)  →  runExecActions(...)
```

Actions are scraped out of **finished text** and fired afterwards. The system
prompt is admirably honest about the consequence:

> "its result does NOT exist yet while you write — announce it as in progress…
> NEVER as already done."

So Cat cannot say "done", cannot check whether it worked, cannot react to a
failure, and cannot use one result to choose the next step. It is not an agent;
it is a text generator with a side effect stapled to the end.

Four more measured limits, each of which makes Cat look stupid in a way that is
not the model's fault:

1. **The two surfaces are disjoint.** The 8 tools (`search_platform`,
   `query_my_data`, …) are read-only and go through `tool-executor.ts`. The 49
   actions are write and go through `action-executor.ts` with permissions,
   spend caps and an audit log. Nothing can chain _search → decide → execute →
   verify_, because the halves do not meet.
2. **A hardcoded keyword list gates every tool.** `messageMightNeedTools()` is
   ~90 English substrings. "Why are you so slow?" matches nothing, so
   `check_cat_health` — written for exactly that question — never fires.
3. **Most providers get no tools at all, silently.** `tool-use.ts` returns the
   messages unchanged for any provider that is not Groq or OpenRouter, while
   the prompt states "You have access to tools" unconditionally. A BYOK
   Together/Ollama user has a Cat that believes it can search and cannot.
4. **`exec_action` parameters are never validated.** The registry declares
   `parameters[]` with names, types and required flags; the executor takes
   `z.record(z.string(), z.unknown())` and hands model JSON straight to the
   handler. Each handler re-checks ad hoc. This is what breaks first when the
   registry grows.

And one that is a live product bug rather than a design limit: **the local-model
path is given the same prompt and executes nothing.** `/api/cat/prepare` hands
the browser the full 49-action catalog; `/api/cat/local-complete` only calls
`saveMessages` — no parsing, no execution. A local Cat emits `exec_action`
blocks that are stored as literal text forever.

## Decision

### D1 — One surface. Every action is a tool.

Delete the text-scraping path. `CAT_ACTIONS` already carries everything a tool
definition needs — id, description, typed `parameters[]` — so tool schemas are
**generated from the registry**, not written twice. The 8 read tools join the
same registry as `category: 'read'` entries.

One registry ⇒ one permission check, one audit trail, one confirmation model,
one place to add a capability. Today `forget_memories` exists in both worlds and
its tool twin bypasses the permission service entirely; that class of divergence
becomes impossible rather than merely fixed.

### D2 — Act inside the turn, and feed results back. This is the whole ADR.

The loop becomes:

```
model → tool_call → execute (perms, caps, confirmation) → result → model → …
      → final text, written KNOWING what happened
```

Bounded: **≤8 steps**, one 25s wall clock, and the existing spend caps unchanged.
A step that needs confirmation suspends the loop and returns the pending card, as
now — the difference is that on confirmation the loop **resumes** instead of the
turn being over.

This is what "smarter" actually means here. It buys, with no new actions:

- "Did it work?" answerable in the same breath as "do it".
- Recovery: a failed create can be retried with a corrected slug, not reported.
- Chaining: _find the project → check it has a wallet → publish it_ is one turn.
- Truthful past tense. The prompt's "never say done" rule can be deleted,
  because Cat will know.

### D3 — Capability decides tools, not keywords.

Delete `messageMightNeedTools`. The model decides whether it needs a tool; that
is what tool-calling is for, and a 90-word English list is both a capability
cliff and a non-English cliff.

Providers that genuinely cannot call tools are handled by **telling the truth**:
`model-capability.ts` already tiers models, and the prompt's tool section is
rendered only when the resolved provider supports them. A Cat that says it can
search should be able to search.

### D4 — Validate parameters at the boundary, from the registry.

Generate a Zod schema per action from the declared `parameters[]` and validate
before the handler. A missing required field becomes a typed rejection the model
can _see and correct_ on the next loop step — which only becomes useful once D2
exists, and which is what makes a larger registry safe.

### D5 — A first run that can do something.

A new user's Cat has `context` only: it cannot create, message, or pay. It looks
broken, and the fix is buried in settings. Replace with an **inline grant** — the
first time Cat wants a capability it does not have, it asks in the conversation,
with the specific action named, and the grant applies from that turn on.

Two corrections while in here, both measured: `update_profile` sits in the
default-on `context` category with `requiresConfirmation: false`, so a brand-new
user's Cat can rewrite their handle and bio with no grant and no confirmation —
it moves to `entities` and requires confirmation. And the `settings` permission
category has zero actions referencing it: a dead row in the permissions UI.

### D6 — Cat can check its own work.

`track-record.ts` already joins `cat_action_log` against current entity status
and settled payments to derive proposed → published → funded, plus setbacks.
Today it is context only. Make it a read tool so Cat can answer "what did you do
for me?" and, more usefully, notice its own pattern: _"the last three projects I
drafted for you never got published — want me to finish one?"_

### D7 — The prompt diet is a separate lever, and it is the one that unlocks speed.

Worth stating plainly so it is not conflated with the above: moving the action
catalog into tool definitions saves **5,303 of 54,600 chars**. It does not fix
the fact that Cat overflows platform Groq's ceiling and therefore runs on
OpenRouter's shared free pool.

`SECTION_SELECTION_ENABLED` — per-turn prompt trimming — is already built and
switched off, explicitly because there was no free-model capacity to validate it
against the eval. That is the actual speed fix, it is 90% written, and it should
be validated and enabled as its own piece of work.

### D8 — Stop the local path from lying.

Either run the same tool loop against the local model, or serve the local path a
prompt without the tool and action sections. Shipping the full catalog to a path
that executes nothing is the one thing here that is unambiguously a bug.

## What this is not

**Not more actions.** 49 is plenty and the registry is healthy; the constraint is
that Cat cannot see, chain, or verify. Adding a 50th action to a system that
fires blind makes it more dangerous, not smarter.

**Not a bigger model.** The failures above are structural. A frontier model
inside a parse-and-fire loop still cannot see its own results.

## Order

1. **D4 + D1** — registry-generated schemas and one surface. Safe, mechanical,
   and the precondition for everything else.
2. **D2** — the loop. The step that changes what Cat is.
3. **D3 + D8** — stop lying about tools, on every path.
4. **D5** — the first run.
5. **D6** — self-knowledge.
6. **D7** — the prompt diet, separately, with the eval.

## Related

- ADR-0005 — unclaimed pages; Cat's verb for that flow arrives naturally once
  the loop exists, since "set up X for Y" becomes a chain rather than a
  bespoke action.
