import { Suspense } from 'react';
import Link from 'next/link';
import { Award, Trophy } from 'lucide-react';
import { getRecentlyCompletedQuests } from '@/data/quests';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionError } from '@/components/ui/section-error';

export const metadata = { title: 'Hall of Records' };

// The title renders at once; the totals line and the list stream in together.
export default function RecordsPage() {
  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <Suspense fallback={<RecordsSkeleton />}>
        <RecordsList />
      </Suspense>
    </div>
  );
}

function RecordsHeader({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mb-6 border-b border-stone-200 pb-5 text-center">
      <p className="font-serif text-xs font-semibold tracking-widest text-amber-800 uppercase">The Valhalla</p>
      <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1c120c]">Hall of Records</h1>
      {children}
    </div>
  );
}

async function RecordsList() {
  const result = await getRecentlyCompletedQuests(100);

  if (!result.ok) {
    return (
      <>
        <RecordsHeader />
        <SectionError what="your records" />
      </>
    );
  }

  const quests = result.data;
  const milestones = quests.filter((q) => q.is_milestone).length;

  return (
    <>
      <RecordsHeader>
        <p className="mt-1 text-sm text-stone-600">
          {quests.length} quests completed · {milestones} milestones conquered
        </p>
      </RecordsHeader>

      {!quests.length ? (
        <EmptyState
          icon={<Trophy className="h-8 w-8" />}
          title="No legends yet"
          description="Every quest you complete is chronicled here."
        />
      ) : (
        <ol className="divide-y divide-[#ebe1d3] rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] px-5 shadow-sm">
          {quests.map((q) => (
            <li key={q.id} className="flex items-center justify-between gap-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                {q.is_milestone ? (
                  <Award className="h-4 w-4 shrink-0 text-amber-700" aria-label="Milestone" />
                ) : (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-800" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#1c120c]">{q.title}</p>
                  {q.campaigns && (
                    <Link
                      href={`/board/${q.campaigns.id}`}
                      className="truncate text-[11px] text-amber-800 hover:underline"
                    >
                      {q.campaigns.name}
                    </Link>
                  )}
                </div>
              </div>
              <time
                dateTime={q.completed_at ?? undefined}
                className="shrink-0 font-serif text-xs text-stone-500 italic"
              >
                {formatDate(q.completed_at)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

/** The title stays put while the totals line and five list rows load. */
function RecordsSkeleton() {
  return (
    <>
      <RecordsHeader>
        <div aria-hidden className="mx-auto mt-2 h-4 w-56 animate-pulse rounded bg-[#ebe1d3]" />
      </RecordsHeader>
      <ol
        aria-hidden
        className="divide-y divide-[#ebe1d3] rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] px-5 shadow-sm"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ebe1d3]" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-52 animate-pulse rounded bg-[#ebe1d3]" />
                <div className="h-2.5 w-28 animate-pulse rounded bg-[#ebe1d3]" />
              </div>
            </div>
            <div className="h-3 w-20 animate-pulse rounded bg-[#ebe1d3]" />
          </li>
        ))}
      </ol>
    </>
  );
}
