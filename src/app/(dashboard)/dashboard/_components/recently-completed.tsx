import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { getRecentlyCompletedQuests } from '@/data/quests';
import { formatDate } from '@/lib/utils';
import { SectionError } from '@/components/ui/section-error';
import { QuestRowsSkeleton } from './quest-rows-skeleton';

export function RecentlyCompleted() {
  return (
    <section aria-labelledby="recent" className="rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="recent" className="flex items-center gap-2 font-serif text-lg font-semibold text-[#1c120c]">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" /> Recently completed
        </h2>
        <Link href="/records" className="text-xs font-semibold text-amber-800 underline">
          Hall of Records
        </Link>
      </div>

      <Suspense fallback={<QuestRowsSkeleton rows={4} />}>
        <RecentlyCompletedList />
      </Suspense>
    </section>
  );
}

async function RecentlyCompletedList() {
  const result = await getRecentlyCompletedQuests(5);

  if (!result.ok) return <SectionError what="recently completed quests" />;

  if (result.data.length === 0) {
    return <p className="text-sm text-stone-500">Completed quests will be chronicled here.</p>;
  }

  return (
    <ul className="divide-y divide-[#ebe1d3]">
      {result.data.map((quest) => (
        <li key={quest.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm text-stone-600 line-through decoration-stone-400">{quest.title}</p>
            <p className="truncate text-[11px] text-stone-500">{quest.campaigns?.name}</p>
          </div>
          <span className="shrink-0 text-[11px] text-stone-400">{formatDate(quest.completed_at)}</span>
        </li>
      ))}
    </ul>
  );
}
