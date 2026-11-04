const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Compact, human duration: "35m", "5h 20m", "3d 4h". */
export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return '—';
  if (ms < MINUTE) return '<1m';
  if (ms < HOUR) return `${Math.round(ms / MINUTE)}m`;
  if (ms < DAY) {
    const h = Math.floor(ms / HOUR);
    const m = Math.round((ms % HOUR) / MINUTE);
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(ms / DAY);
  const h = Math.round((ms % DAY) / HOUR);
  return h ? `${d}d ${h}h` : `${d}d`;
}

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const monthFormat = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' });

export const formatDateTime = (t: number) => dateTimeFormat.format(t);
export const formatDay = (t: number) => dayFormat.format(t);
export const formatMonth = (t: number) => monthFormat.format(t);

/** "3 days ago" style relative label for recency hints. */
export function formatAgo(ms: number): string {
  return ms < MINUTE ? 'just now' : `${formatDuration(ms)} ago`;
}
