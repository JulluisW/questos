import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1c120c] p-6 text-center">
      <p className="font-serif text-xs font-semibold tracking-widest text-amber-500 uppercase">Lost in the wilds</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-amber-50">This path leads nowhere</h1>
      <p className="mt-2 max-w-sm text-sm text-stone-400">The page you were looking for does not exist.</p>
      <Link href="/dashboard" className={buttonVariants({ className: 'mt-6' })}>
        Return to the Command Center
      </Link>
    </div>
  );
}
