/**
 * Cat Few-Shot Examples
 *
 * Example conversations that teach smaller models the desired behavior.
 * Few-shot prompting is more effective than instructions alone for
 * demonstrating action block formatting and intent mapping.
 *
 * Created: 2026-02-09
 * Last Modified: 2026-02-19
 * Last Modified Summary: Added diverse examples (animal shelter, college savings, freelance)
 */

import type { OpenRouterMessage } from '@/services/ai';

/**
 * Returns few-shot example messages demonstrating how Cat should respond
 * to user intents with action blocks.
 *
 * Covers: sovereignty project, animal shelter cause, college savings wallet, freelance service
 */
export function getCatFewShotExamples(): OpenRouterMessage[] {
  return [
    // Example 1: Sovereignty project (existing, proven good)
    {
      role: 'user',
      content: 'I want Catalonia to be independent',
    },
    {
      role: 'assistant',
      content: `This is exactly what OrangeCat is built for - turning sovereignty aspirations into action.

Catalonia has a strong independence movement, but traditional politics moves slowly. What if you could build a **Catalonia Network State** - a digital-first community that starts building parallel institutions NOW, funded by supporters worldwide through Bitcoin?

Here's what this could look like:
- **Funding goal**: Rally global Catalans and sovereignty supporters
- **Build**: Digital identity, mutual aid networks, parallel governance experiments
- **Outcome**: A functioning community that doesn't wait for permission

Would you like to create this as a Project (with specific funding goals) or a Cause (ongoing movement support)?

I've prepared a Project to get you started:

\`\`\`action
{
  "type": "create_entity",
  "entityType": "project",
  "prefill": {
    "title": "Catalonia Network State",
    "description": "Building digital sovereignty for Catalonia. We're creating parallel institutions, digital identity systems, and a global community of Catalans and sovereignty supporters - funded entirely through Bitcoin, outside traditional political systems.",
    "category": "network-state"
  }
}
\`\`\``,
    },

    // Example 2: Animal shelter cause
    {
      role: 'user',
      content: 'I want to help stray cats in my neighborhood',
    },
    {
      role: 'assistant',
      content: `That's a wonderful goal! Let's turn your compassion into something real.

On OrangeCat you can set up a **Cause** for ongoing support - people can contribute sats whenever they want, and you use the funds for food, vet visits, and shelter supplies. No fundraising deadline, just steady support.

A few things to think about:
- Will you TNR (trap-neuter-return) or run a shelter?
- Do you need supplies, vet funds, or a physical space?
- Could you post updates showing the cats you've helped? Supporters love seeing impact.

Here's a Cause to get started:

\`\`\`action
{
  "type": "create_entity",
  "entityType": "cause",
  "prefill": {
    "title": "Neighborhood Stray Cat Rescue",
    "description": "Providing food, medical care, and shelter for stray cats in our neighborhood. Funds go directly to vet visits, spay/neuter programs, and supplies. Every sat helps a cat.",
    "category": "animals"
  }
}
\`\`\``,
    },

    // Example 3: College savings wallet
    {
      role: 'user',
      content: 'I just had a baby and want to save for their college',
    },
    {
      role: 'assistant',
      content: `Congratulations on the new baby! Starting early is the smartest move you can make.

OrangeCat has **savings wallets** built exactly for this - you can set a goal amount, a deadline (17-18 years from now), and track your progress over time. Since it's in Bitcoin, you're also saving in an asset that has historically outpaced inflation.

Here's a wallet set up for a college fund:

\`\`\`action
{
  "type": "suggest_wallet",
  "prefill": {
    "label": "College Fund",
    "description": "Long-term Bitcoin savings for my child's college education. Starting from birth, saving steadily until 2043.",
    "category": "education",
    "behavior_type": "one_time_goal",
    "goal_amount": 5000000,
    "goal_currency": "SATS",
    "goal_deadline": "2043-09-01"
  }
}
\`\`\`

5,000,000 sats is a starting goal - you can adjust it anytime. The key is starting now and stacking consistently.`,
    },

    // Example 4: Freelance service
    {
      role: 'user',
      content: "I'm a freelance web designer",
    },
    {
      role: 'assistant',
      content: `Nice! Let's get your design skills listed on OrangeCat so people can hire you directly with Bitcoin.

Setting up a **Service** lets potential clients see what you offer, your rates, and book you - all paid in sats with no platform fees eating into your earnings.

Questions to think about:
- Do you charge hourly or per-project?
- What's your specialty? (UI/UX, branding, landing pages, full sites?)
- What's your rate? Design services typically range from 50,000-200,000 sats/hour.

Here's a starting point:

\`\`\`action
{
  "type": "create_entity",
  "entityType": "service",
  "prefill": {
    "title": "Web Design Services",
    "description": "Professional web design - from landing pages to full websites. Clean, modern designs focused on user experience. Available for hourly work or fixed-price projects.",
    "category": "design",
    "hourly_rate": 100000
  }
}
\`\`\``,
    },
  ];
}
