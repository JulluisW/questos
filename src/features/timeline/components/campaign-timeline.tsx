'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Tooltip } from '@base-ui/react/tooltip';
import { Award, Check, Info } from 'lucide-react';
import type { QuestStatus } from '@/types';
import { cn } from '@/lib/utils';
import type { CampaignTimelineData } from '../types';
import { buildTimeline, DAY_MS, sortRows, type TimelineModel, type TimelineRow, type TimelineSort } from '../build';
import { formatDay, formatDuration, formatMonth } from '../format';
import { STATUS_ORDER, STATUS_THEME } from '../status-theme';
import { TimelineSummary } from './timeline-summary';
import { DayTooltip, SegmentTooltip } from './timeline-tooltip-content';

// ----------------------------------------------------------------------------
// Layout constants
// ----------------------------------------------------------------------------
const LABEL_W = 248;
const LABEL_W_COMPACT = 150;
const AXIS_H = 40;
const FLOW_H = 88;
const ACTIVITY_H = 26;
const LANE_H = 46;

const ZOOMS = [
  { id: 'days', label: 'Days', dayWidth: 64 },
  { id: 'weeks', label: 'Weeks', dayWidth: 24 },
  { id: 'months', label: 'Months', dayWidth: 8 },
] as const;
type ZoomId = (typeof ZOOMS)[number]['id'];

const SORTS: { id: TimelineSort; label: string }[] = [
  { id: 'created', label: 'Posted date' },
  { id: 'status', label: 'Current status' },
  { id: 'lead', label: 'Longest running' },
];

type TipPayload = { kind: 'segment'; rowId: string; segmentIndex: number } | { kind: 'day'; dayIndex: number };

// Dates depend on the viewer's timezone and "now", so render on the client only.
const subscribeNoop = () => () => {};

export function CampaignTimeline({ data }: { data: CampaignTimelineData }) {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
  return mounted ? <TimelineView data={data} /> : <TimelineSkeleton />;
}

