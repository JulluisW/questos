import { Suspense } from 'react';
import { getMyXp, levelProgress } from '@/data/xp';
import { ProgressBar } from '@/components/ui/progress-bar';

const lineClass = 'truncate text-[10px] tracking-wider';
const barClass = 'mt-1 h-1 bg-[#332219]';

// 📌 READ-ME: the layout itself must never await XP. If it did, every page
// would wait for this RPC before showing anything. Its own <Suspense> lets
// the sidebar line stream in on its own.
export function SidebarLevel() {
  return (
    <Suspense fallback={<SidebarLevelSkeleton />}>
      <SidebarLevelContent />
    </Suspense>
  );
}

async function SidebarLevelContent() {
  const result = await getMyXp();
  // A failure shows nothing here; the Command Center card offers the retry.
  if (!result.ok) return null;

  const { xp, level } = result.data;
  return (
    <div className="mt-1.5">
      <p className={`${lineClass} text-amber-600/90`}>
        Level {level} · {xp} XP
      </p>
      <ProgressBar value={levelProgress(result.data)} label={`Progress to level ${level + 1}`} className={barClass} />
    </div>
  );
}

function SidebarLevelSkeleton() {
  return (
    <div aria-hidden className="mt-1.5 animate-pulse">
      <p className={`${lineClass} w-20 rounded bg-[#332219] text-transparent`}>Level 1 · 0 XP</p>
      <div className={`${barClass} w-full rounded-full`} />
    </div>
  );
}
