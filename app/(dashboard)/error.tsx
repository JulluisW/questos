'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <p className="font-serif text-xs font-semibold tracking-widest text-amber-800 uppercase">A curse struck the realm</p>
      <h2 className="mt-2 font-serif text-2xl font-bold text-[#1c120c]">Something went wrong</h2>
      <p className="mt-2 max-w-sm text-sm text-stone-600">
        The page could not be loaded. It may be a temporary connection problem.
      </p>
      <Button className="mt-6" onClick={() => unstable_retry()}>
        Try again
      </Button>
    </div>
  );
}
