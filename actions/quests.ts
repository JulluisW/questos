'use server';

import { createClient } from '@/lib/supabase/server';
import type { QuestStatus } from '@/types/quest';

export async function createQuestAction(formData: FormData) {
  try {
    const supabase = await createClient();

    const text = formData.get('text') as string;
    const campaign = formData.get('campaign') as string;
    const is_milestone = formData.get('is_milestone') === 'on';

    const newQuest = {
      text,
      campaign: campaign || 'General Campaign',
      status: 'pending' as const,
      is_milestone,
    };

    // Insert and immediately return the created row (.select().single())
    const { data, error } = await supabase.from('quests').insert([newQuest]).select().single();

    if (error) return { error: 'Failed to forge new quest in the registry.' };

    return { success: true, quest: data };
  } catch (err) {
    return { error: 'Failed to reach the server.' };
  }
}

export async function updateQuestStatusAction(id: string, newStatus: QuestStatus) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('quests')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', id);

    if (error) {
      // Return the error safely instead of throwing a hard exception
      return { error: 'Database update failed.' };
    }

    return { success: true };
  } catch {
    // Catch network failures or server crashes
    return { error: 'Failed to reach the server.' };
  }
}
