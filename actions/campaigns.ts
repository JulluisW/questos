// actions/campaigns.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type ActionState = {
  error?: string;
  fieldErrors?: {
    name?: string;
    ultimate_goal?: string;
  };
};

export async function createCampaignAction(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const name = (formData.get('name') as string)?.trim();
  const ultimate_goal = (formData.get('ultimate_goal') as string)?.trim();

  // 1. Schema Validation
  const fieldErrors: ActionState['fieldErrors'] = {};

  if (!name || name.length < 3) {
    fieldErrors.name = 'Campaign title must be at least 3 characters.';
  } else if (name.length > 60) {
    fieldErrors.name = 'Campaign title cannot exceed 60 characters.';
  }

  if (ultimate_goal && ultimate_goal.length > 200) {
    fieldErrors.ultimate_goal = 'Ultimate goal cannot exceed 200 characters.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  // 2. Resolve Authenticated User
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Your session has expired. Please log in again.' };
  }

  // 3. Resolve Active Guild Membership
  const { data: membership, error: guildError } = await supabase
    .from('guild_members')
    .select('guild_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (guildError || !membership) {
    return { error: 'You must belong to a guild before forging a campaign.' };
  }

  // 4. Database Mutation
  const { data: newCampaign, error: insertError } = await supabase
    .from('campaigns')
    .insert([
      {
        guild_id: membership.guild_id,
        name,
        ultimate_goal: ultimate_goal || null,
        created_by: user.id,
      },
    ])
    .select('id')
    .single();

  if (insertError || !newCampaign) {
    return { error: insertError?.message || 'Failed to forge campaign.' };
  }

  // 5. URL-Driven State Redirect
  redirect(`/board/${newCampaign.id}`);
}
