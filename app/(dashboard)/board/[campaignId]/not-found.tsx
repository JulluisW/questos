import Link from 'next/link';
import { Kanban } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { buttonVariants } from '@/components/ui/button';

export default function CampaignNotFound() {
  return (
    <div className="mx-auto max-w-3xl p-6 md:p-12">
      <EmptyState
        icon={<Kanban className="h-8 w-8" />}
        title="Campaign not found"
        description="It may have been deleted, or it belongs to a guild you are not a member of."
        action={
          <Link href="/campaigns" className={buttonVariants()}>
            Back to campaigns
          </Link>
        }
      />
    </div>
  );
}
