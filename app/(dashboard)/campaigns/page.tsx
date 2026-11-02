// app/(dashboard)/board/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Campaign } from '@/types';
import { ForgeCampaignDialogTrigger } from './_components/forge-campaign-dialog-trigger';
// import { ForgeCampaignDialogTrigger } from './_components/forge-campaign-dialog-trigger';

export default async function CampaignsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Trust RLS: Removed .eq('created_by', user.id) so both Solo and Guild campaigns render
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select(
      `
      *,
      quests(*)
    `
    )
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between border-b border-stone-200 pb-5">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1c120c]">Campaign Realm</h1>
          <p className="mt-1 text-sm text-stone-600">Overview of active guild bounties and solo ventures.</p>
        </div>
        <ForgeCampaignDialogTrigger />
      </div>

      {/* Empty State */}
      {!campaigns || campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50/50 p-12 text-center">
          <h3 className="font-serif text-lg font-semibold text-[#1c120c]">No Active Campaigns</h3>
          <p className="mt-1 text-sm text-stone-500">Your realm currently has no active bounties or personal quests.</p>
          <div className="mt-4">
            <ForgeCampaignDialogTrigger />
          </div>
        </div>
      ) : (
        /* Campaign Card Grid */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const totalQuests = campaign.quests?.length ?? 0;
            const completedQuests = campaign.quests?.filter((q: Campaign) => q.status === 'completed').length ?? 0;
            const progressPercentage = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;
            // const totalXp = campaign.quests?.reduce((sum, q) => sum + (q.xp_reward ?? 0), 0) ?? 0;

            return (
              <div
                key={campaign.id}
                className="flex flex-col justify-between rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:shadow-md"
              >
                <div>
                  {/* Top Metadata: Status Pill & Realm Scope */}
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase ${
                        campaign.status === 'active'
                          ? 'bg-amber-100 text-amber-800'
                          : campaign.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {campaign.status}
                    </span>
                    <span className="text-xs font-medium text-stone-500">
                      {campaign.guild_id ? '🛡️ Guild' : '👤 Solo'}
                    </span>
                  </div>

                  {/* Campaign Title & Ultimate Goal */}
                  <h2 className="font-serif text-xl font-bold text-[#1c120c]">{campaign.name}</h2>
                  <p className="mt-2 line-clamp-2 text-sm text-stone-600">
                    {campaign.ultimate_goal || 'No ultimate goal defined.'}
                  </p>
                </div>

                {/* Quests Summary & Completion Metrics */}
                <div className="mt-6 border-t border-stone-100 pt-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-stone-600">
                    <span>
                      Quests ({completedQuests}/{totalQuests})
                    </span>
                    {/* <span className="font-medium text-amber-700">{totalXp} XP</span> */}
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full bg-amber-700 transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>

                  {/* Footer Action */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-stone-400">{progressPercentage}% Complete</span>
                    <Link
                      href={`/board/${campaign.id}`}
                      className="inline-flex items-center rounded-md bg-[#1c120c] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-800"
                    >
                      Open Board &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
