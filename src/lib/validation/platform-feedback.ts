import { z } from 'zod';

/**
 * Public feedback / Ask Cat submission (/api/feedback). Deliberately minimal —
 * the whole point of the page is that a person can use it: one message box,
 * everything else optional.
 */
export const platformFeedbackSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Please write a message')
    .max(2000, 'Message must be at most 2000 characters'),
  // Optional contact — an empty string from an untouched input is fine.
  email: z
    .union([z.string().trim().email('Please enter a valid email').max(200), z.literal('')])
    .optional(),
  page_path: z.string().max(300).optional(),
});

export type PlatformFeedbackInput = z.infer<typeof platformFeedbackSchema>;
