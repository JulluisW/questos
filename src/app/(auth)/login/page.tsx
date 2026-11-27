import { safeNextPath } from '@/lib/utils';
import { LoginForm } from './_components/login-form';

export const metadata = { title: 'Sign in', alternates: { canonical: '/login' } };

// Notices are looked up by code so the URL can't inject arbitrary text.
const NOTICES: Record<string, string> = {
  'check-email': 'Account forged! Check your inbox to confirm your email, then sign in.',
  'signed-out': 'You have left the tavern. Until next time.',
};

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { notice, next } = await searchParams;
  const nextPath = typeof next === 'string' ? safeNextPath(next, '') : '';

  return (
    <LoginForm notice={typeof notice === 'string' ? NOTICES[notice] : undefined} next={nextPath || undefined} />
  );
}
