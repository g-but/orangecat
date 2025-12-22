let triggered = false;

export async function ensureMessagingMigrations() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  if (triggered) {
    return;
  }
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  try {
    await fetch(`${base.replace(/\/$/, '')}/api/admin/apply-messaging-migrations`, {
      method: 'POST',
      // Internal call; no credentials required for this dev-only endpoint
    });
    triggered = true;
  } catch {
    // swallow; client DevBootstrap will retry
  }
}
