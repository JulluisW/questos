import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { RESET_LINK_EXPIRED } from '@/lib/auth-constants';
import { Notice } from '@/components/ui/notice';
import { ResetPasswordForm } from './_components/reset-password-form';

export const metadata = { title: 'Choose a new password', robots: { index: false, follow: false } };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <div className="bg-parchment relative flex w-full flex-col justify-center p-8 font-sans text-[#1c120c] md:w-1/2 md:p-12 lg:p-16">
        <div className="relative z-10 mx-auto w-full max-w-md space-y-6">
          <h1 className="font-serif text-2xl leading-tight font-bold text-[#1a0f0a] md:text-3xl">Link expired</h1>
          <Notice tone="error">{RESET_LINK_EXPIRED}</Notice>
          <Link
            href="/forgot-password"
            className="block text-center font-serif text-sm font-bold text-amber-800 underline transition-colors hover:text-amber-950"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return <ResetPasswordForm />;
}
