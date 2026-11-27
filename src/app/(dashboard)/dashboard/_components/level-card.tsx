import { Suspense } from 'react';
import { Crown } from 'lucide-react';
import { getMyXp, levelProgress } from '@/data/xp';
import { ProgressBar } from '@/components/ui/progress-bar';
import { RetryButton } from '@/components/ui/retry-button';

const levelClass = 'font-serif text-2xl leading-none font-bold';
const smallClass = 'text-[11px] tracking-wide';
/** Placeholder text keeps the real line heights; only the colour is hidden. */
const placeholderClass = 'animate-pulse rounded bg-[#efe5d6] text-transparent';

export function LevelCard() {
  return (
    <Suspense fallback={<LevelCardSkeleton />}>
      <LevelCardContent />
    </Suspense>
  );
}

async function LevelCardContent() {
  const result = await getMyXp();

  if (!result.ok) {
    return (
      <LevelFrame>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`${levelClass} text-[#1c120c]`}>n/a</p>
            <p className={`${smallClass} mt-1 text-stone-500 uppercase`}>Your level</p>
          </div>
          <RetryButton what="your level" iconOnly />
        </div>
      </LevelFrame>
    );
  }

  const { xp, level, nextLevelXp } = result.data;
  const next = level + 1;

  return (
    <LevelFrame>
      <div className="flex items-baseline justify-between gap-3">
        <p className={`${levelClass} text-[#1c120c]`}>Level {level}</p>
        <p className={`${smallClass} text-stone-500 uppercase`}>{xp} XP</p>
      </div>
      <ProgressBar value={levelProgress(result.data)} label={`Progress to level ${next}`} className="mt-3" />
      <p className={`${smallClass} mt-2 text-stone-500`}>
        {xp === 0
          ? 'Complete a quest in one of your campaigns to earn XP.'
          : `${nextLevelXp - xp} XP to level ${next}`}
      </p>
    </LevelFrame>
  );
}

function LevelFrame({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-label="Your level"
      className="flex items-center gap-4 rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] p-4 shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-amber-800/30 bg-[#170e0a] text-amber-500">
        <Crown className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}

// 📌 READ-ME: the skeleton renders the same lines as the real card with the
// text hidden, so its height matches without a hard-coded pixel value.
function LevelCardSkeleton() {
  return (
    <div aria-hidden>
      <LevelFrame>
        <div className="flex items-baseline justify-between gap-3">
          <p className={`${levelClass} ${placeholderClass}`}>Level 1</p>
          <p className={`${smallClass} ${placeholderClass}`}>0 XP</p>
        </div>
        <div className={`mt-3 h-1.5 w-full ${placeholderClass}`} />
        <p className={`${smallClass} mt-2 w-32 ${placeholderClass}`}>100 XP to level 2</p>
      </LevelFrame>
    </div>
  );
}
