import type { Campaign, Quest, QuestStatus } from '@/types';

/** One status transition, normalised for the client (camelCase, serialisable). */
export type TimelineEvent = {
  id: string;
  questId: string;
  /** `null` means the quest was created. */
  from: QuestStatus | null;
  to: QuestStatus;
  /** ISO timestamp. */
  at: string;
  /** Profile id of whoever moved the card, when known. */
  by: string | null;
  /** Reconstructed from `created_at` / `completed_at` instead of observed. */
  inferred: boolean;
};

/**
 * - `log`: real history from `quest_status_events`.
 * - `derived`: the event table is unavailable (migration not applied), so
 *   history is reconstructed from quest timestamps only.
 */
export type HistorySource = 'log' | 'derived';

export type CampaignTimelineData = {
  campaign: Pick<Campaign, 'id' | 'name' | 'ultimate_goal' | 'status' | 'created_at'>;
  quests: Quest[];
  events: TimelineEvent[];
  /** profile id → display name, for "moved by" and assignee. */
  people: Record<string, string>;
  historySource: HistorySource;
};
