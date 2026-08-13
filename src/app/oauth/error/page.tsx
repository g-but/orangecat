/**
 * OAuth error page — shown when we can't safely redirect back to a client
 * (unknown client or unregistered redirect_uri). Never echoes attacker-supplied
 * URLs; just explains nothing was shared.
 */
export default async function OAuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message =
    reason === 'invalid_client_or_redirect'
      ? "The application is unknown, disabled, or its return URL isn't registered."
      : reason === 'anonymous_account'
        ? 'Anonymous accounts can’t sign in to other apps. Add an email address to your account (Settings → Account) and try again.'
        : 'The sign-in request was invalid.';

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12 text-center">
      <h1 className="text-xl font-semibold text-fg-primary">Sign-in couldn&apos;t continue</h1>
      <p className="mt-3 text-sm text-fg-secondary">
        {message} Nothing was shared from your account.
      </p>
    </div>
  );
}
