'use client';

import { useState, useTransition } from 'react';
import { Archive, CheckCircle2, RotateCcw, Trash2 } from 'lucide-react';
import { deleteCampaignAction, setCampaignStatusAction } from '@/actions/campaigns';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Notice } from '@/components/ui/notice';
import type { CampaignStatus } from '@/types';

type CampaignActionsProps = {
  campaignId: string;
  campaignName: string;
  status: CampaignStatus;
  canDelete: boolean;
};

export function CampaignActions({ campaignId, campaignName, status, canDelete }: CampaignActionsProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const setStatus = (next: CampaignStatus) =>
    startTransition(async () => {
      const result = await setCampaignStatusAction(campaignId, next);
      setError(result && !result.ok ? result.error : null);
    });

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {status === 'active' ? (
          <>
            <Button variant="secondary" size="sm" disabled={pending} onClick={() => setStatus('completed')}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Complete
            </Button>
            <Button variant="secondary" size="sm" disabled={pending} onClick={() => setStatus('archived')}>
              <Archive className="h-3.5 w-3.5" /> Archive
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="sm" disabled={pending} onClick={() => setStatus('active')}>
            <RotateCcw className="h-3.5 w-3.5" /> Reopen
          </Button>
        )}
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete campaign"
            title="Delete campaign"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4 text-red-800" />
          </Button>
        )}
      </div>
      {error && (
        <Notice tone="error" onDismiss={() => setError(null)}>
          {error}
        </Notice>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete campaign?"
        description={
          <>
            <strong>{campaignName}</strong> and all of its quests will be permanently deleted. Archive it instead if you
            might need it later.
          </>
        }
        confirmLabel="Delete forever"
        onConfirm={() => deleteCampaignAction(campaignId)}
      />
    </div>
  );
}
