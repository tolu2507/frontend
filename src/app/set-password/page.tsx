'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthShell } from '@/components/auth/AuthShell';
import { Button, ErrorBox, Input } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { homeFor, useAuth, type Session } from '@/lib/auth';

const schema = z
  .object({
    identifier: z.string().trim().min(3, 'Enter the email or phone number the code was sent to.'),
    code: z.string().trim().regex(/^\d{6}$/, 'The code has 6 digits.'),
    password: z.string().min(8, 'Use at least 8 characters.'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'The passwords don’t match.' });

/** For staff invited by their school, and for anyone who asked for a reset code. */
function SetPassword() {
  const router = useRouter();
  const params = useSearchParams();
  const signIn = useAuth((s) => s.signIn);
  const [error, setError] = useState<unknown>(null);
  const reset = params.get('mode') === 'reset';
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { identifier: params.get('email') ?? '', code: params.get('code') ?? '', password: '', confirm: '' },
  });

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      const session = await api<Session>('/auth/reset-password', { body: { identifier: v.identifier.toLowerCase(), code: v.code, password: v.password } });
      signIn(session);
      toast.success('Password saved. Welcome to Nexus!');
      router.replace(homeFor(session.user));
    } catch (e) {
      setError(e);
    }
  });

  return (
    <AuthShell
      title={reset ? 'Choose a new password' : 'Set up your account'}
      subtitle={reset ? 'Enter the 6-digit code we sent you.' : 'Your school sent you a 6-digit code by email. It works for 7 days.'}
      footer={
        <Link href="/login" className="font-bold text-violet-700 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Input label="Email or phone number" autoComplete="username" error={formState.errors.identifier?.message} {...register('identifier')} />
        <Input label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="font-display text-xl tracking-[0.4em]" error={formState.errors.code?.message} {...register('code')} />
        <Input label="Password" type="password" autoComplete="new-password" hint="At least 8 characters." error={formState.errors.password?.message} {...register('password')} />
        <Input label="Type it again" type="password" autoComplete="new-password" error={formState.errors.confirm?.message} {...register('confirm')} />
        {error ? <ErrorBox error={error} /> : null}
        <Button type="submit" loading={formState.isSubmitting} className="mt-2 h-12">
          Save password and sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export default function Page() {
  return (
    <Suspense>
      <SetPassword />
    </Suspense>
  );
}
