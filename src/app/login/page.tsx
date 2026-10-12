'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthShell } from '@/components/auth/AuthShell';
import { Button, ErrorBox, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { homeFor, useAuth, type Session } from '@/lib/auth';

const schema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or phone number.'),
  password: z.string().min(1, 'Enter your password.'),
});

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn } = useAuth();
  const [error, setError] = useState<unknown>(null);
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(schema), defaultValues: { identifier: '', password: '' } });

  useEffect(() => {
    if (user) router.replace(homeFor(user));
  }, [user, router]);

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      const session = await api<Session>('/auth/login', { body: { identifier: v.identifier.toLowerCase(), password: v.password } });
      signIn(session);
      router.replace(homeFor(session.user));
    } catch (e) {
      setError(e);
    }
  });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your school’s dashboard."
      footer={
        <>
          New school?{' '}
          <Link href="/#demo" className="font-bold text-violet-700 hover:underline">
            Book a demo
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Input label="Email or phone number" autoComplete="username" autoFocus error={formState.errors.identifier?.message} {...register('identifier')} />
        <Input label="Password" type="password" autoComplete="current-password" error={formState.errors.password?.message} {...register('password')} />
        {error ? <ErrorBox error={error} /> : null}
        <Button type="submit" loading={formState.isSubmitting} className="mt-2 h-12">
          Sign in
        </Button>
        <div className="flex flex-wrap justify-between gap-2 text-[15px]">
          <Link href="/forgot-password" className="font-bold text-violet-700 hover:underline">
            Forgot password?
          </Link>
          <Link href="/set-password" className="font-bold text-violet-700 hover:underline">
            Got an invite code?
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
