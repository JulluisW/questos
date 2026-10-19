import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuestItem } from '@/components/QuestItem';
import type { Quest } from '@/types/quest';
import { useQuestContext } from '@/context/QuestContext';

type SortableQuestCardProps = {
  quest: Quest;
  onDelete: (id: string) => void;
};

export function SortableQuestCard({ quest, onDelete }: SortableQuestCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: quest.id,
  });

  const { handleDeleteQuest, archiveQuest } = useQuestContext();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} className={`mb-3 ${isDragging ? 'opacity-0' : ''}`}>
      <div className="cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <QuestItem quest={quest} />
      </div>
      <div className="flex items-center justify-between"></div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteQuest(quest.id);
        }}
        className="btn-delete font-heading text-accent-career/50 hover:border-accent-career hover:bg-accent-career/10 hover:text-accent-career mt-2 cursor-pointer rounded border border-transparent bg-transparent px-1.5 py-0.5 text-[0.75rem] transition-all duration-200"
      >
        Abandon
      </button>
      {/* Only show the Archive button if the quest is actually completed */}
      {quest.status === 'completed' && (
        <button
          onClick={() => archiveQuest(quest.id)}
          className="rounded bg-yellow-600 px-3 py-1 text-sm text-white transition-colors hover:bg-yellow-700"
        >
          Archive to Hall of Records
        </button>
      )}
    </li>
  );
}
