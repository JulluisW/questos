import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "King Arthur" -> "KA", "merlin_wizard" -> "ME" */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/[\s_.-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

export function displayName(profile: { full_name?: string | null; username?: string | null } | null | undefined) {
  return profile?.full_name?.trim() || profile?.username || 'Unknown adventurer';
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  return dateFormatter.format(new Date(value));
}

/** Only allow same-origin relative redirects (blocks //evil.com and https://...). */
export function safeNextPath(next: unknown, fallback = '/dashboard'): string {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
    return fallback;
  }
  return next;
}

/** ISO timestamp for `days` ago (used for "this week" style queries). */
export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
