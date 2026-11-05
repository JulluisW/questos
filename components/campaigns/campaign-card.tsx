import Link from 'next/link';
import { Shield, User } from 'lucide-react';
import { CAMPAIGN_STATUS_STYLES } from '@/lib/quests/constants';
import { cn, percent } from '@/lib/utils';
import { ProgressBar } from '@/components/ui/progress-bar';
import { buttonVariants } from '@/components/ui/button';
import type { CampaignWithQuests } from '@/types';

export function CampaignCard({ campaign }: { campaign: CampaignWithQuests }) {
  const total = campaign.quests.length;
  const completed = campaign.quests.filter((q) => q.status === 'completed').length;
  const progress = percent(completed, total);
  const status = campaign.status ?? 'active';

  return (
    <article className="flex flex-col justify-between rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] p-5 shadow-sm transition hover:border-amber-700/40 hover:shadow-md">
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase',
              CAMPAIGN_STATUS_STYLES[status]
            )}
          >
            {status}
          </span>
          <span className="inline-flex items-center gap-1 truncate text-[10px] font-semibold tracking-wider text-stone-500 uppercase">
            {campaign.guilds ? (
              <>
                <Shield className="h-3 w-3" /> {campaign.guilds.name}
              </>
            ) : (
              <>
                <User className="h-3 w-3" /> Solo
              </>
            )}
          </span>
        </div>

        <h3 className="line-clamp-2 font-serif text-lg font-semibold text-[#1c120c]">{campaign.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-stone-600">
          {campaign.ultimate_goal || <span className="text-stone-400 italic">No ultimate goal defined</span>}
        </p>
      </div>

      <div className="mt-6 border-t border-stone-200/70 pt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-stone-600">
          <span>
            Quests ({completed}/{total})
          </span>
          <span className="text-stone-400">{progress}%</span>
        </div>
        <ProgressBar value={progress} label={`${campaign.name}: ${completed} of ${total} quests complete`} />

        <div className="mt-4 flex justify-end">
          <Link href={`/board/${campaign.id}`} className={buttonVariants({ size: 'sm' })}>
            Open Board &rarr;
          </Link>
        </div>
      </div>
    </article>
  );
}
