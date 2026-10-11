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
        className="btn-delete mt-2 cursor-pointer rounded border border-transparent bg-transparent px-1.5 py-0.5 font-heading text-[0.75rem] text-accent-career/50 transition-all duration-200 hover:border-accent-career hover:bg-accent-career/10 hover:text-accent-career"
      >
        Abandon
      </button>
      {/* Only show the Archive button if the quest is actually completed */}
      {quest.status === 'completed' && (
        <button
          onClick={() => archiveQuest(quest.id)}
          className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
        >
          Archive to Hall of Records
        </button>
      )}
    </li>
  );
}
