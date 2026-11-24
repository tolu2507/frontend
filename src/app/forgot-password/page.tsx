'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthShell } from '@/components/auth/AuthShell';
import { Button, ErrorBox, Input } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { homeFor, useAuth, type Session } from '@/lib/auth';

// TEMP (until Resend is connected): reset straight away with email + new password, no emailed code.
// The old code flow is commented out below — restore it and delete the instant version once email works.
const schema = z
  .object({
    identifier: z.string().trim().email('Enter the email on your account.'),
    password: z.string().min(8, 'Use at least 8 characters.'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'The passwords don’t match.' });

export default function ForgotPasswordPage() {
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);
  const [error, setError] = useState<unknown>(null);
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(schema), defaultValues: { identifier: '', password: '', confirm: '' } });

  const onSubmit = handleSubmit(async ({ identifier, password }) => {
    setError(null);
    try {
      const session = await api<Session>('/auth/reset-password', { body: { identifier: identifier.toLowerCase(), password } });
      signIn(session);
      toast.success('Password saved. Welcome back!');
      router.replace(homeFor(session.user));
    } catch (e) {
      setError(e);
    }
  });

  // --- Code flow: re-enable once Resend is connected ---
  // const onSubmit = handleSubmit(async ({ identifier }) => {
  //   setError(null);
  //   try {
  //     const id = identifier.toLowerCase();
  //     await api('/auth/forgot-password', { body: { identifier: id } });
  //     router.push(`/set-password?mode=reset&email=${encodeURIComponent(id)}`);
  //   } catch (e) {
  //     setError(e);
  //   }
  // });

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter the email on your account and choose a new password."
      // subtitle="We’ll send a 6-digit code to your email (or WhatsApp, for a phone number)."
      footer={
        <Link href="/login" className="font-bold text-violet-700 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Input label="Email" type="email" autoComplete="username" autoFocus error={formState.errors.identifier?.message} {...register('identifier')} />
        <Input label="New password" type="password" autoComplete="new-password" hint="At least 8 characters." error={formState.errors.password?.message} {...register('password')} />
        <Input label="Type it again" type="password" autoComplete="new-password" error={formState.errors.confirm?.message} {...register('confirm')} />
        {error ? <ErrorBox error={error} /> : null}
        <Button type="submit" loading={formState.isSubmitting} className="mt-2 h-12">
          Save password and sign in
          {/* Send me a code */}
        </Button>
      </form>
    </AuthShell>
  );
}
