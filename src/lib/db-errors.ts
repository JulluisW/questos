type PgError = { code?: string; message?: string } | null | undefined;

// Messages raised by our own triggers/RPCs are already written for humans.
const FRIENDLY_PATTERNS = [
  /boss or a manager/i,
  /claim or release/i,
  /member of the guild/i,
  /campaign owner/i,
  /invite link is invalid/i,
  /must be between \d+ and \d+ characters/i,
];

/** Maps a PostgREST/Postgres error to something safe to show a user. */
export function dbErrorMessage(error: PgError, permissionMessage: string, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  const message = error.message ?? '';

  if (FRIENDLY_PATTERNS.some((p) => p.test(message))) return message;
  if (error.code === '42501' || /row-level security|permission denied/i.test(message)) return permissionMessage;
  if (error.code === '23514') return 'Some of the values are outside the allowed limits.';
  if (error.code === '22P02') return 'That record could not be found.';
  return fallback;
}
