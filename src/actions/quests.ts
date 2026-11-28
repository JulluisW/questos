'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getUserId } from '@/lib/supabase/server';
import { dbErrorMessage } from '@/lib/db-errors';
import {
  fieldErrors,
  formToObject,
  idSchema,
  questFormSchema,
  questPositionSchema,
  questStatusSchema,
} from '@/lib/validation';
import type { ActionState, QuestStatus } from '@/types';

const NO_PERMISSION = 'Only the guild boss or a manager can change quests here.';

/** Creates a quest, or updates it when `quest_id` is present. */
export async function saveQuestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formToObject(formData);
  const parsed = questFormSchema.safeParse(raw);
  const status = questStatusSchema.optional().safeParse(raw.status || undefined);
  if (!parsed.success || !status.success) {
    return {
      ok: false,
      error: 'Please fix the highlighted fields.',
      fieldErrors: parsed.success ? {} : fieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  if (!(await getUserId(supabase))) return { ok: false, error: 'Please sign in again.' };

  const { quest_id, campaign_id, ...fields } = parsed.data;
  const values = { ...fields, ...(status.data ? { status: status.data } : {}) };

  const { data, error } = quest_id
    ? await supabase.from('quests').update(values).eq('id', quest_id).select('id')
    : await supabase.from('quests').insert({ ...values, campaign_id }).select('id');

  if (error || !data?.length) {
    return { ok: false, error: dbErrorMessage(error, NO_PERMISSION, NO_PERMISSION) };
  }

  revalidatePath(`/board/${campaign_id}`);
  revalidatePath('/dashboard');
  return { ok: true, message: quest_id ? 'Quest updated.' : 'Quest posted to the board.' };
}

export async function deleteQuestAction(questId: string): Promise<ActionState> {
  const id = idSchema.safeParse(questId);
  if (!id.success) return { ok: false, error: 'Invalid request.' };

  const supabase = await createClient();
  if (!(await getUserId(supabase))) return { ok: false, error: 'Please sign in again.' };

  const { data, error } = await supabase.from('quests').delete().eq('id', id.data).select('campaign_id');
  if (error || !data?.length) {
    return { ok: false, error: dbErrorMessage(error, NO_PERMISSION, NO_PERMISSION) };
  }

  revalidatePath(`/board/${data[0].campaign_id}`);
  revalidatePath('/dashboard');
  return { ok: true };
}

/** Moves a quest to a column and, for managers reordering, to a position within it. */
export async function updateQuestStatusAction(
  questId: string,
  newStatus: QuestStatus,
  position?: number
): Promise<ActionState> {
  const id = idSchema.safeParse(questId);
  const status = questStatusSchema.safeParse(newStatus);
  const pos = questPositionSchema.safeParse(position);
  if (!id.success || !status.success || !pos.success) return { ok: false, error: 'Invalid request.' };

  const supabase = await createClient();
  if (!(await getUserId(supabase))) return { ok: false, error: 'Please sign in again.' };

  const { data, error } = await supabase
    .from('quests')
    .update(pos.data === undefined ? { status: status.data } : { status: status.data, position: pos.data })
    .eq('id', id.data)
    .select('campaign_id');

  if (error || !data?.length) {
    return { ok: false, error: dbErrorMessage(error, 'You cannot move this quest.', 'You cannot move this quest.') };
  }

  revalidatePath(`/board/${data[0].campaign_id}`);
  revalidatePath('/dashboard');
  return { ok: true };
}

/** Worker-friendly: assign the quest to yourself, or release your claim. */
export async function claimQuestAction(questId: string, claim: boolean): Promise<ActionState> {
  const id = idSchema.safeParse(questId);
  if (!id.success) return { ok: false, error: 'Invalid request.' };

  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return { ok: false, error: 'Please sign in again.' };

  const { data, error } = await supabase
    .from('quests')
    .update({ assignee_id: claim ? userId : null })
    .eq('id', id.data)
    .select('campaign_id');

  if (error || !data?.length) {
    return { ok: false, error: dbErrorMessage(error, 'You cannot claim this quest.', 'You cannot claim this quest.') };
  }

  revalidatePath(`/board/${data[0].campaign_id}`);
  revalidatePath('/dashboard');
  return { ok: true };
}
