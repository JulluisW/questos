import Link from 'next/link';
import { Award, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata = { title: 'Hall of Records' };

export default async function RecordsPage() {
  const supabase = await createClient();

  const { data: quests } = await supabase
    .from('quests')
    .select('id, title, completed_at, is_milestone, campaigns(id, name)')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(100);

  const milestones = quests?.filter((q) => q.is_milestone).length ?? 0;

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="mb-6 border-b border-stone-200 pb-5 text-center">
        <p className="font-serif text-xs font-semibold tracking-widest text-amber-800 uppercase">The Valhalla</p>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1c120c]">Hall of Records</h1>
        <p className="mt-1 text-sm text-stone-600">
          {quests?.length ?? 0} quests completed · {milestones} milestones conquered
        </p>
      </div>

      {!quests?.length ? (
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
                    <Link href={`/board/${q.campaigns.id}`} className="truncate text-[11px] text-amber-800 hover:underline">
                      {q.campaigns.name}
                    </Link>
                  )}
                </div>
              </div>
              <time dateTime={q.completed_at ?? undefined} className="shrink-0 font-serif text-xs text-stone-500 italic">
                {formatDate(q.completed_at)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
