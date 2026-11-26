import { Suspense } from 'react';
import Link from 'next/link';
import { Flag } from 'lucide-react';
import { getRecentActiveCampaigns } from '@/data/campaigns';
import { CampaignCard } from '@/components/campaigns/campaign-card';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionError } from '@/components/ui/section-error';
import { CAMPAIGN_GRID_CLASS, CampaignGridSkeleton } from '@/components/campaigns/campaign-grid-skeleton';

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

      <Suspense fallback={<CampaignGridSkeleton count={3} />}>
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
    <div className={CAMPAIGN_GRID_CLASS}>
      {result.data.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
