import { z } from 'zod';
import {
  CAMPAIGN_GOAL_MAX,
  CAMPAIGN_NAME_MAX,
  DIRECTIVE_MAX,
  QUEST_DESCRIPTION_MAX,
  QUEST_TITLE_MAX,
} from '@/lib/quests/constants';
import { PASSWORD_MIN } from '@/lib/auth-constants';

// z.guid() (not z.uuid()) so the seed's fixed ids like 1111…-1111 validate.
const id = z.guid('Invalid id');

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} cannot exceed ${max} characters`)
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

export const createCampaignSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Campaign name must be at least 3 characters')
    .max(CAMPAIGN_NAME_MAX, `Campaign name cannot exceed ${CAMPAIGN_NAME_MAX} characters`),
  ultimate_goal: optionalText(CAMPAIGN_GOAL_MAX, 'Ultimate goal'),
  guild_id: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(id.nullable()),
  intent: z.enum(['manual', 'oracle']).default('manual'),
});

export const campaignStatusSchema = z.enum(['active', 'completed', 'archived']);

/** A `?page=` value: a positive integer, or page 1 for anything else. */
export const pageSchema = z.coerce.number().int().min(1).max(10000).catch(1);

export const questFormSchema = z.object({
  quest_id: id.optional(),
  campaign_id: id,
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(QUEST_TITLE_MAX, `Title cannot exceed ${QUEST_TITLE_MAX} characters`),
  description: optionalText(QUEST_DESCRIPTION_MAX, 'Description'),
  priority: z.enum(['low', 'medium', 'high']).default('low'),
  is_milestone: z
    .string()
    .optional()
    .transform((v) => v === 'on'),
  assignee_id: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(id.nullable()),
});

export const questStatusSchema = z.enum(['pending', 'in-progress', 'completed']);

export const directiveSchema = z.object({
  campaign_id: id,
  directive: z
    .string()
    .trim()
    .min(5, 'Describe the directive in at least 5 characters')
    .max(DIRECTIVE_MAX, `Keep the directive under ${DIRECTIVE_MAX} characters`),
});

export const guildNameSchema = z
  .string()
  .trim()
  .min(3, 'Guild name must be at least 3 characters')
  .max(60, 'Guild name cannot exceed 60 characters');

export const guildRoleSchema = z.enum(['manager', 'worker']);

export { id as idSchema };

export const passwordResetRequestSchema = z.object({
  email: z.email('Enter a valid email address'),
});

export const newPasswordSchema = z
  .object({
    password: z.string().min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { message: 'Passwords do not match.' });

export const emailInviteSchema = z.object({
  email: z.email('Enter a valid email address').max(254, 'That email address is too long'),
});

/** Flattens zod issues into { field: firstMessage }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    out[key] ??= issue.message;
  }
  return out;
}

export function formToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === 'string' && !key.startsWith('$ACTION')) out[key] = value;
  });
  return out;
}
