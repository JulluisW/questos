import { DashboardHeader } from './_components/dashboard-header';
import { StatsCards } from './_components/stats-cards';
import { ActiveCampaigns } from './_components/active-campaigns';
import { OpenQuests } from './_components/open-quests';
import { RecentlyCompleted } from './_components/recently-completed';

export const metadata = { title: 'Command Center' };

// 📌 READ-ME: this page is NOT async and fetches nothing. Each section below
// fetches its own data inside its own <Suspense>, so:
//   1. headings and frames are sent immediately (the static shell),
//   2. every section streams in as soon as ITS data arrives,
//   3. a slow or failed section doesn't hold back the others.
// If you add an `await` here, the whole page waits for it again.
export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-6">
      <DashboardHeader />
      <StatsCards />
      <ActiveCampaigns />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OpenQuests />
        <RecentlyCompleted />
      </div>
    </div>
  );
}
