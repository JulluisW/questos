'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/utils';
import { formToObject } from '@/lib/validation';

export type AuthState = { error?: string } | null;

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
  next: z.string().optional(),
});

const signupSchema = z
  .object({
    email: z.email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
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
