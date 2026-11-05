import Link from 'next/link';
import { Award, CheckCircle2, Flag, Hammer, ScrollText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { canManageRole, getCurrentProfile, getMyGuilds } from '@/lib/queries';
import { isAIEnabled } from '@/lib/ai/models';
import { cn, daysAgoIso, formatDate } from '@/lib/utils';
import { COLUMN_LABELS, PRIORITY_STYLES } from '@/lib/quests/constants';
import { CampaignCard } from '@/components/campaigns/campaign-card';
import { ForgeCampaignButton } from '@/components/campaigns/forge-campaign';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata = { title: 'Command Center' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const profile = (await getCurrentProfile(supabase))!;
  const weekAgo = daysAgoIso(7);

  const [campaignsRes, openRes, recentRes, activeCount, openCount, weekCount, guilds] = await Promise.all([
    supabase
      .from('campaigns')
      .select('*, quests(id, status), guilds(id, name)')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(3),
    supabase
      .from('quests')
      .select('id, title, status, priority, is_milestone, campaigns!inner(id, name, status)')
      .in('status', ['in-progress', 'pending'])
      .or(`assignee_id.eq.${profile.id},assignee_id.is.null`)
      .eq('campaigns.status', 'active')
      .order('status', { ascending: false }) // enum order is pending < in-progress, so desc = in-progress first
      .order('created_at', { ascending: true })
      .limit(8),
    supabase
      .from('quests')
      .select('id, title, completed_at, is_milestone, campaigns(id, name)')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(5),
    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase
      .from('quests')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'completed')
      .or(`assignee_id.eq.${profile.id},assignee_id.is.null`),
    supabase
      .from('quests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', weekAgo),
    getMyGuilds(supabase, profile.id),
  ]);

  const campaigns = campaignsRes.data ?? [];
  const openQuests = openRes.data ?? [];
  const recent = recentRes.data ?? [];
  const realms = guilds.filter((g) => canManageRole(g.role));
  const firstName = (profile.full_name || profile.username).split(' ')[0];

  const stats = [
    { label: 'Active campaigns', value: activeCount.count ?? 0, icon: Flag },
    { label: 'Open quests for you', value: openCount.count ?? 0, icon: Hammer },
    { label: 'Completed this week', value: weekCount.count ?? 0, icon: CheckCircle2 },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-serif text-xs font-semibold tracking-widest text-amber-800 uppercase">Command Center</p>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1c120c]">Welcome back, {firstName}</h1>
        </div>
        <ForgeCampaignButton realms={realms} aiEnabled={isAIEnabled()} />
      </div>

      <section aria-label="Statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-4 rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded border border-amber-800/30 bg-[#170e0a] text-amber-500">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-2xl leading-none font-bold text-[#1c120c]">{value}</p>
              <p className="mt-1 text-[11px] tracking-wide text-stone-500 uppercase">{label}</p>
            </div>
          </div>
        ))}
      </section>

      <section aria-labelledby="active-campaigns">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="active-campaigns" className="font-serif text-xl font-semibold text-[#1c120c]">
            Active campaigns
          </h2>
          <Link href="/campaigns" className="text-xs font-semibold text-amber-800 underline">
            View all
          </Link>
        </div>
        {campaigns.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Flag className="h-8 w-8" />}
            title="Your realm is quiet"
            description="Forge a campaign and the Oracle will help you break it into quests."
          />
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section aria-labelledby="open-quests" className="rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] p-5 shadow-sm">
          <h2 id="open-quests" className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold text-[#1c120c]">
            <ScrollText className="h-4 w-4 text-amber-800" /> Your open quests
          </h2>
          {openQuests.length ? (
            <ul className="divide-y divide-[#ebe1d3]">
              {openQuests.map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/board/${q.campaigns.id}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded px-2 py-2.5 hover:bg-[#f2ebdf]"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium text-[#1c120c]">
                        {q.is_milestone && <Award className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-label="Milestone" />}
                        {q.title}
                      </p>
                      <p className="truncate text-[11px] text-stone-500">{q.campaigns.name}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={cn(
                          'rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase',
                          PRIORITY_STYLES[q.priority ?? 'low']
                        )}
                      >
                        {q.priority}
                      </span>
                      <span className="rounded bg-[#ebdcca] px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-stone-700 uppercase">
                        {COLUMN_LABELS[q.status ?? 'pending']}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-500">No open quests. Enjoy the calm, or forge something new.</p>
          )}
        </section>

        <section aria-labelledby="recent" className="rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="recent" className="flex items-center gap-2 font-serif text-lg font-semibold text-[#1c120c]">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" /> Recently completed
            </h2>
            <Link href="/records" className="text-xs font-semibold text-amber-800 underline">
              Hall of Records
            </Link>
          </div>
          {recent.length ? (
            <ul className="divide-y divide-[#ebe1d3]">
              {recent.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-stone-600 line-through decoration-stone-400">{q.title}</p>
                    <p className="truncate text-[11px] text-stone-500">{q.campaigns?.name}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-stone-400">{formatDate(q.completed_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-500">Completed quests will be chronicled here.</p>
          )}
        </section>
      </div>
    </div>
  );
}
