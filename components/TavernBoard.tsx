'use client';

import { AddQuestForm } from '@/components/AddQuestForm';
import { BoardHeader } from '@/components/BoardHeader';
import { KanbanBoard } from '@/components/KanbanBoard';
import { KanbanSkeleton } from '@/components/KanbanSkeleton';
import { useQuestContext } from '@/context/QuestContext';
import { updateQuestStatusInDB } from '@/hooks/useQuests';

export function TavernBoard() {
  const {
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
  } = useQuestContext();

  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-5 font-body text-ink">
      <main
        id="tavern-board"
        className="tavern-board w-full max-w-275 rounded border-16 border-wood bg-parchment px-6 py-10 shadow-[0_25px_50px_rgba(0,0,0,0.9),inset_0_0_80px_rgba(92,64,51,0.15)] md:px-10"
      >
        <BoardHeader level={level} xpProgress={xpProgress} />

        <div className="quest-log">
          <AddQuestForm
            draftText={draftText}
            campaign={campaign}
            isMilestone={isMilestone}
            onDraftTextChange={setDraftText}
            onCampaignChange={setCampaign}
            onIsMilestoneChange={setIsMilestone}
            onSubmit={handleAddQuest}
          />

          {!isMounted ? (
            <KanbanSkeleton />
          ) : (
            <KanbanBoard
              quests={quests}
              onQuestDrag={handleQuestDrag}
              onQuestStatusPersist={updateQuestStatusInDB}
              onDelete={handleDeleteQuest}
            />
          )}
        </div>
      </main>
    </div>
  );
}