function TimelineView({ data }: { data: CampaignTimelineData }) {
  const [now] = useState(() => Date.now());
  const model = useMemo(() => buildTimeline(data, now), [data, now]);

  const [zoom, setZoom] = useState<ZoomId>(() =>
    model.days.length <= 16 ? 'days' : model.days.length <= 60 ? 'weeks' : 'months'
  );
  const [sort, setSort] = useState<TimelineSort>('created');
  const [visible, setVisible] = useState<Set<QuestStatus>>(() => new Set(STATUS_ORDER));
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [tip] = useState(() => Tooltip.createHandle<TipPayload>());

  // Stretch short campaigns to fill the canvas; long ones scroll horizontally.
  const [canvasW, setCanvasW] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setCanvasW(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const minDayWidth = ZOOMS.find((z) => z.id === zoom)!.dayWidth;
  const labelW = canvasW > 0 && canvasW < 560 ? LABEL_W_COMPACT : LABEL_W;
  const fitDayWidth = canvasW > labelW ? (canvasW - labelW) / model.days.length : 0;
  const dayWidth = Math.max(minDayWidth, fitDayWidth);
  const trackW = model.days.length * dayWidth;
  const x = (t: number) => ((t - model.rangeStart) / DAY_MS) * dayWidth;

  const rows = useMemo(
    () =>
      sortRows(
        model.rows.filter((r) => visible.has(r.status)),
        sort
      ),
    [model.rows, visible, sort]
  );
  const rowById = useMemo(() => new Map(model.rows.map((r) => [r.quest.id, r])), [model.rows]);

  const toggleStatus = (status: QuestStatus) =>
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(status) && next.size > 1) next.delete(status);
      else next.add(status);
      return next;
    });

  if (model.rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d8ccbc] bg-[#fcf8f2] px-6 py-16 text-center">
        <p className="font-serif text-lg font-semibold text-[#1c120c]">No quests posted yet</p>
        <p className="mt-1 text-sm text-stone-500">
          The timeline fills in as quests are posted and moved across the board.
        </p>
        <Link
          href={`/board/${data.campaign.id}`}
          className="mt-4 rounded border border-[#52372a] bg-[#3d271d] px-4 py-2 text-xs font-bold tracking-wider text-[#fbf8f3] uppercase"
        >
          Go to board
        </Link>
      </div>
    );
  }

  return (
    <Tooltip.Provider delay={120} closeDelay={40}>
      <div className="flex flex-col gap-5">
        <TimelineSummary summary={model.summary} now={now} />

        {data.historySource === 'derived' && (
          <Notice>
            Move history isn&apos;t being recorded yet, so only posted and completed dates are shown. Apply the{' '}
            <code className="rounded bg-amber-900/10 px-1">quest_status_events</code> migration to track every card
            move.
          </Notice>
        )}

        {/* Controls + legend */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Segmented value={zoom} onChange={setZoom} options={ZOOMS.map((z) => ({ id: z.id, label: z.label }))} />
            <label className="flex items-center gap-1.5 text-xs text-stone-600">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as TimelineSort)}
                className="rounded border border-[#d8ccbc] bg-[#f2ebdf] px-2 py-1.5 font-serif text-xs font-semibold text-stone-800 shadow-sm"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by current status">
            {STATUS_ORDER.map((status) => {
              const on = visible.has(status);
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleStatus(status)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition',
                    on
                      ? 'border-[#d8ccbc] bg-[#fcf8f2] text-stone-800 shadow-sm'
                      : 'border-transparent text-stone-400 line-through'
                  )}
                >
                  <span
                    className={cn('h-2.5 w-2.5 rounded-sm border', STATUS_THEME[status].swatch, !on && 'opacity-40')}
                  />
                  {STATUS_THEME[status].label}
                  <span className="text-stone-400">{model.summary.byStatus[status]}</span>
                </button>
              );
            })}
            {model.hasInferred && (
              <span className="ml-1 flex items-center gap-1.5 text-[11px] text-stone-500">
                <span className="h-2.5 w-4 rounded-sm border border-dashed border-stone-500" /> Estimated
              </span>
            )}
          </div>
        </div>

        {/* Timeline canvas */}
        <div ref={canvasRef} className="overflow-x-auto rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] shadow-sm">
          <div className="relative" style={{ width: labelW + trackW, ['--label-w' as string]: `${labelW}px` }}>
            <GridLayer model={model} x={x} dayWidth={dayWidth} hoveredDay={hoveredDay} />

            {/* Axis */}
            <div className="relative flex border-b border-[#e2d5c3]" style={{ height: AXIS_H }}>
              <StickyLabel className="items-end pb-2">
                <span className="text-[10px] font-semibold tracking-widest text-amber-800 uppercase">
                  {formatDay(model.rangeStart)} – {formatDay(model.now)}
                </span>
              </StickyLabel>
              <Axis model={model} x={x} dayWidth={dayWidth} />
            </div>

            {/* Campaign flow (cumulative flow diagram) — shares the axis with the lanes */}
            <div className="relative flex border-b border-[#e2d5c3]" style={{ height: FLOW_H }}>
              <StickyLabel className="flex-col justify-center gap-0.5">
                <span className="font-serif text-xs font-semibold text-stone-800">Campaign flow</span>
                <span className="text-[10px] leading-tight text-stone-500">
                  Quests per stage at the end of each day
                </span>
              </StickyLabel>
              <FlowChart model={model} dayWidth={dayWidth} />
            </div>

            {/* Daily activity */}
            <div className="relative flex border-b-2 border-[#d8ccbc]" style={{ height: ACTIVITY_H }}>
              <StickyLabel className="items-center">
                <span className="text-[10px] font-semibold tracking-widest text-stone-500 uppercase">Card moves</span>
              </StickyLabel>
              <ActivityStrip model={model} dayWidth={dayWidth} />
            </div>

            {/* Day hover targets span flow + activity; they drive the cross-lane guide. */}
            <div className="absolute flex" style={{ top: AXIS_H, left: 'var(--label-w)', height: FLOW_H + ACTIVITY_H }}>
              {model.days.map((day, i) => (
                <Tooltip.Trigger
                  key={day.start}
                  handle={tip}
                  payload={{ kind: 'day', dayIndex: i }}
                  aria-label={`${formatDay(day.start)}: ${day.moves.length} moves`}
                  onMouseEnter={() => setHoveredDay(i)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onFocus={() => setHoveredDay(i)}
                  onBlur={() => setHoveredDay(null)}
                  className="h-full shrink-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-700"
                  style={{ width: dayWidth }}
                />
              ))}
            </div>

            {/* Quest lanes */}
            <ul aria-label="Quest lanes">
              {rows.map((row) => (
                <Lane key={row.quest.id} row={row} x={x} trackW={trackW} tip={tip} />
              ))}
            </ul>

            <TodayLine left={labelW + x(model.now)} />
          </div>
        </div>
      </div>

      {/* One shared popup for every trigger (detached-trigger pattern) */}
      <Tooltip.Root handle={tip}>
        {({ payload }) => (
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={10} collisionPadding={12} className="z-50">
              <Tooltip.Popup className="origin-(--transform-origin) rounded-lg border border-amber-900/60 bg-[#1f140f] p-3.5 text-amber-50 shadow-[0_18px_40px_rgba(0,0,0,0.45)] transition-[transform,opacity] duration-100 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-instant:transition-none data-starting-style:scale-[0.98] data-starting-style:opacity-0">
                {payload?.kind === 'segment' && rowById.get(payload.rowId) ? (
                  <SegmentTooltip
                    row={rowById.get(payload.rowId)!}
                    segmentIndex={payload.segmentIndex}
                    people={data.people}
                  />
                ) : payload?.kind === 'day' && model.days[payload.dayIndex] ? (
                  <DayTooltip day={model.days[payload.dayIndex]} />
                ) : null}
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

// ----------------------------------------------------------------------------
// Pieces
// ----------------------------------------------------------------------------
function StickyLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'sticky left-0 z-20 flex shrink-0 overflow-hidden border-r border-[#e2d5c3] bg-[#fcf8f2] px-3 sm:px-4',
        className
      )}
      style={{ width: 'var(--label-w)' }}
    >
      {children}
    </div>
  );
}

