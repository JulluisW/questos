'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ParchmentDialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import type { ActionState } from '@/types';

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  /** Return an ActionState; the dialog closes on success and shows errors inline. */
  onConfirm: () => Promise<ActionState | void>;
  onSuccess?: () => void;
};

export function ConfirmDialog({ open, onClose, title, description, confirmLabel, onConfirm, onSuccess }: ConfirmDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const close = () => {
    setError(null);
    onClose();
  };

  return (
    <ParchmentDialog open={open} onClose={close} title={title} icon={<AlertTriangle className="h-4 w-4" />}>
      <div className="space-y-4 p-6">
        {error && <Notice tone="error">{error}</Notice>}
        <div className="text-sm text-stone-700">{description}</div>
        <div className="flex justify-end gap-2 border-t border-[#d8ccbc]/60 pt-4">
          <Button variant="ghost" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            data-autofocus
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await onConfirm();
                if (result && !result.ok) {
                  setError(result.error);
                  return;
                }
                setError(null);
                onSuccess?.();
                onClose();
              })
            }
          >
            {pending ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </ParchmentDialog>
  );
}
