import { requireUser } from '@/data/auth';
import { getManagedGuilds } from '@/data/guilds';
import { isAIEnabled } from '@/lib/ai/models';
import { ForgeCampaignButton } from '@/components/campaigns/forge-campaign';
import { RetryButton } from '@/components/ui/retry-button';

type ForgeCampaignLoaderProps = {
  label?: string;
  defaultOpen?: boolean;
};

/** The "Forge New Campaign" button needs the guilds you manage for its realm picker. */
export async function ForgeCampaignLoader({ label, defaultOpen }: ForgeCampaignLoaderProps) {
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

  return (
    <ForgeCampaignButton realms={guilds.data} aiEnabled={isAIEnabled()} label={label} defaultOpen={defaultOpen} />
  );
}

/** Same size as the md Button (py-2 + text-xs line ≈ 34px). */
export function ForgeButtonSkeleton() {
  return <div aria-hidden className="h-[34px] w-48 animate-pulse rounded bg-[#e6dcce]" />;
}
