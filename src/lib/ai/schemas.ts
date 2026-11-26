import { z } from 'zod';
import { QUEST_DESCRIPTION_MAX, QUEST_TITLE_MAX } from '@/lib/quests/constants';

// Limits mirror the CHECK constraints on public.quests so validated output
// can always be inserted.
export const QuestItemSchema = z.object({
  title: z
    .string()
    .min(3)
    .max(QUEST_TITLE_MAX)
    .describe('Short, concrete, action-oriented quest title (imperative verb first)'),
  description: z
    .string()
    .max(QUEST_DESCRIPTION_MAX)
    .nullable()
    .describe('One sentence of context or acceptance criteria, or null'),
  priority: z.enum(['low', 'medium', 'high']).describe('How urgent or important the quest is'),
  is_milestone: z.boolean().describe('True only for pivotal deliverables that mark major progress'),
});

export const CampaignDecompositionSchema = z.object({
  quests: z
    .array(QuestItemSchema)
    .min(1)
    .max(8)
    .describe('Ordered list of quests that together achieve the directive'),
});

export type QuestItem = z.infer<typeof QuestItemSchema>;
export type CampaignDecomposition = z.infer<typeof CampaignDecompositionSchema>;
