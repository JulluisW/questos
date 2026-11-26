import { Suspense } from 'react';
import { getProfile } from '@/data/auth';
import { ForgeButtonSkeleton, ForgeCampaignLoader } from '@/components/campaigns/forge-campaign-loader';

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
        <ForgeCampaignLoader />
      </Suspense>
    </div>
  );
}

async function WelcomeHeading() {
  const profile = await getProfile();
  const firstName = (profile.full_name || profile.username).split(' ')[0];
  return <h1 className={headingClass}>Welcome back, {firstName}</h1>;
}
