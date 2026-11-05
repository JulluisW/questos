import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Kanban } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { buttonVariants } from '@/components/ui/button';

export const metadata = { title: 'Quest Board' };

/** Opens the most recently touched active campaign the user can see. */
export default async function QuestBoardIndexPage() {
  const supabase = await createClient();

  const { data: latest } = await supabase
    .from('campaigns')
    .select('id')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest) redirect(`/board/${latest.id}`);

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
