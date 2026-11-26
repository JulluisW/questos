import { cn } from '@/lib/utils';
import { RetryButton } from '@/components/ui/retry-button';

/**
 * Shown in place of a section whose data failed to load.
 * Server Component; only the button inside it runs in the browser.
 */
export function SectionError({ what, className }: { what: string; className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-900',
        className
      )}
    >
      <span>Couldn&apos;t load {what}.</span>
      <RetryButton what={what} />
    </div>
  );
}
