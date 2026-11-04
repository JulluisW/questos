import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ForgeCampaignDialogTrigger } from './_components/forge-campaign-dialog-trigger';

export default async function QuestBoardIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: latestCampaign } = await supabase
    .from('campaigns')
    .select('id')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (latestCampaign) {
    redirect(`/board/${latestCampaign.id}`);
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="text-center">
        <h2 className="font-serif text-2xl font-bold text-[#1c120c]">No Active Campaigns</h2>
        <p className="mt-2 text-sm text-stone-500">Your guild has no active bounties.</p>
        <ForgeCampaignDialogTrigger />
      </div>
    </div>
  );
}
