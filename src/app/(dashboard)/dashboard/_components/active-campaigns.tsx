import { Suspense } from 'react';
import Link from 'next/link';
import { Flag } from 'lucide-react';
import { getRecentActiveCampaigns } from '@/data/campaigns';
import { CampaignCard } from '@/components/campaigns/campaign-card';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionError } from '@/components/ui/section-error';

const gridClass = 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3';

export function ActiveCampaigns() {
  return (
    <section aria-labelledby="active-campaigns">
      {/* The heading has no data, so it stays outside <Suspense> and is part
          of the static shell: it shows instantly. */}
      <div className="mb-3 flex items-center justify-between">
        <h2 id="active-campaigns" className="font-serif text-xl font-semibold text-[#1c120c]">
          Active campaigns
        </h2>
        <Link href="/campaigns" className="text-xs font-semibold text-amber-800 underline">
          View all
        </Link>
      </div>

      <Suspense fallback={<ActiveCampaignsSkeleton />}>
        <ActiveCampaignsList />
      </Suspense>
    </section>
  );
}

async function ActiveCampaignsList() {
  const result = await getRecentActiveCampaigns(3);

  if (!result.ok) return <SectionError what="your active campaigns" />;

  if (result.data.length === 0) {
    return (
      <EmptyState
        icon={<Flag className="h-8 w-8" />}
        title="Your realm is quiet"
        description="Forge a campaign and the Oracle will help you break it into quests."
      />
    );
  }

  return (
    <div className={gridClass}>
      {result.data.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}

// 📌 READ-ME: 260px is an estimate of a CampaignCard with a one-line title
// and a two-line goal. Measure a real card in DevTools (like you did for the
// stat cards) and adjust, so the page doesn't jump when the cards arrive.
function ActiveCampaignsSkeleton() {
  return (
    <div aria-hidden className={gridClass}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-[260px] animate-pulse rounded-lg border border-[#e2d5c3] bg-[#f5f0e6]" />
      ))}
    </div>
  );
}
