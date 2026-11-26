import { Suspense } from 'react';
import { getProfile, requireUser } from '@/data/auth';
import { getManagedGuilds } from '@/data/guilds';
import { isAIEnabled } from '@/lib/ai/models';
import { ForgeCampaignButton } from '@/components/campaigns/forge-campaign';
import { RetryButton } from '@/components/ui/retry-button';

const headingClass = 'font-serif text-3xl font-bold tracking-tight text-[#1c120c]';

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-serif text-xs font-semibold tracking-widest text-amber-800 uppercase">Command Center</p>

        {/* 📌 READ-ME: the fallback is the same <h1> without the name, so nothing
            moves when the name streams in. A fallback doesn't have to be a grey
            box; it just has to take up the same space. */}
        <Suspense fallback={<h1 className={headingClass}>Welcome back</h1>}>
          <WelcomeHeading />
        </Suspense>
      </div>

      <Suspense fallback={<ForgeButtonSkeleton />}>
        <ForgeButton />
      </Suspense>
    </div>
  );
}

async function WelcomeHeading() {
  const profile = await getProfile();
  const firstName = (profile.full_name || profile.username).split(' ')[0];
  return <h1 className={headingClass}>Welcome back, {firstName}</h1>;
}

/** The "Forge New Campaign" button needs the guilds you manage for its realm picker. */
async function ForgeButton() {
  const user = await requireUser();
  const guilds = await getManagedGuilds(user.id);

  if (!guilds.ok) {
    return (
      <div role="alert" className="flex items-center gap-2 text-xs text-red-900">
        Couldn&apos;t load your guilds.
        <RetryButton what="your guilds" />
      </div>
    );
  }

  return <ForgeCampaignButton realms={guilds.data} aiEnabled={isAIEnabled()} />;
}

/** Same size as the md Button (py-2 + text-xs line ≈ 34px). */
function ForgeButtonSkeleton() {
  return <div aria-hidden className="h-[34px] w-48 animate-pulse rounded bg-[#e6dcce]" />;
}
