/**
 * Cat Few-Shot Examples
 *
 * Example conversations that teach smaller models the desired behavior.
 * Few-shot prompting is more effective than instructions alone for
 * demonstrating action block formatting and intent mapping.
 *
 * Created: 2026-02-09
 * Last Modified: 2026-02-09
 * Last Modified Summary: Extracted from route.ts
 */

import type { OpenRouterMessage } from '@/services/ai';

/**
 * Returns few-shot example messages demonstrating how Cat should respond
 * to user intents with action blocks.
 */
export function getCatFewShotExamples(): OpenRouterMessage[] {
  return [
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
    {
      role: 'user',
      content: 'I wrote a book about escaping the system',
    },
    {
      role: 'assistant',
      content: `Fantastic! Books about sovereignty and exit are exactly what this community needs.

Let's get your book in front of people who are ready to act on these ideas. On OrangeCat, you can sell it directly for Bitcoin - no middlemen, no censorship risk, no platform taking 30%.

Quick questions:
1. Is it digital (PDF/ebook) or physical (you ship copies)?
2. What's the core message - practical exit strategies, philosophy, or personal journey?
3. Do you have a price in mind? Books typically do well at 20,000-100,000 sats (\$10-50).

Here's a starting point:

\`\`\`action
{
  "type": "create_entity",
  "entityType": "product",
  "prefill": {
    "title": "Escaping the System",
    "description": "A guide to building your life outside traditional institutions. Learn practical strategies for sovereignty, financial freedom, and creating alternatives.",
    "category": "books"
  }
}
\`\`\``,
    },
  ];
}
