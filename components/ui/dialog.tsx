'use client';

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Portal, useIsClient } from './portal';

type ParchmentDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  /** Rendered only while open, so form state inside resets on every open. */
  children: React.ReactNode;
};

export function ParchmentDialog({ open, onClose, title, subtitle, icon, className, children }: ParchmentDialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // The panel only exists in the DOM once the portal has mounted.
  const isClient = useIsClient();

  useEffect(() => {
    if (!open || !isClient) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    // Move focus into the dialog: first form field, else the panel itself.
    const first = panelRef.current?.querySelector<HTMLElement>('input, textarea, select, [data-autofocus]');
    (first ?? panelRef.current)?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, isClient, onClose]);

  if (!open) return null;

  // Portalled to <body>: inside the app shell, the page content's z-10 layer
  // kept the overlay underneath the sticky header, which stayed sharp.
  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c120c]/70 p-4 backdrop-blur-sm"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={cn(
            'relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border-2 border-[#d8ccbc] bg-[#fcf8f2] text-[#1c120c] shadow-2xl outline-none',
            className
          )}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1c120c_1px,transparent_1px)] bg-size-[16px_16px] opacity-[0.025] mix-blend-multiply" />

          <div className="relative flex items-center justify-between border-b border-[#d8ccbc] bg-[#f2ebdf] p-4">
            <div className="flex items-center gap-2">
              {icon && (
                <div className="flex h-7 w-7 items-center justify-center rounded border border-amber-800/40 bg-[#170e0a] text-amber-500">
                  {icon}
                </div>
              )}
              <div>
                <h3 id={titleId} className="font-serif text-base font-bold text-[#1c120c]">
                  {title}
                </h3>
                {subtitle && (
                  <p className="font-sans text-[10px] tracking-wider text-stone-500 uppercase">{subtitle}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded p-1 text-stone-500 transition-colors hover:bg-[#e6dcce] hover:text-[#1c120c]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative">{children}</div>
        </div>
      </div>
    </Portal>
  );
}
