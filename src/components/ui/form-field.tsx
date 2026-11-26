import { cn } from '@/lib/utils';

export const inputClass =
  'w-full rounded border border-[#d3c8ba] bg-[#f5f1ea] px-3.5 py-2.5 font-sans text-sm text-[#1c120c] placeholder-stone-400 transition-all focus:border-amber-800 focus:ring-2 focus:ring-amber-800/20 focus:outline-none disabled:opacity-60';

type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: React.ReactNode;
  optional?: boolean;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function FormField({ label, htmlFor, error, hint, optional, required, className, children }: FormFieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 flex items-center justify-between font-sans text-[10px] font-bold tracking-widest text-[#403026] uppercase"
      >
        <span>
          {label} {required && <span className="text-amber-800">*</span>}
          {optional && <span className="font-normal tracking-normal text-stone-400 normal-case">(optional)</span>}
        </span>
        {hint && <span className="font-normal tracking-normal text-stone-400 normal-case">{hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className={cn('mt-1 font-sans text-xs font-medium text-red-800')}>
          {error}
        </p>
      )}
    </div>
  );
}
