import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Shield, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getBoardMembers } from '@/lib/queries';
import { isAIEnabled } from '@/lib/ai/models';
import { idSchema } from '@/lib/validation';
import { CAMPAIGN_STATUS_STYLES } from '@/lib/quests/constants';
import { cn, percent } from '@/lib/utils';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Notice } from '@/components/ui/notice';
import { QuestBoard } from '../_components/quest-board';
import { CampaignActions } from '../_components/campaign-actions';

export async function generateMetadata({ params }: PageProps<'/board/[campaignId]'>) {
  const { campaignId } = await params;
  if (!idSchema.safeParse(campaignId).success) return { title: 'Quest Board' };
  const supabase = await createClient();
  const { data } = await supabase.from('campaigns').select('name').eq('id', campaignId).maybeSingle();
  return { title: data?.name ?? 'Quest Board' };
}

function oracleBanner(value: string | string[] | undefined) {
  if (typeof value !== 'string') return null;
  if (value === 'failed') {
    return {
      tone: 'error' as const,
      text: 'Your campaign was forged, but the Oracle could not answer. Use "Ask the Oracle" to try again.',
    };
  }
  const count = Number(value);
  return Number.isInteger(count) && count > 0
    ? { tone: 'success' as const, text: `Campaign forged. The Oracle revealed ${count} quests to get you started.` }
    : null;
}

export default async function QuestBoardPage({ params, searchParams }: PageProps<'/board/[campaignId]'>) {
  const { campaignId } = await params;
  const { oracle } = await searchParams;
  if (!idSchema.safeParse(campaignId).success) notFound();

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user!.id;

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*, guilds(id, name), quests(*)')
    .eq('id', campaignId)
    .order('created_at', { referencedTable: 'quests', ascending: true })
    .maybeSingle();

  if (!campaign) notFound();

  const [{ data: canManage }, members, { data: role }] = await Promise.all([
    supabase.rpc('can_manage_campaign', { p_campaign_id: campaign.id }),
    getBoardMembers(supabase, campaign),
    campaign.guild_id
      ? supabase.rpc('get_my_guild_role', { p_guild_id: campaign.guild_id })
      : Promise.resolve({ data: null }),
  ]);

  const status = campaign.status ?? 'active';
  const total = campaign.quests.length;
  const completed = campaign.quests.filter((q) => q.status === 'completed').length;
  const progress = percent(completed, total);
  const canDelete = campaign.guild_id ? role === 'boss' : campaign.created_by === userId;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold tracking-wider uppercase">
            <Link href="/campaigns" className="text-stone-500 hover:text-stone-800">
              Campaigns
            </Link>
            <span className="text-stone-300">/</span>
            <span className={cn('rounded-full px-2 py-0.5', CAMPAIGN_STATUS_STYLES[status])}>{status}</span>
            <span className="inline-flex items-center gap-1 text-stone-500">
              {campaign.guilds ? (
                <>
                  <Shield className="h-3 w-3" /> {campaign.guilds.name}
                </>
              ) : (
                <>
                  <User className="h-3 w-3" /> Solo
                </>
              )}
            </span>
          </div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[#1c120c] md:text-4xl">{campaign.name}</h1>
          {campaign.ultimate_goal && <p className="mt-1.5 max-w-2xl text-sm text-stone-600">{campaign.ultimate_goal}</p>}
          <div className="mt-3 flex max-w-md items-center gap-3">
            <ProgressBar value={progress} label={`${completed} of ${total} quests complete`} className="h-2.5 shadow-inner" />
            <span className="shrink-0 text-xs text-stone-500">
              {completed}/{total} · {progress}%
            </span>
          </div>
        </div>

        {canManage && (
          <CampaignActions campaignId={campaign.id} campaignName={campaign.name} status={status} canDelete={canDelete} />
        )}
      </header>

      {status !== 'active' && (
        <Notice tone="info">
          This campaign is {status}. Its board stays editable, but it is hidden from the dashboard and active lists.
        </Notice>
      )}

      <QuestBoard
        campaignId={campaign.id}
        campaignGoal={campaign.ultimate_goal}
        initialQuests={campaign.quests}
        members={members}
        currentUserId={userId}
        canManage={Boolean(canManage)}
        isGuild={Boolean(campaign.guild_id)}
        aiEnabled={isAIEnabled()}
        initialBanner={oracleBanner(oracle)}
      />
    </div>
  );
}
