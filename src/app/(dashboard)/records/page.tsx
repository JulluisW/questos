import { Suspense } from 'react';
import Link from 'next/link';
import { Award, Trophy } from 'lucide-react';
import { getCompletedQuestsPage } from '@/data/quests';
import { formatDate } from '@/lib/utils';
import { pageSchema } from '@/lib/validation';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionError } from '@/components/ui/section-error';

export const metadata = { title: 'Hall of Records' };

// The title renders at once; the totals line and the list stream in together.
export default async function RecordsPage({ searchParams }: PageProps<'/records'>) {
  const page = pageSchema.parse((await searchParams).page);

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      {/* 📌 READ-ME: `key={page}` mounts a new boundary per page, so the
          skeleton shows instead of the old page lingering until the new one
          arrives (the same trick as the Campaigns tabs). */}
      <Suspense key={page} fallback={<RecordsSkeleton />}>
        <RecordsList page={page} />
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

async function RecordsList({ page }: { page: number }) {
  const result = await getCompletedQuestsPage(page);

  if (!result.ok) {
    return (
      <>
        <RecordsHeader />
        <SectionError what="your records" />
      </>
    );
  }

  const { quests, total, milestones, pageSize } = result.data;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <RecordsHeader>
        <p className="mt-1 text-sm text-stone-600">
          {total} quests completed · {milestones} milestones conquered
        </p>
        <p className="mt-0.5 text-xs text-stone-500">Across your solo campaigns and your guilds.</p>
      </RecordsHeader>

      {total === 0 ? (
        <EmptyState
          icon={<Trophy className="h-8 w-8" />}
          title="No legends yet"
          description="Every quest you complete is chronicled here."
        />
      ) : quests.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-8 w-8" />}
          title="No records on this page"
          action={
            <Link href="/records" className="text-sm font-semibold text-amber-800 hover:underline">
              Back to the latest records
            </Link>
          }
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

      {pageCount > 1 && quests.length > 0 && <RecordsPager page={page} pageCount={pageCount} />}
    </>
  );
}

const pageHref = (page: number) => (page <= 1 ? '/records' : `/records?page=${page}`);

function RecordsPager({ page, pageCount }: { page: number; pageCount: number }) {
  const link = 'rounded px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-[#f2ebdf]';
  const disabled = 'rounded px-3 py-1.5 text-xs font-semibold text-stone-300';

  return (
    <nav aria-label="Records pages" className="mt-4 flex items-center justify-between">
      {page > 1 ? (
        <Link href={pageHref(page - 1)} className={link}>
          Newer
        </Link>
      ) : (
        <span aria-disabled="true" className={disabled}>
          Newer
        </span>
      )}
      <span className="text-xs text-stone-500">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={pageHref(page + 1)} className={link}>
          Older
        </Link>
      ) : (
        <span aria-disabled="true" className={disabled}>
          Older
        </span>
      )}
    </nav>
  );
}

/** The title stays put while the totals line and five list rows load. */
function RecordsSkeleton() {
  return (
    <>
      <RecordsHeader>
        <div aria-hidden className="mx-auto mt-2 h-4 w-56 animate-pulse rounded bg-[#ebe1d3]" />
        <div aria-hidden className="mx-auto mt-1.5 h-3 w-44 animate-pulse rounded bg-[#ebe1d3]" />
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
