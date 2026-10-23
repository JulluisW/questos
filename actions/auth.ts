'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type AuthState = {
  error?: string;
};

export async function loginWithEmail(_prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // 1. Initialize the secure SERVER client
  const supabase = await createClient();

  // 2. Attempt login
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/board');
}

export async function signUpWithEmail(_prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const username = formData.get('username') as string;
  const full_name = formData.get('full_name') as string;

  if (!email || !password) {
    return { error: 'Email and password are required to forge an account.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username || email.split('@')[0],
        full_name: full_name || null,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/login?message=Account forged successfully. Please sign in.');
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
