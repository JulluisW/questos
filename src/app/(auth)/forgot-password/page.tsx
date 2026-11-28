import { RESET_LINK_EXPIRED } from '@/lib/auth-constants';
import { ForgotPasswordForm } from './_components/forgot-password-form';

export const metadata = { title: 'Reset password', alternates: { canonical: '/forgot-password' } };

// Looked up by code so the URL can't inject arbitrary text.
const ERRORS: Record<string, string> = {
  'link-expired': RESET_LINK_EXPIRED,
};

export default async function ForgotPasswordPage({ searchParams }: PageProps<'/forgot-password'>) {
  const { error } = await searchParams;
  const linkError = typeof error === 'string' && Object.hasOwn(ERRORS, error) ? ERRORS[error] : undefined;
  return <ForgotPasswordForm linkError={linkError} />;
}
