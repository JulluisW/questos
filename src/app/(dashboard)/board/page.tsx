import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Kanban } from 'lucide-react';
import { getLatestActiveCampaignId } from '@/data/campaigns';
import { EmptyState } from '@/components/ui/empty-state';
import { buttonVariants } from '@/components/ui/button';
import { SectionError } from '@/components/ui/section-error';

export const metadata = { title: 'Quest Board' };

/** Opens the most recently touched active campaign the user can see. */
export default async function QuestBoardIndexPage() {
  const latest = await getLatestActiveCampaignId();

  if (!latest.ok) {
    return (
      <div className="mx-auto max-w-3xl p-6 md:p-12">
        <SectionError what="your campaigns" />
      </div>
    );
  }

  if (latest.data) redirect(`/board/${latest.data}`);

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-12">
      <EmptyState
        icon={<Kanban className="h-8 w-8" />}
        title="No active campaigns"
        description="A quest board belongs to a campaign. Forge one to start posting quests."
        action={
          <Link href="/campaigns?new=true" className={buttonVariants()}>
            Forge New Campaign
          </Link>
        }
      />
    </div>
  );
}
