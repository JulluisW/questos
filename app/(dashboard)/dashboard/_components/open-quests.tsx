import { Suspense } from 'react';
import Link from 'next/link';
import { Award, ScrollText } from 'lucide-react';
import { requireUser } from '@/data/auth';
import { getOpenQuestsFor } from '@/data/quests';
import { COLUMN_LABELS, PRIORITY_STYLES } from '@/lib/quests/constants';
import { cn } from '@/lib/utils';
import { SectionError } from '@/components/ui/section-error';
import { QuestRowsSkeleton } from './quest-rows-skeleton';

export function OpenQuests() {
  return (
    <section aria-labelledby="open-quests" className="rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] p-5 shadow-sm">
      <h2 id="open-quests" className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold text-[#1c120c]">
        <ScrollText className="h-4 w-4 text-amber-800" /> Your open quests
      </h2>

      <Suspense fallback={<QuestRowsSkeleton rows={4} />}>
        <OpenQuestsList />
      </Suspense>
    </section>
  );
}

async function OpenQuestsList() {
  const user = await requireUser();
  const result = await getOpenQuestsFor(user.id, 8);

  if (!result.ok) return <SectionError what="your open quests" />;

  if (result.data.length === 0) {
    return <p className="text-sm text-stone-500">No open quests. Enjoy the calm, or forge something new.</p>;
  }

  return (
    <ul className="divide-y divide-[#ebe1d3]">
      {result.data.map((quest) => (
        <li key={quest.id}>
          <Link
            href={`/board/${quest.campaigns.id}`}
            className="-mx-2 flex items-center justify-between gap-3 rounded px-2 py-2.5 hover:bg-[#f2ebdf]"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-sm font-medium text-[#1c120c]">
                {quest.is_milestone && (
                  <Award className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-label="Milestone" />
                )}
                {quest.title}
              </p>
              <p className="truncate text-[11px] text-stone-500">{quest.campaigns.name}</p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <span
                className={cn(
                  'rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase',
                  PRIORITY_STYLES[quest.priority ?? 'low']
                )}
              >
                {quest.priority}
              </span>
              <span className="rounded bg-[#ebdcca] px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-stone-700 uppercase">
                {COLUMN_LABELS[quest.status ?? 'pending']}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
