import type { Quest, QuestStatus } from '@/types';
import type { CampaignTimelineData, TimelineEvent } from './types';
import { STATUS_ORDER } from './status-theme';

// ----------------------------------------------------------------------------
// Date helpers (local time, DST-safe day stepping)
// ----------------------------------------------------------------------------
export const DAY_MS = 86_400_000;
const startOfDay = (t: number) => {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};
const addDays = (t: number, n: number) => {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n).getTime();
};

// ----------------------------------------------------------------------------
// Model
// ----------------------------------------------------------------------------
export type MoveKind = 'created' | 'started' | 'completed' | 'reopened' | 'moved';

export type TimelineSegment = {
  status: QuestStatus;
  start: number;
  end: number;
  /** Still in this status right now. */
  ongoing: boolean;
  /** The move that opened this segment. */
  enteredFrom: QuestStatus | null;
  enteredBy: string | null;
  kind: MoveKind;
  inferred: boolean;
};

export type QuestMetrics = {
  createdAt: number;
  /** First time the quest entered In Progress. */
  startedAt: number | null;
  /** When it was last completed (only if it is currently completed). */
  completedAt: number | null;
  /** Created → completed. */
  leadMs: number | null;
  /** First started → completed. */
  cycleMs: number | null;
  /** Created → now, for quests that are not done. */
  ageMs: number | null;
  moveCount: number;
  reopenCount: number;
  timeIn: Record<QuestStatus, number>;
};

export type TimelineRow = {
  quest: Quest;
  status: QuestStatus;
  segments: TimelineSegment[];
  metrics: QuestMetrics;
  hasInferred: boolean;
};

export type DayMove = { questTitle: string; from: QuestStatus | null; to: QuestStatus; at: number; kind: MoveKind };

export type TimelineDay = {
  start: number;
  /** End of the day, clamped to "now" for today. */
  snapshotAt: number;
  isToday: boolean;
  isWeekend: boolean;
  /** Cumulative flow: how many quests were in each status at end of day. */
  counts: Record<QuestStatus, number>;
  activity: Record<MoveKind, number>;
  moves: DayMove[];
};

export type TimelineSummary = {
  total: number;
  byStatus: Record<QuestStatus, number>;
  completionRate: number;
  avgLeadMs: number | null;
  avgCycleMs: number | null;
  oldestWip: { title: string; ms: number } | null;
  movesLast7d: number;
  reopenCount: number;
  lastActivityAt: number | null;
};

export type TimelineModel = {
  rangeStart: number;
  rangeEnd: number;
  now: number;
  rows: TimelineRow[];
  days: TimelineDay[];
  summary: TimelineSummary;
  hasInferred: boolean;
};

// ----------------------------------------------------------------------------
// Builders
// ----------------------------------------------------------------------------
export function classifyMove(from: QuestStatus | null, to: QuestStatus): MoveKind {
  if (from === null) return 'created';
  if (from === 'completed') return 'reopened';
  if (to === 'completed') return 'completed';
  if (to === 'in-progress') return 'started';
  return 'moved';
}

/** Best-effort history for a quest that has no logged events. */
export function deriveEvents(quest: Quest): TimelineEvent[] {
  const createdAt = quest.created_at ?? new Date().toISOString();
  const status = quest.status ?? 'pending';
  const events: TimelineEvent[] = [
    {
      id: `${quest.id}:created`,
      questId: quest.id,
      from: null,
      to: 'pending',
      at: createdAt,
      by: null,
      inferred: true,
    },
  ];
  if (status !== 'pending') {
    events.push({
      id: `${quest.id}:${status}`,
      questId: quest.id,
      from: 'pending',
      to: status,
      at: quest.completed_at ?? createdAt,
      by: null,
      inferred: true,
    });
  }
  return events;
}

const emptyStatusRecord = (): Record<QuestStatus, number> => ({ pending: 0, 'in-progress': 0, completed: 0 });
const emptyActivity = (): Record<MoveKind, number> => ({ created: 0, started: 0, completed: 0, reopened: 0, moved: 0 });
const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

function buildRow(quest: Quest, rawEvents: TimelineEvent[], now: number): TimelineRow {
  const events = (rawEvents.length ? rawEvents : deriveEvents(quest))
    .map((e) => ({ ...e, t: new Date(e.at).getTime() }))
    .sort((a, b) => a.t - b.t);

  const segments: TimelineSegment[] = events.map((event, i) => {
    const next = events[i + 1];
    return {
      status: event.to,
      start: event.t,
      end: next ? next.t : now,
      ongoing: !next,
      enteredFrom: event.from,
      enteredBy: event.by,
      kind: classifyMove(event.from, event.to),
      inferred: event.inferred,
    };
  });

  const status = segments.at(-1)?.status ?? quest.status ?? 'pending';
  const createdAt = segments[0]?.start ?? now;
  const startedAt = segments.find((s) => s.status === 'in-progress')?.start ?? null;
  const completedAt = status === 'completed' ? (segments.at(-1)?.start ?? null) : null;

  const timeIn = emptyStatusRecord();
  for (const s of segments) timeIn[s.status] += Math.max(0, s.end - s.start);

  return {
    quest,
    status,
    segments,
    hasInferred: segments.some((s) => s.inferred),
    metrics: {
      createdAt,
      startedAt,
      completedAt,
      leadMs: completedAt !== null ? completedAt - createdAt : null,
      cycleMs: completedAt !== null && startedAt !== null ? completedAt - startedAt : null,
      ageMs: completedAt === null ? now - createdAt : null,
      moveCount: Math.max(0, segments.length - 1),
      reopenCount: segments.filter((s) => s.kind === 'reopened').length,
      timeIn,
    },
  };
}

