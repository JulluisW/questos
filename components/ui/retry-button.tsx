'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type RetryButtonProps = {
  /** What failed, for screen readers: "Retry loading {what}". */
  what: string;
  /** Icon only, for tight spaces like a stat card. */
  iconOnly?: boolean;
};

export function RetryButton({ what, iconOnly = false }: RetryButtonProps) {
  const router = useRouter();
  const [isRetrying, startTransition] = useTransition();

  // 📌 READ-ME: router.refresh() asks the server to render this page again
  // and merges the result into the screen. Only the failed parts show this
  // button, but the refresh re-runs EVERY section's fetch on the server.
  // Sections that already loaded keep showing their content while that
  // happens (it's a transition), so the user only sees the failed part change.
  const retry = () => startTransition(() => router.refresh());

  return (
    <button
      type="button"
      onClick={retry}
      disabled={isRetrying}
      aria-label={`Retry loading ${what}`}
      title="Try again"
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-60',
        iconOnly ? 'p-1.5' : 'px-2 py-1'
      )}
    >
      <RotateCw aria-hidden className={cn('h-3.5 w-3.5', isRetrying && 'animate-spin')} />
      {!iconOnly && (isRetrying ? 'Retrying…' : 'Try again')}
    </button>
  );
}
