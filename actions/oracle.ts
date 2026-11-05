'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getUserId } from '@/lib/supabase/server';
import { consultOracle } from '@/lib/ai/oracle';
import { directiveSchema, fieldErrors, formToObject } from '@/lib/validation';
import type { ActionState } from '@/types';

export async function askOracleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = directiveSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { ok: false, error: 'Please fix the directive.', fieldErrors: fieldErrors(parsed.error) };
  }
  const { campaign_id, directive } = parsed.data;

  const supabase = await createClient();
  if (!(await getUserId(supabase))) return { ok: false, error: 'Please sign in again.' };

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name, ultimate_goal')
    .eq('id', campaign_id)
    .maybeSingle();
  if (!campaign) return { ok: false, error: 'Campaign not found.' };

  // Check before spending a model call on quests that RLS would reject.
  const { data: canManage } = await supabase.rpc('can_manage_campaign', { p_campaign_id: campaign_id });
  if (!canManage) {
    return { ok: false, error: 'Only the guild boss or a manager can consult the Oracle for this campaign.' };
  }

  const result = await consultOracle(supabase, campaign, directive);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(`/board/${campaign_id}`);
  revalidatePath('/dashboard');
  return { ok: true, message: `The Oracle revealed ${result.count} new quests.` };
}
