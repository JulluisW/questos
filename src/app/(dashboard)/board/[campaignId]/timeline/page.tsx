import { redirect } from 'next/navigation';
import { CampaignViewTabs } from '@/features/campaigns/components/campaign-view-tabs';
import { getCampaignTimelineData } from '@/features/timeline/queries';
import { CampaignTimeline } from '@/features/timeline/components/campaign-timeline';

type CampaignTimelinePageProps = {
  params: Promise<{ campaignId: string }>;
};

export default async function CampaignTimelinePage({ params }: CampaignTimelinePageProps) {
  const { campaignId } = await params;
  const data = await getCampaignTimelineData(campaignId);

  if (!data) redirect('/board');

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-widest text-amber-800 uppercase">Campaign timeline</p>
          <h2 className="truncate font-serif text-3xl font-medium tracking-tight text-[#1c120c] md:text-4xl">
            {data.campaign.name}
          </h2>
          {data.campaign.ultimate_goal && (
            <p className="mt-1.5 max-w-2xl text-sm text-stone-600">{data.campaign.ultimate_goal}</p>
          )}
        </div>
        <CampaignViewTabs campaignId={data.campaign.id} active="timeline" />
      </div>

      <CampaignTimeline data={data} />
    </div>
  );
}
