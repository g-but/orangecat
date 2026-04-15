import { loginSchema, registerSchema } from '@/lib/validation/auth';

// A password that satisfies passwordSchema requirements:
// min 8 chars, uppercase, lowercase, number, special char, not a common password
const VALID_PASSWORD = 'Secure@1pass';

describe('loginSchema', () => {
  describe('valid inputs', () => {
    it('accepts a proper email and password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'abcdef',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('email validation', () => {
    it('rejects an email missing @', () => {
      const result = loginSchema.safeParse({ email: 'notanemail', password: 'abcdef' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailErrors = result.error.flatten().fieldErrors.email;
        expect(emailErrors).toBeDefined();
        expect(emailErrors![0]).toMatch(/valid email/i);
      }
    });

    it('rejects an empty email', () => {
      const result = loginSchema.safeParse({ email: '', password: 'abcdef' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined();
      }
    });

    it('rejects an email with no domain', () => {
      const result = loginSchema.safeParse({ email: 'user@', password: 'abcdef' });
      expect(result.success).toBe(false);
    });
  });

  describe('password validation', () => {
    it('rejects a password shorter than 6 characters', () => {
      const result = loginSchema.safeParse({ email: 'user@example.com', password: 'abc' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordErrors = result.error.flatten().fieldErrors.password;
        expect(passwordErrors).toBeDefined();
        expect(passwordErrors![0]).toMatch(/at least 6 characters/i);
      }
    });

    it('rejects an empty password', () => {
      const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.password).toBeDefined();
      }
    });
  });
});

describe('registerSchema', () => {
  const validPayload = {
    email: 'alice@orangecat.app',
    username: 'alice_oc',
    password: VALID_PASSWORD,
    confirmPassword: VALID_PASSWORD,
  };

  describe('valid inputs', () => {
    it('accepts a fully valid registration', () => {
      const result = registerSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });
  });

  describe('email validation', () => {
    it('rejects an invalid email', () => {
      const result = registerSchema.safeParse({ ...validPayload, email: 'bademail' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined();
      }
    });
  });

  describe('username validation', () => {
    it('rejects a username shorter than 3 characters', () => {
      const result = registerSchema.safeParse({ ...validPayload, username: 'ab' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const usernameErrors = result.error.flatten().fieldErrors.username;
        expect(usernameErrors).toBeDefined();
        expect(usernameErrors![0]).toMatch(/at least 3 characters/i);
      }
    });

    it('rejects a username longer than 20 characters', () => {
      const result = registerSchema.safeParse({
        ...validPayload,
        username: 'a'.repeat(21),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const usernameErrors = result.error.flatten().fieldErrors.username;
        expect(usernameErrors).toBeDefined();
        expect(usernameErrors![0]).toMatch(/less than 20 characters/i);
      }
    });

    it('rejects a username with invalid characters', () => {
      const result = registerSchema.safeParse({ ...validPayload, username: 'alice!' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.username).toBeDefined();
      }
    });

    it('accepts usernames with hyphens and underscores', () => {
      const result = registerSchema.safeParse({ ...validPayload, username: 'alice_oc-1' });
      expect(result.success).toBe(true);
    });
  });

  describe('password confirmation', () => {
    it('rejects mismatched passwords', () => {
      const result = registerSchema.safeParse({
        ...validPayload,
        confirmPassword: 'DifferentP@ss1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmErrors = result.error.flatten().fieldErrors.confirmPassword;
        expect(confirmErrors).toBeDefined();
        expect(confirmErrors![0]).toMatch(/don't match/i);
      }
    });

    it('accepts matching passwords', () => {
      const result = registerSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });
  });
});
