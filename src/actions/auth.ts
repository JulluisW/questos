'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { PASSWORD_MIN, RESET_LINK_EXPIRED } from '@/lib/auth-constants';
import { siteUrl } from '@/lib/site';
import { safeNextPath } from '@/lib/utils';
import { formToObject, newPasswordSchema, passwordResetRequestSchema } from '@/lib/validation';

export type AuthState = { error?: string; message?: string } | null;

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
  next: z.string().optional(),
});

const signupSchema = z
  .object({
    email: z.email('Enter a valid email address'),
    password: z.string().min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`),
    confirmPassword: z.string(),
    username: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9_]{3,30}$/, 'Username: 3-30 letters, numbers or underscores')
      .optional()
      .or(z.literal('')),
    full_name: z.string().trim().max(80, 'Full name is too long').optional(),
    next: z.string().optional(),
  })
  .refine((v) => v.password === v.confirmPassword, { message: 'Passwords do not match.' });

export async function loginWithEmail(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      error: /email not confirmed/i.test(error.message)
        ? 'Please confirm your email first. Check your inbox for the link.'
        : 'Invalid email or password.',
    };
  }

  redirect(safeNextPath(parsed.data.next));
}

export async function signUpWithEmail(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { email, password, username, full_name, next } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username || email.split('@')[0],
        full_name: full_name || null,
      },
    },
  });

  if (error) return { error: error.message };

  // Email confirmation disabled -> already signed in.
  if (data.session) redirect(safeNextPath(next));

  const params = new URLSearchParams({ notice: 'check-email' });
  if (next) params.set('next', safeNextPath(next));
  redirect(`/login?${params.toString()}`);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login?notice=signed-out');
}

const RESET_SENT = 'A reset link is on its way. Check your inbox.';
const NO_ACCOUNT = 'No account found. Check your mobile number or email address and try again.';
const RESET_FAILED = "Couldn't send the reset email right now. Try again later.";

export async function requestPasswordResetAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = passwordResetRequestSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // 📌 READ-ME: the link target comes from siteUrl, never from the request's
  // Host header, so a forged Host cannot point reset emails at another site.
  const redirectTo = new URL('/auth/callback?next=/reset-password', siteUrl).toString();

  const supabase = await createClient();

  // Telling visitors "No account found" is a deliberate product choice
  // (2026-11-28): it reveals whether an email has an account.
  const { data: exists, error: lookupError } = await supabase.rpc('account_exists_for_email', {
    p_email: parsed.data.email,
  });
  if (lookupError) {
    console.error('[auth] account_exists_for_email failed:', lookupError.message);
    return { error: RESET_FAILED };
  }
  if (!exists) return { error: NO_ACCOUNT };

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });

  if (error) {
    if (error.status === 429) return { error: 'Too many reset requests. Wait a minute and try again.' };
    console.error('[auth] resetPasswordForEmail failed:', error.message);
    return { error: RESET_FAILED };
  }

  return { message: RESET_SENT };
}

export async function updatePasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = newPasswordSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: RESET_LINK_EXPIRED };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === 'same_password') return { error: 'Choose a password different from your current one.' };
    if (error.code === 'weak_password') return { error: 'That password is too weak. Try a longer one.' };
    console.error('[auth] updateUser(password) failed:', error.message);
    return { error: "Couldn't save the new password. Try again." };
  }

  // Sign out everywhere (the default global scope), so the recovery session
  // and any session on another device must use the new password.
  await supabase.auth.signOut();
  redirect('/login?notice=password-updated');
}
