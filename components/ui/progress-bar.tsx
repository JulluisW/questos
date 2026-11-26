import { cn } from '@/lib/utils';

type ProgressBarProps = {
  value: number; // 0-100
  label: string;
  className?: string;
};

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-[#ebdcca]', className)}
    >
      <div className="h-full rounded-full bg-amber-700 transition-all duration-500" style={{ width: `${clamped}%` }} />
    </div>
  );
}
