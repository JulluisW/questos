'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Award, Shield } from 'lucide-react';
import { ApprovalActions } from '@/components/quests/approval-actions';
import { Notice } from '@/components/ui/notice';
import { PRIORITY_STYLES } from '@/lib/quests/constants';
import { cn, formatDate } from '@/lib/utils';
import type { QuestPriority } from '@/types';

export type ApprovalGroup = {
  campaignId: string;
  campaignName: string;
  guildName: string | null;
  quests: {
    id: string;
    title: string;
    priority: QuestPriority;
    isMilestone: boolean;
    requestedAt: string | null;
    requester: string | null;
  }[];
};

/**
 * Client side only for the success banner: it stays put while the server
 * re-renders the list without the quest that was just decided.
 */
export function ApprovalsList({ groups }: { groups: ApprovalGroup[] }) {
  const [banner, setBanner] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {banner && (
        <Notice tone="success" onDismiss={() => setBanner(null)}>
          {banner}
        </Notice>
      )}
      {groups.map((group) => (
        <section
          key={group.campaignId}
          aria-labelledby={`approvals-${group.campaignId}`}
          className="rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] p-5 shadow-sm"
        >
          <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id={`approvals-${group.campaignId}`} className="font-serif text-lg font-semibold text-[#1c120c]">
              <Link href={`/board/${group.campaignId}`} className="hover:underline">
                {group.campaignName}
              </Link>
            </h2>
            {group.guildName && (
              <span className="inline-flex items-center gap-1 text-[11px] text-stone-500">
                <Shield className="h-3 w-3" aria-hidden /> {group.guildName}
              </span>
            )}
          </header>
          <ul className="divide-y divide-[#ebe1d3]">
            {group.quests.map((quest) => (
              <li key={quest.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-[#1c120c]">
                    {quest.isMilestone && <Award className="h-4 w-4 shrink-0 text-amber-700" aria-label="Milestone" />}
                    <span className="wrap-break-word">{quest.title}</span>
                    <span
                      className={cn(
                        'shrink-0 rounded border px-1.5 py-0.5 font-sans text-[9px] font-bold tracking-widest uppercase',
                        PRIORITY_STYLES[quest.priority]
                      )}
                    >
                      {quest.priority}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    {quest.requester ?? 'A former member'} asked {formatDate(quest.requestedAt)}
                  </p>
                </div>
                <div className="shrink-0 sm:max-w-xs">
                  <ApprovalActions questId={quest.id} questTitle={quest.title} onDone={setBanner} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
