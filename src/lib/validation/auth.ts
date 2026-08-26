import { z } from 'zod';
import { usernameSchema } from './base';
import { passwordSchema } from './password';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email'),
    // Was a third copy of these rules, capped at 20 while profile edit allowed
    // 30 — so a name you could not register was one you could rename to.
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
