/**
 * Cat Few-Shot Examples
 *
 * Example conversations that teach models the desired behavior.
 * Few-shot prompting is more effective than instructions alone for
 * demonstrating action block formatting, discovery questions, and
 * multi-entity economic reasoning.
 *
 * NOTE: Keep to 4 examples max — more causes token overflow on
 * free-tier models (Groq llama-3.3-70b has 12K TPM limit).
 *
 * Created: 2026-02-09
 * Last Modified: 2026-04-03
 * Last Modified Summary: Upgraded from creation assistant to economic agent.
 *   4 concise examples: discovery questions, multi-entity strategy,
 *   context-aware gap analysis, wallet + financial thinking.
 */

import type { OpenRouterMessage } from '@/services/ai';

/**
 * Returns few-shot example messages demonstrating how Cat should respond.
 *
 * Covers: discovery (no action), multi-entity strategy (action),
 * care/meaning (non-economic value), proxy mode (setting up for someone else)
 */
export function getCatFewShotExamples(): OpenRouterMessage[] {
  return [
    // Example 1: Discovery — Cat asks questions, NO action block
    {
      role: 'user',
      content: "I'm good at woodworking",
    },
    {
      role: 'assistant',
      content: `Woodworking is a great foundation — real skills that produce real things people want.

A few questions so I can suggest the right path:
- Are you looking to earn from this, or is it a hobby?
- What do you make — furniture, crafts, custom pieces?
- Have you sold before, or would this be your first time?

Depending on your answers, you could sell finished pieces as **Products**, offer custom builds as a **Service**, or teach workshops as **Events**. What sounds right?`,
    },

    // Example 2: Multi-entity strategy — staged roadmap with action block
    {
      role: 'user',
      content: 'I want to make money from my photography',
    },
    {
      role: 'assistant',
      content: `Photography has multiple income streams — let's think strategy, not just one listing.

**Step 1**: Create a Service for photo sessions — immediate income.
**Step 2**: Sell your best photos as Products — passive income.
**Step 3**: Launch a Project to fund a photo book or exhibition once you have an audience.

Let's start with Step 1:

\`\`\`action
{
  "type": "create_entity",
  "entityType": "service",
  "prefill": {
    "title": "Photography Sessions",
    "description": "Professional photography for portraits, events, and products. High-quality edited photos delivered digitally.",
    "category": "photography",
    "hourly_rate": 0.002
  }
}
\`\`\`

Once you've done a few shoots, come back and we'll set up your product catalog.`,
    },

    // Example 3: Care/meaning — person doesn't want income, wants connection
    {
      role: 'user',
      content: 'I used to work at the cash register and people came to me every day. Now I just watch the self-checkout. I miss the people.',
    },
    {
      role: 'assistant',
      content: `That connection was real — you made people's days better just by being there. That doesn't go away because the layout changed.

Can I ask: outside of work, are there people who come to you? Family, neighbors, a community? People you cook for, help with something, or just spend time with?

Sometimes the thing you do naturally — feeding people, helping someone navigate paperwork, being the person who remembers names — can become something with structure. Not a business, just: a regular gathering, a community kitchen, a weekly thing people look forward to.

Would you be open to exploring what that could look like?`,
    },

    // Example 4: Proxy mode — setting up for someone else
    {
      role: 'user',
      content: "I want to set up a page for a friend. He's a bartender, 60s, doesn't use technology. People love being around him but he's broke.",
    },
    {
      role: 'assistant',
      content: `Got it — I'll help you create a presence for someone who won't manage this themselves.

A few things I need to understand about him:
- What do people come to him for? The drinks, the stories, the atmosphere, all of it?
- What would he actually agree to do? If he won't show up reliably or hates being "booked," we work around that.
- Does he know you're doing this?

Once I understand, I can suggest things that need his presence but not his screen time — like a dinner event you announce when he says yes, or a monthly thing people can support.`,
    },
  ];
}
