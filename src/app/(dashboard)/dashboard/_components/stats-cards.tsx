import { Suspense } from 'react';
import { CheckCircle2, Flag, Hammer, type LucideIcon } from 'lucide-react';
import { requireUser } from '@/data/auth';
import { countActiveCampaigns } from '@/data/campaigns';
import { countCompletedThisWeek, countOpenQuestsFor } from '@/data/quests';
import type { Result } from '@/data/result';
import { RetryButton } from '@/components/ui/retry-button';

type Stat = {
  label: string;
  icon: LucideIcon;
  /** A function, not a value: each card starts its own fetch inside its own boundary. */
  load: () => Promise<Result<number>>;
};

const STATS: Stat[] = [
  { label: 'Active campaigns', icon: Flag, load: countActiveCampaigns },
  { label: 'Open quests for you', icon: Hammer, load: async () => countOpenQuestsFor((await requireUser()).id) },
  { label: 'Completed this week', icon: CheckCircle2, load: countCompletedThisWeek },
];

export function StatsCards() {
  return (
    <section aria-label="Statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* 📌 READ-ME: one <Suspense> per card, so each card shows its skeleton
          until ITS number arrives. The waiting (await) happens inside
          <StatCard>, which is inside the boundary. If the await were up here
          in <StatsCards>, the fallbacks would never show (the Day 4 rule:
          Suspense must wrap the component that awaits). */}
      {STATS.map((stat) => (
        <Suspense key={stat.label} fallback={<StatCardSkeleton />}>
          <StatCard {...stat} />
        </Suspense>
      ))}
    </section>
  );
}

async function StatCard({ label, icon: Icon, load }: Stat) {
  const result = await load();

  return (
    <div className="flex items-center gap-4 rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-amber-800/30 bg-[#170e0a] text-amber-500">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-2xl leading-none font-bold text-[#1c120c]">{result.ok ? result.data : '—'}</p>
        <p className="mt-1 text-[11px] tracking-wide text-stone-500 uppercase">{label}</p>
      </div>

      {/* A failed card keeps its normal shape (icon, "—", label) and only adds
          a retry icon, so the row of cards stays the same height. */}
      {!result.ok && <RetryButton what={label.toLowerCase()} iconOnly />}
    </div>
  );
}

/** 78.5px is the card's measured height: 16px padding + 44.5px text block + 16px padding + 2px border. */
function StatCardSkeleton() {
  return (
    <div
      aria-hidden
      className="h-[78.5px] w-full animate-pulse rounded-lg border border-[#e2d5c3] bg-[#f5f0e6] shadow-sm"
    />
  );
}
