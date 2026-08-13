import { z } from 'zod';

/**
 * Newsletter signup (/api/newsletter/subscribe). One required field — the
 * whole point of a capture box is that typing an email is enough.
 */
export const newsletterSubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email')
    .max(200, 'Email must be at most 200 characters'),
  // Which surface captured the signup — attribution, not user input.
  source: z.string().trim().min(1).max(50).optional().default('blog'),
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;
