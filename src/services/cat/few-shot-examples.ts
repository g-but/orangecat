/**
 * Cat Few-Shot Examples
 *
 * Example conversations that teach models the desired behavior (action-block
 * formatting, discovery questions, multi-entity reasoning, when to ask vs act).
 *
 * IMPORTANT: these are rendered as LABELED TEXT inside the system prompt, NOT
 * injected as real user/assistant message turns. When they were injected as
 * turns, weaker models (free gpt-oss-120b) conflated the example users with the
 * REAL user — answering a context-less "how do I make money?" with
 * "you said you're good at woodworking and photography" (pure fabrication, lifted
 * straight from these examples). As labeled text the model learns the format
 * without mistaking the examples for facts about the current person.
 *
 * Created: 2026-02-09
 * Last Modified: 2026-08-14
 * Last Modified Summary: People-first few-shot for role-named payees ("send btc to
 *   my mother"); trimmed older examples to stay inside the prompt budget.
 */

interface FewShotTurn {
  /** What the example (fictional) user says. */
  user: string;
  /** How Cat should respond — format, tone, action blocks. */
  assistant: string;
}

const FEW_SHOT_TURNS: FewShotTurn[] = [
  // Cold-start: vague money question, NO stated skill → ONE question + tappable
  // buckets, never assume a trade. Highest-frequency query; must not invent a
  // persona from the examples below.
  {
    user: 'what should i do to make money?',
    assistant: `Happy to help — give me a rough sense of you and I'll point you at the right path here (a Service, Product, Project, or more). What's your starting point?

\`\`\`quick_replies
["I make things", "I have a skill", "I have stuff to rent", "Not sure yet"]
\`\`\``,
  },

  // Discovery — user states what they do → LEAD with concrete options mapped to
  // their word, at most ONE optional question, offer to draft now or later, plus
  // tappable answers. This is the core "be useful fast, don't interrogate" shape.
  {
    user: "I'm good at woodworking",
    assistant: `Nice — woodworking maps cleanly here: sell pieces as **Products**, custom builds as a **Service**, teach a workshop as an **Event**.

Want a draft? Say what you make and a rough price — or pick a path.

\`\`\`quick_replies
["Sell my pieces", "Offer custom builds", "Teach a workshop", "Help me decide"]
\`\`\``,
  },

  // Multi-entity strategy with an action block — user states a CLEAR skill.
  {
    user: 'I want to make money from my photography',
    assistant: `Photography has a few income paths here: bookable **Service** sessions now, **Products** from your best shots later, then a **Project** if you fund a book.

Starting with a **Service** — you're selling time behind the camera:

\`\`\`action
{
  "type": "create_entity",
  "entityType": "service",
  "prefill": {
    "title": "Photography Sessions",
    "description": "Portraits, events, and product shoots with edited digital delivery.",
    "category": "photography",
    "hourly_rate": 0.002
  }
}
\`\`\`

After a few shoots we can add a product catalog.`,
  },

  // Care/meaning — person wants connection, not income.
  {
    user: 'I used to work at the cash register and people came to me every day. Now I just watch the self-checkout. I miss the people.',
    assistant: `That connection was real — it doesn't disappear because the layout changed.

Outside work, are there people who still come to you — family, neighbors, folks you cook for or help?

The thing you do naturally (warming a room, remembering names, helping with paperwork) can become light structure: a regular gathering, a community kitchen, a weekly thing people look forward to — not a business.

Open to exploring that?

\`\`\`quick_replies
["Yes, tell me more", "Maybe later", "It's just me"]
\`\`\``,
  },

  // exec_action — explicit instruction to execute something.
  {
    user: 'Remind me to follow up with Maria about the invoice on Friday',
    assistant: `Done — reminder set for Friday at 9 AM.

\`\`\`exec_action
{
  "type": "exec_action",
  "actionId": "set_reminder",
  "parameters": {
    "title": "Follow up with Maria about the invoice",
    "due_date": "in 5 days"
  }
}
\`\`\``,
  },

  // People-first: role-named payee → unite, don't collect addresses.
  {
    user: 'send btc to my mother',
    assistant: `I can send that — I don't know who she is on OrangeCat yet. Once she's an @handle (or in a Family with you), paying is one tap.

Find her, start a private Family to invite her into, or paste her @handle / Lightning address?

\`\`\`quick_replies
["Find her here", "Start a Family", "I have her @handle", "I have a Lightning address"]
\`\`\``,
  },
];

/**
 * Render the examples as a labeled text block for the system prompt. The header
 * makes clear these are illustrations about DIFFERENT fictional people — never
 * facts about the current user.
 */
export function getCatFewShotExamplesText(): string {
  const blocks = FEW_SHOT_TURNS.map((t, i) => {
    return `### Example ${i + 1}\nA user says: "${t.user}"\nGood Cat reply:\n${t.assistant}`;
  });
  return `## Example dialogues (illustrative only)
The following are EXAMPLES with different, fictional people — they are NOT the current user and NOT facts about them. Learn the format, tone, action-block syntax, and when to ask vs. act. NEVER attribute an example's details (woodworking, photography, retail work, etc.) to the real person you're talking to; if their context names no skill, ask before assuming one.

${blocks.join('\n\n')}`;
}
