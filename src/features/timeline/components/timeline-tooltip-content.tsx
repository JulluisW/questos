import { ArrowRight, Award, Info } from 'lucide-react';
import type { QuestStatus } from '@/types';
import type { MoveKind, TimelineDay, TimelineRow } from '../build';
import { formatDateTime, formatDay, formatDuration } from '../format';
import { STATUS_ORDER, STATUS_THEME } from '../status-theme';

const MOVE_LABEL: Record<MoveKind, string> = {
  created: 'Posted',
  started: 'Started',
  completed: 'Completed',
  reopened: 'Reopened',
  moved: 'Moved back',
};

function StatusPill({ status }: { status: QuestStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase"
      style={{ background: `${STATUS_THEME[status].fill}33`, color: status === 'pending' ? '#c7d3e6' : '#f3e6d0' }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_THEME[status].fill }} />
      {STATUS_THEME[status].label}
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-stone-400">{label}</dt>
      <dd className="text-right text-amber-50">{children}</dd>
    </>
  );
}

export function SegmentTooltip({
  row,
  segmentIndex,
  people,
}: {
  row: TimelineRow;
  segmentIndex: number;
  people: Record<string, string>;
}) {
  const segment = row.segments[segmentIndex];
  const { quest, metrics } = row;
  const totalTime = STATUS_ORDER.reduce((n, s) => n + metrics.timeIn[s], 0) || 1;
  const mover = segment.enteredBy ? (people[segment.enteredBy] ?? 'A guild member') : null;

  return (
    <div className="w-76 space-y-3">
      {/* Quest header */}
      <div>
        <div className="flex items-start gap-1.5">
          {quest.is_milestone && (
            <Award className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-label="Milestone" />
          )}
          <p className="font-serif text-sm leading-snug font-semibold text-amber-50">{quest.title}</p>
        </div>
        {quest.description && <p className="mt-1 line-clamp-2 text-[11px] text-stone-400">{quest.description}</p>}
      </div>

      {/* This stage */}
      <div className="rounded border border-amber-900/40 bg-black/20 p-2.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-300">
            {segment.enteredFrom ? (
              <>
                <StatusPill status={segment.enteredFrom} />
                <ArrowRight className="h-3 w-3 text-stone-500" />
              </>
            ) : null}
            <StatusPill status={segment.status} />
          </div>
          <span className="text-[10px] font-semibold tracking-wider text-amber-400 uppercase">
            {MOVE_LABEL[segment.kind]}
          </span>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
          <Row label="Entered">{formatDateTime(segment.start)}</Row>
          <Row label="Left">
            {segment.ongoing ? <span className="text-emerald-300">Still here</span> : formatDateTime(segment.end)}
          </Row>
          <Row label="Time in stage">
            <b>{formatDuration(segment.end - segment.start)}</b>
          </Row>
          {mover && <Row label="Moved by">{mover}</Row>}
        </dl>
      </div>

      {/* Whole-quest stats */}
      <div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
          {metrics.leadMs !== null ? (
            <Row label="Lead time">{formatDuration(metrics.leadMs)}</Row>
          ) : (
            <Row label="Open for">{formatDuration(metrics.ageMs)}</Row>
          )}
          {metrics.cycleMs !== null && <Row label="Cycle time">{formatDuration(metrics.cycleMs)}</Row>}
          <Row label="Moves">
            {metrics.moveCount}
            {metrics.reopenCount > 0 && <span className="text-amber-400"> · {metrics.reopenCount} reopened</span>}
          </Row>
          {quest.xp_reward ? <Row label="Reward">+{quest.xp_reward} XP</Row> : null}
          {quest.priority && <Row label="Priority">{quest.priority}</Row>}
          {quest.assignee_id && <Row label="Assignee">{people[quest.assignee_id] ?? 'Assigned'}</Row>}
        </dl>

        {/* Where the time went */}
        <div className="mt-2.5">
          <div className="flex h-1.5 overflow-hidden rounded-full bg-stone-800" aria-hidden>
            {STATUS_ORDER.map((s) =>
              metrics.timeIn[s] > 0 && s !== 'completed' ? (
                <div
                  key={s}
                  style={{ width: `${(metrics.timeIn[s] / totalTime) * 100}%`, background: STATUS_THEME[s].fill }}
                />
              ) : null
            )}
          </div>
          <p className="mt-1 text-[10px] text-stone-400">
            Waiting {formatDuration(metrics.timeIn.pending)} · Working {formatDuration(metrics.timeIn['in-progress'])}
          </p>
        </div>
      </div>

      {segment.inferred && (
        <p className="flex gap-1.5 border-t border-amber-900/40 pt-2 text-[10px] text-amber-300/80">
          <Info className="mt-px h-3 w-3 shrink-0" />
          Estimated from the quest&apos;s timestamps — this move happened before history tracking was enabled.
        </p>
      )}
    </div>
  );
}

const MAX_DAY_MOVES = 6;

export function DayTooltip({ day }: { day: TimelineDay }) {
  const total = STATUS_ORDER.reduce((n, s) => n + day.counts[s], 0);
  const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-72 space-y-2.5">
      <div className="flex items-baseline justify-between">
        <p className="font-serif text-sm font-semibold text-amber-50">{formatDay(day.start)}</p>
        {day.isToday && (
          <span className="text-[10px] font-semibold tracking-wider text-amber-400 uppercase">Today</span>
        )}
      </div>

      <div>
        <p className="mb-1 text-[10px] tracking-wider text-stone-400 uppercase">Board at end of day · {total} quests</p>
        <div className="grid grid-cols-3 gap-1.5">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="rounded border border-amber-900/40 bg-black/20 px-2 py-1.5">
              <div className="flex items-center gap-1 text-[10px] text-stone-400">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_THEME[s].fill }} />
                {STATUS_THEME[s].label}
              </div>
              <div className="font-serif text-base font-semibold text-amber-50">{day.counts[s]}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-[10px] tracking-wider text-stone-400 uppercase">
          {day.moves.length ? `${day.moves.length} card ${day.moves.length === 1 ? 'move' : 'moves'}` : 'No card moves'}
        </p>
        <ul className="space-y-1">
          {day.moves.slice(0, MAX_DAY_MOVES).map((m, i) => (
            <li key={i} className="flex items-center gap-1.5 text-[11px]">
              <span className="w-10 shrink-0 text-stone-500 tabular-nums">{timeFormat.format(m.at)}</span>
              <span className="truncate text-amber-50">{m.questTitle}</span>
              <span className="ml-auto flex shrink-0 items-center gap-1 text-[10px] text-stone-400">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_THEME[m.to].fill }} />
                {MOVE_LABEL[m.kind]}
              </span>
            </li>
          ))}
        </ul>
        {day.moves.length > MAX_DAY_MOVES && (
          <p className="mt-1 text-[10px] text-stone-500">+{day.moves.length - MAX_DAY_MOVES} more</p>
        )}
      </div>
    </div>
  );
}
