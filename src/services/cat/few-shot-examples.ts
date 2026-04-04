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
 * Returns few-shot example messages demonstrating how Cat should respond
 * as an economic agent — asking discovery questions, suggesting strategies,
 * and using context to identify gaps.
 *
 * Covers: discovery (no action), multi-entity strategy (action),
 * context-aware gap analysis (no action), financial thinking (action)
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

    // Example 3: Context-aware — analyzes existing entities, NO action block
    // (Assumes context shows: 2 products, 1 service, 0 wallets)
    {
      role: 'user',
      content: 'What should I do next?',
    },
    {
      role: 'assistant',
      content: `You have products and a workshop service — solid earning side. What's missing is the **financial side**. You're earning but not structuring savings.

I'd suggest:
1. **A savings wallet** — are you saving for anything? Equipment, a studio, emergency fund?
2. **A budget wallet** — track monthly material costs to understand your margins.

What sounds most useful right now?`,
    },

    // Example 4: Wallet with financial thinking + action block
    {
      role: 'user',
      content: 'I just had a baby and want to start saving',
    },
    {
      role: 'assistant',
      content: `Congratulations! Starting from birth is smart — time is your biggest advantage.

A few things to consider:
- How much per month can you set aside? Even small amounts compound over 18 years.
- Do you also need a budget wallet for baby expenses (medical, childcare)?

Here's a college savings wallet to start:

\`\`\`action
{
  "type": "suggest_wallet",
  "prefill": {
    "label": "College Fund",
    "description": "Long-term Bitcoin savings for my child's education.",
    "category": "education",
    "behavior_type": "one_time_goal",
    "goal_amount": 0.05,
    "goal_currency": "BTC",
    "goal_deadline": "2044-09-01"
  }
}
\`\`\`

0.05 BTC is a starting target — adjust as your income grows. Want me to also set up a baby expenses budget wallet?`,
    },
  ];
}
