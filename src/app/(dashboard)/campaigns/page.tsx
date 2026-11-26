import { Suspense } from 'react';
import Link from 'next/link';
import { Flag } from 'lucide-react';
import { getCampaignsByStatus } from '@/data/campaigns';
import { cn } from '@/lib/utils';
import { campaignStatusSchema } from '@/lib/validation';
import { CampaignCard } from '@/components/campaigns/campaign-card';
import { CAMPAIGN_GRID_CLASS, CampaignGridSkeleton } from '@/components/campaigns/campaign-grid-skeleton';
import { ForgeButtonSkeleton, ForgeCampaignLoader } from '@/components/campaigns/forge-campaign-loader';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionError } from '@/components/ui/section-error';
import type { CampaignStatus } from '@/types';

export const metadata = { title: 'Campaigns' };

const TABS: { status: CampaignStatus; label: string }[] = [
  { status: 'active', label: 'Active' },
  { status: 'completed', label: 'Completed' },
  { status: 'archived', label: 'Archived' },
];

// The page itself fetches nothing: the heading and tabs render at once, and
// the Forge button and the grid each stream in from their own <Suspense>.
export default async function CampaignsPage({ searchParams }: PageProps<'/campaigns'>) {
  const params = await searchParams;
  const status = campaignStatusSchema.catch('active').parse(params.status);
  const openForge = params.new === 'true';

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1c120c]">Campaign Realm</h1>
          <p className="mt-1 text-sm text-stone-600">Your solo ventures and your guilds&apos; campaigns.</p>
        </div>
        <Suspense fallback={<ForgeButtonSkeleton />}>
          <ForgeCampaignLoader defaultOpen={openForge} />
        </Suspense>
      </div>

      <nav aria-label="Campaign status" className="mb-6 flex gap-1">
        {TABS.map((tab) => (
          <Link
            key={tab.status}
            href={tab.status === 'active' ? '/campaigns' : `/campaigns?status=${tab.status}`}
            aria-current={tab.status === status ? 'page' : undefined}
            className={cn(
              'rounded px-3 py-1.5 text-xs font-semibold transition-colors',
              tab.status === status ? 'bg-[#3d271d] text-[#fbf8f3]' : 'text-stone-600 hover:bg-[#f2ebdf]'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {/* 📌 READ-ME: `key={status}` gives each tab its own boundary. Switching
          tabs mounts a new one, so the skeleton shows instead of the old tab's
          cards lingering until the new list arrives. */}
      <Suspense key={status} fallback={<CampaignGridSkeleton count={3} />}>
        <CampaignGrid status={status} />
      </Suspense>
    </div>
  );
}

async function CampaignGrid({ status }: { status: CampaignStatus }) {
  const result = await getCampaignsByStatus(status);

  if (!result.ok) return <SectionError what="your campaigns" />;

  if (result.data.length === 0) {
    return (
      <EmptyState
        icon={<Flag className="h-8 w-8" />}
        title={status === 'active' ? 'No active campaigns' : `No ${status} campaigns`}
        description={
          status === 'active'
            ? 'Forge your first campaign: give it a goal and let the Oracle break it into quests.'
            : 'Campaigns you mark as ' + status + ' will appear here.'
        }
        action={status === 'active' ? <ForgeCampaignLoader label="Forge your first campaign" /> : undefined}
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
