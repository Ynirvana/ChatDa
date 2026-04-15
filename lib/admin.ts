/**
 * Server-side admin check. ADMIN_EMAILS is a comma-separated env var,
 * e.g. "dykim9304@gmail.com,another@example.com". Server-only — never
 * expose this list to the client.
 */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}
