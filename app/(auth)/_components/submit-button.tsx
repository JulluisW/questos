'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 flex w-full items-center justify-center gap-2 rounded border border-[#52372a] bg-[#3d271d] px-4 py-3 text-xs font-bold tracking-widest text-[#fbf8f3] uppercase shadow transition-all duration-150 hover:bg-[#2b1b14] active:bg-[#1a0f0a] disabled:opacity-50"
    >
      {pending ? <span className="animate-pulse">Accessing Vault...</span> : <>{children}</>}
    </button>
  );
}
