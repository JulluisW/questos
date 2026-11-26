/**
 * Shared fallback for every dashboard page while it loads.
 * Only a heading bar: pages with their own section skeletons (the Command
 * Center) replace it almost at once, and pages without them (Records, Team,
 * Campaigns) don't flash a card grid that doesn't match their layout.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6" aria-busy="true" aria-label="Loading">
      <div className="h-3 w-32 animate-pulse rounded bg-[#e6dcce]" />
      <div className="mt-3 h-8 w-64 animate-pulse rounded bg-[#e6dcce]" />
    </div>
  );
}
