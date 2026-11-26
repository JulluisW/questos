export const CAMPAIGN_GRID_CLASS = 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3';

// 📌 READ-ME: 260px is an estimate of a CampaignCard with a one-line title
// and a two-line goal. Measure a real card in DevTools (like you did for the
// stat cards) and adjust, so the page doesn't jump when the cards arrive.
export function CampaignGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div aria-hidden className={CAMPAIGN_GRID_CLASS}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-[260px] animate-pulse rounded-lg border border-[#e2d5c3] bg-[#f5f0e6]" />
      ))}
    </div>
  );
}
