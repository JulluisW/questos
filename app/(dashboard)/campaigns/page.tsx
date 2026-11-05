import Link from 'next/link';
import { Flag } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { canManageRole, getMyGuilds } from '@/lib/queries';
import { isAIEnabled } from '@/lib/ai/models';
import { cn } from '@/lib/utils';
import { campaignStatusSchema } from '@/lib/validation';
import { CampaignCard } from '@/components/campaigns/campaign-card';
import { ForgeCampaignButton } from '@/components/campaigns/forge-campaign';
import { EmptyState } from '@/components/ui/empty-state';
import type { CampaignStatus } from '@/types';

export const metadata = { title: 'Campaigns' };

const TABS: { status: CampaignStatus; label: string }[] = [
  { status: 'active', label: 'Active' },
  { status: 'completed', label: 'Completed' },
  { status: 'archived', label: 'Archived' },
];

export default async function CampaignsPage({ searchParams }: PageProps<'/campaigns'>) {
  const params = await searchParams;
  const status = campaignStatusSchema.catch('active').parse(params.status);
  const openForge = params.new === 'true';

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user!.id;

  // RLS returns the user's solo campaigns plus every campaign of their guilds.
  const [{ data: campaigns }, guilds] = await Promise.all([
    supabase
      .from('campaigns')
      .select('*, quests(id, status), guilds(id, name)')
      .eq('status', status)
      .order('updated_at', { ascending: false }),
    getMyGuilds(supabase, userId),
  ]);

  const realms = guilds.filter((g) => canManageRole(g.role));
  const aiEnabled = isAIEnabled();

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1c120c]">Campaign Realm</h1>
          <p className="mt-1 text-sm text-stone-600">Your solo ventures and your guilds&apos; campaigns.</p>
        </div>
        <ForgeCampaignButton realms={realms} aiEnabled={aiEnabled} defaultOpen={openForge} />
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

      {!campaigns?.length ? (
        <EmptyState
          icon={<Flag className="h-8 w-8" />}
          title={status === 'active' ? 'No active campaigns' : `No ${status} campaigns`}
          description={
            status === 'active'
              ? 'Forge your first campaign: give it a goal and let the Oracle break it into quests.'
              : 'Campaigns you mark as ' + status + ' will appear here.'
          }
          action={
            status === 'active' ? (
              <ForgeCampaignButton realms={realms} aiEnabled={aiEnabled} label="Forge your first campaign" />
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
