'use client';

import { XP_PER_MILESTONE, XP_PER_QUEST } from '@/lib/quests/constants';
import { applyQuestDrag, resolveTargetStatus } from '@/lib/quests/drag';
import { normalizeQuest } from '@/lib/quests/normalize';
import { supabase } from '@/lib/supabase/client';
import type { Quest } from '@/types/quest';
import type { QuestStatus } from '@/types/quest';
import { useEffect, useState, type SubmitEvent } from 'react';

export const updateQuestStatusInDB = async (id: string, newStatus: QuestStatus): Promise<void> => {
  await supabase.from('quests').update({ status: newStatus, completed_at: new Date().toISOString() }).eq('id', id);
};

export function useQuests() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [archivedQuests, setArchivedQuests] = useState<Quest[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [campaign, setCampaign] = useState('');
  const [isMilestone, setIsMilestone] = useState(false);

  const xp = quests.reduce((total, quest) => {
    if (quest.status !== 'completed') return total;
    return total + (quest.isMilestone ? XP_PER_MILESTONE : XP_PER_QUEST);
  }, 0);

  const level = Math.floor(xp / 100) + 1;
  const xpProgress = xp % 100;

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const { data, error } = await supabase
          .from('quests')
          .select('*')
          .is('archived_at', null)
          .order('created_at', { ascending: true });

        if (error) {
          // If fetch fails, keep empty list (UI still mounts).
          return;
        }

        const normalized = (data ?? []).map((row: any) =>
          normalizeQuest({
            ...row,
            isMilestone: row?.is_milestone,
          }),
        );

        setQuests(normalized);
      } finally {
        setIsMounted(true);
      }
    };

    void fetchQuests();
  }, []);

  useEffect(() => {
    const fetchArchivedQuests = async () => {
      try {
        const { data, error } = await supabase
          .from('quests')
          .select('*')
          .not('archived_at', 'is', null)
          .order('created_at', { ascending: true });

        if (error) {
          // If fetch fails, keep empty list (UI still mounts).
          return;
        }
        const normalized = (data ?? []).map((row: any) =>
          normalizeQuest({
            ...row,
            isMilestone: row?.is_milestone,
          }),
        );

        setArchivedQuests(normalized);
      } finally {
        setIsMounted(true);
      }
    };

    void fetchArchivedQuests();
  }, []);

  const handleAddQuest = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const text = draftText.trim();
    const campaignName = campaign.trim() || 'General Campaign';
    if (text === '') return;

    const newQuest: Quest = {
      id: 'q_' + Date.now(),
      text,
      campaign: campaignName,
      isMilestone,
      status: 'pending',
      archivedAt: null,
    };

    setQuests((prev) => [...prev, newQuest]);
    setDraftText('');
    setCampaign('');
    setIsMilestone(false);

    const { error } = await supabase.from('quests').insert([
      {
        id: newQuest.id,
        text: newQuest.text,
        campaign: newQuest.campaign,
        status: newQuest.status,
        is_milestone: newQuest.isMilestone,
      },
    ]);

    if (error) {
      setQuests((prev) => prev.filter((q) => q.id !== newQuest.id));
    }
  };

  const handleDeleteQuest = async (id: string) => {
    const deletedQuest = quests.find((q) => q.id === id);

    setQuests((prev) => prev.filter((quest) => quest.id !== id));
    console.log('sampek');

    const { error } = await supabase.from('quests').delete().eq('id', id);
    if (error && deletedQuest) {
      console.log('error');

      setQuests((prev) => [...prev, deletedQuest]);
    }
  };

  const handleQuestDrag = (draggedId: string, overId: string) => {
    const activeQuest = quests.find((q) => q.id === draggedId);
    if (!activeQuest) return;

    const targetStatus = resolveTargetStatus(quests, overId);
    if (!targetStatus) return;

    setQuests(applyQuestDrag(quests, draggedId, overId, targetStatus));
  };

  const archiveQuest = async (id: string) => {
    // 1. Optimistic UI: Instantly remove it from the screen
    setQuests((prev) => prev.filter((q) => q.id !== id));

    // 2. Database Update: Stamp it with the current time
    const { error } = await supabase.from('quests').update({ archived_at: new Date().toISOString() }).eq('id', id);

    if (error) {
      console.error('Failed to archive quest:', error);
    }
  };

  return {
    quests,
    isMounted,
    draftText,
    setDraftText,
    campaign,
    setCampaign,
    isMilestone,
    setIsMilestone,
    handleAddQuest,
    handleDeleteQuest,
    handleQuestDrag,
    level,
    xpProgress,
    archiveQuest,
    archivedQuests,
  };
}
