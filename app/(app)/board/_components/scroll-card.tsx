import { useSortable } from '@dnd-kit/sortable';
import { Clock, Hash } from 'lucide-react';

type ScrollCardProps = {
  id: string;
  title: string;
  badge: { label: string; color: string };
  meta?: string[];
  assignee: string;
  xp: string;
  xpDisplay?: React.ReactNode;
  progress?: { value: number; label: string; due: string };
  alert?: string;
  alertColor?: string;
  completed?: boolean;
  completedDate?: string;
  symbol?: React.ReactNode;
  waxSeal?: boolean;
};

export function ScrollCard({
  id,
  title,
  badge,
  meta,
  assignee,
  xp,
  xpDisplay,
  progress,
  alert,
  alertColor,
  completed,
  completedDate,
  symbol,
  waxSeal,
}: ScrollCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: id,
  });
  return (
    <li ref={setNodeRef}>
      <div
        {...attributes}
        {...listeners}
        className="group relative flex cursor-grab flex-col gap-3 rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] p-4 shadow-sm transition-all hover:border-amber-700/40 hover:shadow-md active:cursor-grabbing"
      >
        {/* Brass Rivets / Pins in the 4 corners of the card */}
        <div className="absolute top-1.5 left-1.5 h-1.5 w-1.5 rounded-full bg-[#b89768] opacity-60 shadow-inner" />
        <div className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#b89768] opacity-60 shadow-inner" />

        {/* Title & Badge Row */}
        <div className="flex items-start justify-between gap-2 pt-1">
          <div className="flex items-start gap-2">
            {symbol && <div className="mt-0.5 rounded border border-amber-200/60 bg-amber-100/50 p-1">{symbol}</div>}
            <h4
              className={`font-serif text-base leading-snug font-semibold ${completed ? 'text-stone-400 line-through' : 'text-[#1c120c]'}`}
            >
              {title}
            </h4>
          </div>

          {waxSeal ? (
            <div
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-red-950 bg-red-900 shadow-md"
              title="Completed Seal"
            >
              <span className="font-serif text-[8px] font-bold text-amber-200">DONE</span>
            </div>
          ) : (
            <span
              className={`rounded px-2 py-0.5 font-sans text-[9px] font-bold tracking-widest whitespace-nowrap uppercase shadow-2xs ${badge.color}`}
            >
              {badge.label}
            </span>
          )}
        </div>

        {/* Metadata Row */}
        {!completed && meta && (
          <div className="flex items-center gap-3 pl-6 font-sans text-[10px] tracking-wider text-stone-500 uppercase">
            {meta.map((item, i) => (
              <span key={i} className="flex items-center gap-1">
                {i === 0 && <Hash className="h-3 w-3 text-stone-400" />}
                {i === 1 && <Clock className="h-3 w-3 text-stone-400" />}
                {item}
              </span>
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {progress && (
          <div className="mt-1 space-y-1.5 pl-6">
            <div className="flex justify-between font-sans text-[10px] text-stone-600">
              <span>{progress.label}</span>
              <span className="font-semibold">{progress.due}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full border border-[#d8ccbc] bg-[#ebdcca]">
              <div className="h-full rounded-full bg-amber-800" style={{ width: `${progress.value}%` }} />
            </div>
          </div>
        )}

        {/* Alert Status */}
        {alert && <div className={`mt-1 pl-6 font-sans text-[10px] ${alertColor || 'text-stone-500'}`}>⚠️ {alert}</div>}

        {/* Completed Date */}
        {completed && completedDate && (
          <div className="mt-1 pl-6 font-sans font-serif text-[10px] text-stone-400 italic">{completedDate}</div>
        )}

        {/* Footer (Assignee & XP / Seal) */}
        <div className="mt-1 flex items-center justify-between border-t border-dashed border-[#e2d5c3] pt-3 text-xs">
          <div className="flex items-center gap-1.5 font-sans text-[10px] font-medium text-stone-600">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-800" />
            {assignee}
          </div>

          {xpDisplay ? (
            <div>{xpDisplay}</div>
          ) : (
            <div
              className={`font-sans text-[10px] font-bold tracking-widest uppercase ${completed ? 'text-stone-400' : 'font-serif text-amber-800'}`}
            >
              {xp}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
