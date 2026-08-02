-- Cat custom instructions — the user's standing instructions for their Cat.
--
-- One nullable TEXT column on user_ai_preferences (the existing per-user AI
-- settings row). Injected into the Cat system prompt as a clearly-delimited
-- "standing instructions" section; they steer tone/language/economic behavior
-- but can never override the Critical Rules, confirmation requirements, or
-- spend permissions (enforced in prompt wording, src/services/cat/system-prompt.ts).
--
-- The 2000-char ceiling mirrors MAX_CUSTOM_INSTRUCTIONS_LENGTH in
-- src/services/cat/custom-instructions.ts (the app-side SSOT); the DB CHECK is
-- the backstop for direct writes since the column is client-writable via RLS.

ALTER TABLE public.user_ai_preferences
  ADD COLUMN IF NOT EXISTS custom_instructions TEXT;

ALTER TABLE public.user_ai_preferences
  ADD CONSTRAINT user_ai_preferences_custom_instructions_len
  CHECK (custom_instructions IS NULL OR char_length(custom_instructions) <= 2000);

COMMENT ON COLUMN public.user_ai_preferences.custom_instructions IS
  'User-authored standing instructions for their Cat (preferences for tone, language, economic behavior). Injected into the system prompt; never overrides safety/confirmation/spend rules.';
