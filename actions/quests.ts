'use server';

import { createClient } from '@/lib/supabase/server';
import type { QuestStatus } from '@/types/quest';

export async function createQuestAction(formData: FormData) {
  try {
    const supabase = await createClient();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const campaign_id = formData.get('campaign_id') as string;
    const is_milestone = formData.get('is_milestone') === 'on';

    if (!title || !campaign_id) {
      return { error: 'Quest title and campaign ID are required.' };
    }

    const newQuest = {
      title,
      description: description || null,
      campaign_id,
      status: 'pending' as QuestStatus,
      is_milestone,
      xp_reward: is_milestone ? 250 : 50,
    };

    const { data, error } = await supabase.from('quests').insert([newQuest]).select().single();

    if (error) return { error: error.message };

    return { success: true, quest: data };
  } catch {
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