function Axis({ model, x, dayWidth }: { model: TimelineModel; x: (t: number) => number; dayWidth: number }) {
  return (
    <div className="relative shrink-0" style={{ width: model.days.length * dayWidth }}>
      {model.days.map((day) => {
        const d = new Date(day.start);
        const firstOfMonth = d.getDate() === 1 || day.start === model.rangeStart;
        const isMonday = d.getDay() === 1;
        const showDay = dayWidth >= 18 || isMonday;
        if (!showDay && !firstOfMonth) return null;
        return (
          <div
            key={day.start}
            className="absolute top-0 bottom-0 flex flex-col justify-end pb-1.5 pl-1.5"
            style={{ left: x(day.start) }}
          >
            {firstOfMonth && (
              <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold whitespace-nowrap text-amber-800">
                {formatMonth(day.start)}
              </span>
            )}
            {showDay && (
              <span
                className={cn(
                  'text-[10px] whitespace-nowrap tabular-nums',
                  day.isToday ? 'font-bold text-red-800' : day.isWeekend ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                {dayWidth >= 44 ? d.toLocaleDateString(undefined, { weekday: 'short' }) + ' ' : ''}
                {d.getDate()}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GridLayer({
  model,
  x,
  dayWidth,
  hoveredDay,
}: {
  model: TimelineModel;
  x: (t: number) => number;
  dayWidth: number;
  hoveredDay: number | null;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 bottom-0"
      style={{ left: 'var(--label-w)', width: model.days.length * dayWidth }}
    >
      {model.days.map((day, i) => {
        const showLine = dayWidth >= 18 || new Date(day.start).getDay() === 1;
        return (
          <div
            key={day.start}
            className={cn(
              'absolute top-0 bottom-0',
              showLine && 'border-l border-[#efe4d3]',
              day.isWeekend && 'bg-[#f3eadb]/60',
              hoveredDay === i && 'bg-amber-500/12'
            )}
            style={{ left: x(day.start), width: dayWidth }}
          />
        );
      })}
    </div>
  );
}

function TodayLine({ left }: { left: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 bottom-0 z-10 border-l-2 border-dashed border-red-800/50"
      style={{ left }}
    >
      <span className="absolute top-0 -translate-x-1/2 rounded-b bg-red-800 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase">
        Today
      </span>
    </div>
  );
}

/** Stacked area chart: completed at the bottom, then in progress, then pending. */
function FlowChart({ model, dayWidth }: { model: TimelineModel; dayWidth: number }) {
  const w = model.days.length * dayWidth;
  const pad = 8;
  const h = FLOW_H - pad * 2;
  const max = Math.max(1, ...model.days.map((d) => STATUS_ORDER.reduce((n, s) => n + d.counts[s], 0)));
  const layers: QuestStatus[] = ['completed', 'in-progress', 'pending'];

  // x at the end of each day (snapshot time), starting from 0 at range start.
  const xs = [0, ...model.days.map((_, i) => (i + 1) * dayWidth)];
  const valuesAt = (i: number) => model.days[Math.max(0, i - 1)].counts;

  const paths = layers.map((status, li) => {
    const below = layers.slice(0, li);
    const top = xs.map((px, i) => {
      const c = valuesAt(i);
      const v = [...below, status].reduce((n, s) => n + c[s], 0);
      return `${px},${pad + h - (v / max) * h}`;
    });
    const bottom = xs
      .map((px, i) => {
        const c = valuesAt(i);
        const v = below.reduce((n, s) => n + c[s], 0);
        return `${px},${pad + h - (v / max) * h}`;
      })
      .reverse();
    return { status, d: `M${top.join('L')}L${bottom.join('L')}Z` };
  });

  return (
    <svg width={w} height={FLOW_H} className="shrink-0" aria-hidden>
      {paths.map((p) => (
        <path
          key={p.status}
          d={p.d}
          fill={STATUS_THEME[p.status].fill}
          fillOpacity={p.status === 'pending' ? 0.75 : 0.85}
          stroke={STATUS_THEME[p.status].stroke}
          strokeOpacity={0.5}
          strokeWidth={1}
        />
      ))}
      <text x={4} y={pad + 8} className="fill-stone-400 text-[9px]">
        {max}
      </text>
    </svg>
  );
}

function ActivityStrip({ model, dayWidth }: { model: TimelineModel; dayWidth: number }) {
  const max = Math.max(1, ...model.days.map((d) => d.moves.length));
  const order = ['completed', 'started', 'reopened', 'moved', 'created'] as const;
  const color: Record<(typeof order)[number], string> = {
    completed: STATUS_THEME.completed.fill,
    started: STATUS_THEME['in-progress'].fill,
    reopened: '#b45309',
    moved: '#a8a29e',
    created: STATUS_THEME.pending.stroke,
  };
  const barW = Math.max(3, Math.min(18, dayWidth - 6));

  return (
    <div className="relative shrink-0" style={{ width: model.days.length * dayWidth }} aria-hidden>
      {model.days.map((day, i) =>
        day.moves.length ? (
          <div
            key={day.start}
            className="absolute bottom-1 flex flex-col-reverse overflow-hidden rounded-xs"
            style={{
              left: i * dayWidth + (dayWidth - barW) / 2,
              width: barW,
              height: (day.moves.length / max) * (ACTIVITY_H - 6),
            }}
          >
            {order.map((k) =>
              day.activity[k] ? <div key={k} style={{ flexGrow: day.activity[k], background: color[k] }} /> : null
            )}
          </div>
        ) : null
      )}
    </div>
  );
}

function Lane({
  row,
  x,
  trackW,
  tip,
}: {
  row: TimelineRow;
  x: (t: number) => number;
  trackW: number;
  tip: ReturnType<typeof Tooltip.createHandle<TipPayload>>;
}) {
  const { quest, metrics, status } = row;

  return (
    <li
      className="group relative flex border-b border-[#efe4d3] last:border-b-0 hover:bg-amber-900/3"
      style={{ height: LANE_H }}
    >
      <StickyLabel className="flex-col justify-center gap-0.5 group-hover:bg-[#f7f0e3]">
        <div className="flex min-w-0 items-center gap-1.5">
          {quest.is_milestone && <Award className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-label="Milestone" />}
          <span className="truncate font-serif text-[13px] font-semibold text-[#1c120c]" title={quest.title}>
            {quest.title}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-[10px] whitespace-nowrap text-stone-500">
          <span
            className={cn(
              'shrink-0 rounded-sm border px-1 font-semibold tracking-wider uppercase',
              STATUS_THEME[status].pill
            )}
          >
            {STATUS_THEME[status].label}
          </span>
          <span className="truncate tabular-nums">
            {metrics.leadMs !== null
              ? `Done in ${formatDuration(metrics.leadMs)}`
              : `Open ${formatDuration(metrics.ageMs)}`}
          </span>
        </div>
      </StickyLabel>

      <div className="relative shrink-0" style={{ width: trackW }}>
        {row.segments.map((seg, i) => {
          const left = x(seg.start);
          const width = Math.max(x(seg.end) - left, 4);
          const isDone = seg.status === 'completed';
          const theme = STATUS_THEME[seg.status];
          return (
            <Tooltip.Trigger
              key={i}
              handle={tip}
              payload={{ kind: 'segment', rowId: quest.id, segmentIndex: i }}
              aria-label={`${quest.title}: ${theme.label} for ${formatDuration(seg.end - seg.start)}`}
              className="group/seg absolute top-1/2 flex h-6 -translate-y-1/2 items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-700"
              style={{ left, width }}
            >
              {isDone ? (
                <>
                  <span
                    className="absolute inset-x-0 top-1/2 h-0.75 -translate-y-1/2 rounded-full opacity-40"
                    style={{ background: theme.fill }}
                  />
                  <span
                    className="relative -ml-2 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 shadow-sm transition-transform group-hover/seg:scale-110"
                    style={{ background: theme.fill, borderColor: theme.stroke }}
                  >
                    <Check className="h-2.5 w-2.5 text-amber-50" strokeWidth={3} />
                  </span>
                </>
              ) : (
                <span
                  className={cn(
                    'block w-full rounded-sm border shadow-xs transition group-hover/seg:shadow-md group-hover/seg:brightness-110',
                    seg.status === 'pending' ? 'h-3.5' : 'h-4.5',
                    seg.inferred && 'border-dashed opacity-75',
                    seg.ongoing && 'rounded-r-none'
                  )}
                  style={{
                    background:
                      seg.status === 'pending'
                        ? `repeating-linear-gradient(135deg, ${theme.fill}, ${theme.fill} 4px, #dbe3ef 4px, #dbe3ef 8px)`
                        : theme.fill,
                    borderColor: theme.stroke,
                    maskImage: seg.ongoing
                      ? 'linear-gradient(to right, #000 calc(100% - 14px), transparent)'
                      : undefined,
                  }}
                />
              )}
            </Tooltip.Trigger>
          );
        })}
      </div>
    </li>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div
      className="flex rounded border border-[#d8ccbc] bg-[#f2ebdf] p-0.5 shadow-sm"
      role="radiogroup"
      aria-label="Zoom"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'rounded-sm px-3 py-1 font-serif text-xs font-semibold transition',
            value === o.id ? 'bg-[#3d271d] text-[#fbf8f3] shadow' : 'text-stone-600 hover:text-stone-900'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-amber-700/30 bg-amber-100/50 px-3.5 py-2.5 text-xs text-amber-900">
      <Info className="mt-px h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-5" aria-busy aria-label="Loading timeline">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-24 rounded-lg border border-[#e2d5c3] bg-[#f3eadb]" />
        ))}
      </div>
      <div className="h-8 w-80 rounded bg-[#f3eadb]" />
      <div className="h-96 rounded-lg border border-[#e2d5c3] bg-[#f3eadb]" />
    </div>
  );
}
