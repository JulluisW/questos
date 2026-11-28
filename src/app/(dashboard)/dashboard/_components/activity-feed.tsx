import { Suspense } from 'react';
import Link from 'next/link';
import { Activity, CheckCircle2, Copy, Flag, UserPlus } from 'lucide-react';
import { getActivityFeed } from '@/data/activity';
import { formatDate } from '@/lib/utils';
import { SectionError } from '@/components/ui/section-error';
import type { ActivityItem } from '@/types';
import { QuestRowsSkeleton } from './quest-rows-skeleton';

export function ActivityFeed() {
  return (
    <section aria-labelledby="activity" className="rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] p-5 shadow-sm">
      <h2 id="activity" className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold text-[#1c120c]">
        <Activity className="h-4 w-4 text-amber-800" /> Recent activity
      </h2>
      <Suspense fallback={<QuestRowsSkeleton rows={5} />}>
        <ActivityList />
      </Suspense>
    </section>
  );
}

async function ActivityList() {
  const result = await getActivityFeed(15);
  if (!result.ok) return <SectionError what="recent activity" />;
  if (result.data.length === 0) {
    return <p className="text-sm text-stone-500">Nothing has happened yet. Complete a quest or forge a campaign.</p>;
  }

  return (
    <ul className="divide-y divide-[#ebe1d3]">
      {result.data.map((item) => (
        <li key={item.key} className="flex items-center justify-between gap-3 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <ActivityIcon kind={item.kind} />
            <p className="min-w-0 truncate text-sm text-stone-700">
              <ActivityText item={item} />
            </p>
          </div>
          <span className="shrink-0 text-[11px] text-stone-400">{formatDate(item.at)}</span>
        </li>
      ))}
    </ul>
  );
}

const link = 'font-semibold text-amber-800 hover:underline';
const who = (actor: string | null) => (actor ? `@${actor}` : 'Someone');

function ActivityText({ item }: { item: ActivityItem }) {
  switch (item.kind) {
    case 'quest_completed':
      return (
        <>
          <span className="font-medium">{item.questTitle}</span> completed in{' '}
          <Link href={`/board/${item.campaignId}`} className={link}>
            {item.campaignName}
          </Link>
        </>
      );
    case 'campaign_created':
      return (
        <>
          {who(item.actor)} forged{' '}
          <Link href={`/board/${item.campaignId}`} className={link}>
            {item.campaignName}
          </Link>
        </>
      );
    case 'template_adopted':
      return (
        <>
          {who(item.actor)} started{' '}
          <Link href={`/board/${item.campaignId}`} className={link}>
            {item.campaignName}
          </Link>{' '}
          from a template
        </>
      );
    case 'member_joined':
      return (
        <>
          {who(item.actor)} joined{' '}
          <Link href="/team" className={link}>
            {item.guildName}
          </Link>
        </>
      );
    case 'my_template_adopted':
      return (
        <>
          {who(item.actor)} adopted your template{' '}
          <Link href={`/board/${item.templateId}`} className={link}>
            {item.templateName}
          </Link>
        </>
      );
  }
}

const ICONS: Record<ActivityItem['kind'], React.ReactNode> = {
  quest_completed: <CheckCircle2 className="h-4 w-4 text-emerald-700" />,
  campaign_created: <Flag className="h-4 w-4 text-amber-800" />,
  template_adopted: <Copy className="h-4 w-4 text-amber-800" />,
  member_joined: <UserPlus className="h-4 w-4 text-blue-800" />,
  my_template_adopted: <Copy className="h-4 w-4 text-amber-800" />,
};

function ActivityIcon({ kind }: { kind: ActivityItem['kind'] }) {
  return (
    <span aria-hidden className="shrink-0">
      {ICONS[kind]}
    </span>
  );
}