function statusAt(row: TimelineRow, t: number): QuestStatus | null {
  let current: QuestStatus | null = null;
  for (const s of row.segments) {
    if (s.start > t) break;
    current = s.status;
  }
  return current;
}

export function buildTimeline(data: CampaignTimelineData, now: number): TimelineModel {
  const eventsByQuest = new Map<string, TimelineEvent[]>();
  for (const event of data.events) {
    const list = eventsByQuest.get(event.questId) ?? [];
    list.push(event);
    eventsByQuest.set(event.questId, list);
  }

  const rows = data.quests.map((q) => buildRow(q, eventsByQuest.get(q.id) ?? [], now));

  // Range: campaign start (or earliest move) → today, whole days.
  const campaignStart = data.campaign.created_at ? new Date(data.campaign.created_at).getTime() : now;
  const earliest = Math.min(campaignStart, ...rows.map((r) => r.metrics.createdAt));
  const latest = Math.max(now, ...rows.flatMap((r) => r.segments.map((s) => s.start)));
  const rangeStart = startOfDay(earliest);
  const rangeEnd = addDays(startOfDay(latest), 1);

  // Per-day flow + activity.
  const days: TimelineDay[] = [];
  const todayStart = startOfDay(now);
  for (let d = rangeStart; d < rangeEnd; d = addDays(d, 1)) {
    const next = addDays(d, 1);
    const snapshotAt = Math.min(next - 1, now);
    const counts = emptyStatusRecord();
    for (const row of rows) {
      const s = statusAt(row, snapshotAt);
      if (s) counts[s] += 1;
    }
    const weekday = new Date(d).getDay();
    days.push({
      start: d,
      snapshotAt,
      isToday: d === todayStart,
      isWeekend: weekday === 0 || weekday === 6,
      counts,
      activity: emptyActivity(),
      moves: [],
    });
  }

  for (const row of rows) {
    for (const s of row.segments) {
      const index = days.findIndex(
        (day, i) => s.start >= day.start && (i === days.length - 1 || s.start < days[i + 1].start)
      );
      if (index === -1) continue;
      days[index].activity[s.kind] += 1;
      days[index].moves.push({
        questTitle: row.quest.title,
        from: s.enteredFrom,
        to: s.status,
        at: s.start,
        kind: s.kind,
      });
    }
  }
  for (const day of days) day.moves.sort((a, b) => a.at - b.at);

  // Summary.
  const byStatus = emptyStatusRecord();
  for (const row of rows) byStatus[row.status] += 1;
  const wip = rows
    .filter((r) => r.status === 'in-progress')
    .map((r) => ({ title: r.quest.title, ms: now - (r.segments.at(-1)?.start ?? now) }))
    .sort((a, b) => b.ms - a.ms);
  const allMoves = rows.flatMap((r) => r.segments.filter((s) => s.kind !== 'created'));

  const summary: TimelineSummary = {
    total: rows.length,
    byStatus,
    completionRate: rows.length ? byStatus.completed / rows.length : 0,
    avgLeadMs: average(rows.flatMap((r) => (r.metrics.leadMs !== null ? [r.metrics.leadMs] : []))),
    avgCycleMs: average(rows.flatMap((r) => (r.metrics.cycleMs !== null ? [r.metrics.cycleMs] : []))),
    oldestWip: wip[0] ?? null,
    movesLast7d: allMoves.filter((s) => s.start >= now - 7 * DAY_MS).length,
    reopenCount: rows.reduce((n, r) => n + r.metrics.reopenCount, 0),
    lastActivityAt: rows.length ? Math.max(...rows.flatMap((r) => r.segments.map((s) => s.start))) : null,
  };

  return { rangeStart, rangeEnd, now, rows, days, summary, hasInferred: rows.some((r) => r.hasInferred) };
}

// ----------------------------------------------------------------------------
// View helpers (sorting / filtering)
// ----------------------------------------------------------------------------
export type TimelineSort = 'created' | 'status' | 'lead';

export function sortRows(rows: TimelineRow[], sort: TimelineSort): TimelineRow[] {
  const copy = [...rows];
  switch (sort) {
    case 'status':
      return copy.sort(
        (a, b) =>
          STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.metrics.createdAt - b.metrics.createdAt
      );
    case 'lead':
      // Longest-running first: lead time for done quests, age for open ones.
      return copy.sort(
        (a, b) => (b.metrics.leadMs ?? b.metrics.ageMs ?? 0) - (a.metrics.leadMs ?? a.metrics.ageMs ?? 0)
      );
    default:
      return copy.sort((a, b) => a.metrics.createdAt - b.metrics.createdAt);
  }
}
