// lib/ai/schemas.ts
import { z } from 'zod';

export const QuestItemSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(80, 'Title cannot exceed 80 characters')
    .describe('Actionable quest objective written in medieval RPG terminology'),
  description: z.string().max(200).nullable().describe('Brief execution tactical context or acceptance criteria'),
  is_milestone: z.boolean().describe('Set to true if this represents a major campaign boss or key milestone'),
  xp_reward: z
    .number()
    .int()
    .min(20)
    .max(500)
    .describe('Experience points awarded based on quest complexity (e.g., 50 XP standard, 250 XP milestone)'),
});

export const CampaignDecompositionSchema = z.object({
  quests: z
    .array(QuestItemSchema)
    .min(1)
    .max(8)
    .describe('An array of broken down sub-quests necessary to fulfill the campaign directive'),
});

export type QuestItem = z.infer<typeof QuestItemSchema>;
export type CampaignDecomposition = z.infer<typeof CampaignDecompositionSchema>;
