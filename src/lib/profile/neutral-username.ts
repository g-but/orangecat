/**
 * The handle a new account gets before its owner picks one.
 *
 * It must carry no personal information. `/profiles/<username>` is served with
 * no auth and robots.txt has no `/profiles` rule, so whatever goes here is
 * published and crawlable. Deriving it from the email address — as every
 * creation path used to — put 77 people's email local parts on the public web,
 * reconstructable into real addresses with a handful of common domains.
 *
 * MIRRORS the SQL in
 * supabase/migrations/20260826130000_stop_deriving_usernames_from_email.sql.
 * Profiles are created from two independent places — the `handle_new_user`
 * trigger on auth.users, and `ensureProfile()` when a profile is missing — and
 * they must not disagree about what a fresh handle looks like. If you change
 * the shape here, change it there and vice versa; the invariant gate
 * (`count_email_derived_usernames`) catches the email case, not a cosmetic
 * drift between the two.
 */

/** `user_` + 12 hex chars of the id. Unique by construction, says nothing about
 *  the person, and satisfies the app's username pattern (^[a-zA-Z0-9_-]+$). */
export function neutralUsernameFor(userId: string): string {
  return `user_${String(userId).replace(/-/g, '').slice(0, 12)}`;
}
