import { LoginForm } from './_components/login-form';

type LoginPageProps = {
  searchParams: Promise<{ message?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { message, error } = await searchParams;
  return <LoginForm message={message} errorMessage={error} />;
}
