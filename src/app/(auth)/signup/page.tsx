import { safeNextPath } from '@/lib/utils';
import { SignUpForm } from './_components/signup-form';

export const metadata = { title: 'Create account' };

export default async function SignUpPage({ searchParams }: PageProps<'/signup'>) {
  const { next } = await searchParams;
  const nextPath = typeof next === 'string' ? safeNextPath(next, '') : '';
  return <SignUpForm next={nextPath || undefined} />;
}
