import { cn } from '@/lib/utils';

type EmptyStateProps = {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d3c8ba] bg-[#f5f0e6]/60 p-10 text-center',
        className
      )}
    >
      {icon && <div className="mb-3 text-amber-800/70">{icon}</div>}
      <h3 className="font-serif text-lg font-semibold text-[#1c120c]">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-stone-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
