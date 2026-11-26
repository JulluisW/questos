import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const TONES = {
  error: { box: 'border-red-900/30 bg-red-50 text-red-950', icon: AlertTriangle, iconClass: 'text-red-800' },
  success: { box: 'border-emerald-800/30 bg-emerald-50 text-emerald-950', icon: CheckCircle2, iconClass: 'text-emerald-700' },
  info: { box: 'border-amber-800/30 bg-amber-50 text-amber-950', icon: Info, iconClass: 'text-amber-700' },
} as const;

type NoticeProps = {
  tone?: keyof typeof TONES;
  children: React.ReactNode;
  onDismiss?: () => void;
  action?: React.ReactNode;
  className?: string;
};

export function Notice({ tone = 'info', children, onDismiss, action, className }: NoticeProps) {
  const t = TONES[tone];
  const Icon = t.icon;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2 rounded border p-3 font-sans text-xs font-medium', t.box, className)}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', t.iconClass)} aria-hidden />
      <div className="flex-1">{children}</div>
      {action}
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="rounded p-0.5 opacity-60 hover:opacity-100">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
