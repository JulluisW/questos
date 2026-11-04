import { Activity, Hourglass, Route, Swords, Trophy } from 'lucide-react';
import type { TimelineSummary as Summary } from '../build';
import { formatAgo, formatDuration } from '../format';
import { STATUS_ORDER, STATUS_THEME } from '../status-theme';

type Props = { summary: Summary; now: number };

export function TimelineSummary({ summary, now }: Props) {
  const pct = Math.round(summary.completionRate * 100);

  return (
    <section aria-label="Campaign summary" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Tile icon={<Trophy className="h-3.5 w-3.5" />} label="Progress" className="col-span-2 lg:col-span-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-2xl font-semibold text-[#1c120c]">{pct}%</span>
          <span className="text-xs text-stone-500">
            {summary.byStatus.completed} / {summary.total} done
          </span>
        </div>
        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-[#ebdcca]" aria-hidden>
          {[...STATUS_ORDER].reverse().map((status) =>
            summary.byStatus[status] ? (
              <div
                key={status}
                style={{
                  width: `${(summary.byStatus[status] / summary.total) * 100}%`,
                  background: STATUS_THEME[status].fill,
                }}
              />
            ) : null
          )}
        </div>
        <div className="mt-1.5 flex gap-3 text-[10px] text-stone-500">
          {STATUS_ORDER.map((status) => (
            <span key={status}>
              {STATUS_THEME[status].label} <b className="text-stone-700">{summary.byStatus[status]}</b>
            </span>
          ))}
        </div>
      </Tile>

      <Tile icon={<Swords className="h-3.5 w-3.5" />} label="Avg cycle time" hint="First started → completed">
        <Metric value={formatDuration(summary.avgCycleMs)} />
      </Tile>

      <Tile icon={<Route className="h-3.5 w-3.5" />} label="Avg lead time" hint="Posted → completed">
        <Metric value={formatDuration(summary.avgLeadMs)} />
      </Tile>

      <Tile icon={<Hourglass className="h-3.5 w-3.5" />} label="In progress now">
        <Metric value={String(summary.byStatus['in-progress'])} />
        <p className="mt-1 truncate text-[11px] text-stone-500" title={summary.oldestWip?.title}>
          {summary.oldestWip ? (
            <>
              Oldest: <span className="text-stone-700">{summary.oldestWip.title}</span> ·{' '}
              {formatDuration(summary.oldestWip.ms)}
            </>
          ) : (
            'Nothing on the anvil'
          )}
        </p>
      </Tile>

      <Tile icon={<Activity className="h-3.5 w-3.5" />} label="Momentum · 7 days">
        <Metric value={`${summary.movesLast7d}`} unit={summary.movesLast7d === 1 ? 'move' : 'moves'} />
        <p className="mt-1 text-[11px] text-stone-500">
          {summary.lastActivityAt ? `Last move ${formatAgo(now - summary.lastActivityAt)}` : 'No moves yet'}
          {summary.reopenCount > 0 && <span className="text-amber-800"> · {summary.reopenCount} reopened</span>}
        </p>
      </Tile>
    </section>
  );
}

function Tile({
  icon,
  label,
  hint,
  className = '',
  children,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border border-[#e2d5c3] bg-[#fcf8f2] p-3.5 shadow-sm ${className}`}>
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-amber-800 uppercase">
        {icon}
        {label}
      </div>
      {children}
      {hint && <p className="mt-1 text-[11px] text-stone-500">{hint}</p>}
    </div>
  );
}

function Metric({ value, unit }: { value: string; unit?: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="font-serif text-2xl font-semibold text-[#1c120c]">{value}</span>
      {unit && <span className="text-xs text-stone-500">{unit}</span>}
    </div>
  );
}
